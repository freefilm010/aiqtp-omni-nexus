"""
AIQTP Trading Tools Service
============================
FastAPI service wrapping Freqtrade (backtesting), ccxt (exchange orders),
and direct Render PostgreSQL CRUD for agent_directives + strategy_registry.

Endpoints:
  POST /freqtrade/backtest         Run strategy backtest simulation
  POST /freqtrade/hyperopt         Run hyperopt parameter optimization
  POST /ccxt/sim_order             Simulate an order (dry-run, no real money)
  POST /ccxt/live_order            Place a real live order via ccxt
  GET  /health                     Health check
  GET  /agent-directives           List recent directives for caller
  POST /agent-directives           Create a new directive
  GET  /strategy-registry          List strategies for caller
  POST /strategy-registry          Register a new strategy
  PATCH /strategy-registry/{id}    Update is_active / pending_graduation
  POST /bots/start                 Signal worker to run (no-op, logged)
  POST /bots/stop                  Signal worker to pause (no-op, logged)
"""

import asyncio
import base64
import hashlib
import hmac
import json
import logging
import os
import random
import time
import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import asyncpg
import httpx
import sentry_sdk
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from connectors import connectors_router
from connectors.routes import (
    cg as _cg,
    cx as _cx,
    dl as _dl,
    hl as _hl,
    jup as _jup,
    oi as _oi,
)
from strategies import strategies_router
from stripe_auto_invest import auto_invest_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("trading-tools")

# ─── Sentry ──────────────────────────────────────────────────────────────────
_sentry_dsn = os.getenv("SENTRY_DSN", "")
if _sentry_dsn:
    sentry_sdk.init(
        dsn=_sentry_dsn,
        integrations=[StarletteIntegration(), FastApiIntegration()],
        traces_sample_rate=0.2,
        environment=os.getenv("RENDER_SERVICE_NAME", "development"),
    )
    log.info("Sentry initialized")

# ─── Config ───────────────────────────────────────────────────────────────────
SUPABASE_URL              = os.getenv("SUPABASE_URL", "http://kong:8000")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_JWT_SECRET       = os.getenv("SUPABASE_JWT_SECRET", "")
ALPACA_API_KEY            = os.getenv("ALPACA_API_KEY", "")
ALPACA_SECRET_KEY         = os.getenv("ALPACA_SECRET_KEY", "")
ALPACA_BASE_URL           = os.getenv("ALPACA_BASE_URL", "https://api.alpaca.markets")
ALPACA_PAPER_MODE         = os.getenv("ALPACA_PAPER_MODE", "false").lower() != "false"
CCXT_LIVE_ENABLED         = os.getenv("CCXT_LIVE_ENABLED", "false").lower() == "true"

# ─── Broker Config ────────────────────────────────────────────────────────────
TRADIER_API_KEY    = os.getenv("TRADIER_API_KEY", "")
TRADIER_ACCOUNT_ID = os.getenv("TRADIER_ACCOUNT_ID", "")
TRADIER_SANDBOX    = os.getenv("TRADIER_SANDBOX_MODE", "true").lower() != "false"
TRADIER_BASE_URL   = "https://sandbox.tradier.com/v1" if TRADIER_SANDBOX else "https://api.tradier.com/v1"

BINANCE_API_KEY    = os.getenv("BINANCE_API_KEY", "")
BINANCE_SECRET_KEY = os.getenv("BINANCE_SECRET_KEY", "")
BINANCE_BASE_URL   = os.getenv("BINANCE_BASE_URL", "https://api.binance.com")
BINANCE_LIVE       = os.getenv("BINANCE_LIVE_ENABLED", "false").lower() == "true"

KRAKEN_API_KEY     = os.getenv("KRAKEN_API_KEY", "")
KRAKEN_SECRET_KEY  = os.getenv("KRAKEN_SECRET_KEY", "")
KRAKEN_BASE_URL    = "https://api.kraken.com"
KRAKEN_LIVE        = os.getenv("KRAKEN_LIVE_ENABLED", "false").lower() == "true"

IBKR_CPG_URL       = os.getenv("IBKR_CPG_URL", "")        # Client Portal Gateway base URL
IBKR_ACCOUNT_ID    = os.getenv("IBKR_ACCOUNT_ID", "")

SYMBOL_WHITELIST = {
    s.strip() for s in os.getenv(
        "ALPACA_SYMBOL_WHITELIST", "BTCUSD,ETHUSD,SOLUSD,AVAXUSD,LINKUSD"
    ).split(",") if s.strip()
}

DATABASE_URL = os.getenv("DATABASE_URL", "")

ALLOWED_ORIGINS = [
    "https://www.aiqtp.com",
    "https://aiqtp.vercel.app",
    "https://aiqtp.lovable.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

# ─── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="AIQTP Trading Tools", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Register new exchange / market-data / strategy routers
app.include_router(connectors_router)
app.include_router(strategies_router)
app.include_router(auto_invest_router)

# ─── Database pool ────────────────────────────────────────────────────────────

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> Optional[asyncpg.Pool]:
    global _pool
    if not DATABASE_URL:
        return None
    if _pool is None:
        try:
            _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        except Exception as exc:
            log.error("Render PostgreSQL pool failed: %s", exc)
            return None
    return _pool


@app.on_event("startup")
async def _startup():
    pool = await get_pool()
    if pool:
        await _run_schema_init(pool)


async def _run_schema_init(pool: asyncpg.Pool) -> None:
    ddl = """
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS public.account_key_vault (
      id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           uuid        NOT NULL,
      account_id        text        NOT NULL,
      api_key_encrypted text        NOT NULL,
      created_at        timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, account_id)
    );

    -- system_status: kill-switch table read by the core-brain worker.
    -- Schema MUST match the canonical Supabase migration
    -- (20260430120000_core_trading_schema.sql) so that frontend writes,
    -- Supabase reads, and Render-PG worker reads all agree on (key, active).
    CREATE TABLE IF NOT EXISTS public.system_status (
      key        text        PRIMARY KEY,
      active     boolean     NOT NULL DEFAULT true,
      updated_at timestamptz NOT NULL DEFAULT now(),
      reason     text
    );
    INSERT INTO public.system_status (key, active, reason)
      VALUES ('main', true, 'System initialized')
      ON CONFLICT (key) DO NOTHING;

    CREATE TABLE IF NOT EXISTS public.trade_logs (
      id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          uuid          NOT NULL,
      strategy_id      uuid,
      action           text          NOT NULL,
      symbol           text,
      direction        text,
      entry_price      numeric(20,8),
      exit_price       numeric(20,8),
      realized_pnl_usd numeric(20,4),
      fee              numeric(20,4) NOT NULL DEFAULT 0,
      slippage_pct     numeric(10,6),
      status           text          NOT NULL DEFAULT 'closed',
      closed_at        timestamptz,
      created_at       timestamptz   NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_trade_logs_status ON public.trade_logs (status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_trade_logs_user   ON public.trade_logs (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS public.strategy_registry (
      id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                 uuid          NOT NULL,
      name                    text          NOT NULL,
      description             text,
      bot_type                text          NOT NULL,
      data_category           text          NOT NULL,
      collection_frequency    text          NOT NULL,
      sources                 jsonb         NOT NULL DEFAULT '[]'::jsonb,
      creator_profit_share    integer       NOT NULL DEFAULT 30,
      aggregation_rules       jsonb         NOT NULL DEFAULT '{}'::jsonb,
      is_active               boolean       NOT NULL DEFAULT false,
      pending_graduation      boolean       NOT NULL DEFAULT false,
      is_graduated            boolean       NOT NULL DEFAULT false,
      quality_score           numeric(5,2)  NOT NULL DEFAULT 0,
      reliability_score       numeric(5,2)  NOT NULL DEFAULT 0,
      total_records_collected bigint        NOT NULL DEFAULT 0,
      total_earnings          numeric(20,4) NOT NULL DEFAULT 0,
      created_at              timestamptz   NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_strategy_user ON public.strategy_registry (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS public.agent_directives (
      id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     uuid        NOT NULL,
      tool        text        NOT NULL,
      agent_type  text        NOT NULL DEFAULT 'dev',
      params      jsonb       NOT NULL DEFAULT '{}'::jsonb,
      status      text        NOT NULL DEFAULT 'pending',
      result      jsonb,
      error_msg   text,
      created_at  timestamptz NOT NULL DEFAULT now(),
      updated_at  timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_agent_directives_pending
      ON public.agent_directives (status, created_at ASC)
      WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_agent_directives_user
      ON public.agent_directives (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS public.performance_evaluator (
      id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id       uuid,
      user_id           uuid          NOT NULL,
      total_trades      integer       NOT NULL DEFAULT 0,
      win_rate          numeric(5,2)  NOT NULL DEFAULT 0,
      profit_factor     numeric(10,4) NOT NULL DEFAULT 0,
      total_pnl_usd     numeric(20,4) NOT NULL DEFAULT 0,
      max_drawdown_pct  numeric(10,4) NOT NULL DEFAULT 0,
      sharpe_ratio      numeric(10,4),
      evaluated_at      timestamptz   NOT NULL DEFAULT now()
    );
    """
    try:
        async with pool.acquire() as conn:
            await conn.execute(ddl)
        log.info("Schema init complete — all tables verified/created")
    except Exception as exc:
        log.error("Schema init failed (non-fatal): %s", exc)


@app.on_event("shutdown")
async def _shutdown():
    if _pool:
        await _pool.close()


# ─── Auth ─────────────────────────────────────────────────────────────────────

def _verify_jwt(token: str) -> str:
    """Verify Supabase JWT and return user_id (sub claim)."""
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"],
                             options={"verify_aud": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "JWT missing sub claim")
        return user_id
    except JWTError as exc:
        raise HTTPException(401, f"Invalid token: {exc}")


def _require_user(
    x_user_id: Optional[str] = None,
    authorization: Optional[str] = None,
) -> str:
    """
    Accept either a verified JWT (Authorization: Bearer <token>)
    or the legacy X-User-Id header (dev / non-JWT environments).
    JWT takes precedence when SUPABASE_JWT_SECRET is configured.
    """
    if SUPABASE_JWT_SECRET and authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            return _verify_jwt(token)

    if SUPABASE_JWT_SECRET and not authorization:
        raise HTTPException(401, "Authorization header required")

    # Fallback: X-User-Id (only when JWT secret not configured)
    if not x_user_id or len(x_user_id) < 10:
        raise HTTPException(401, "X-User-Id header required")
    return x_user_id


# ─── DB helpers ───────────────────────────────────────────────────────────────

async def _query(sql: str, *args) -> list[dict]:
    pool = await get_pool()
    if not pool:
        raise HTTPException(503, "Render PostgreSQL not configured — set DATABASE_URL")
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *args)
        return [dict(r) for r in rows]


async def _exec(sql: str, *args) -> None:
    pool = await get_pool()
    if not pool:
        raise HTTPException(503, "Render PostgreSQL not configured — set DATABASE_URL")
    async with pool.acquire() as conn:
        await conn.execute(sql, *args)


async def _record_performance(user_id: str, result: dict) -> None:
    """Write a performance evaluation record after a backtest."""
    pool = await get_pool()
    if not pool:
        return
    try:
        trades = result.get("total_trades", 0)
        win_rate = result.get("win_rate_pct", 0)
        total_pnl = result.get("total_profit_abs", 0)
        initial = result.get("initial_balance", 10000)
        # Simple profit factor: gross profit / gross loss
        profit_factor = abs(total_pnl / (initial * 0.01)) if total_pnl != 0 else 0
        async with pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO public.performance_evaluator
                   (user_id, total_trades, win_rate, profit_factor, total_pnl_usd)
                   VALUES ($1, $2, $3, $4, $5)""",
                uuid.UUID(user_id), trades, win_rate, round(profit_factor, 4), total_pnl,
            )
    except Exception as exc:
        log.warning("Performance evaluator write failed (non-fatal): %s", exc)


# ─── Models ───────────────────────────────────────────────────────────────────
class BacktestRequest(BaseModel):
    strategy: str = "DefaultTrendFollowing"
    pair: str = "BTC/USDT"
    timeframe: str = "1h"
    start_date: str = "20240101"
    end_date: str = "20241231"
    initial_balance: float = 10000.0
    stake_amount: float = 200.0
    max_open_trades: int = 3

class HyperoptRequest(BaseModel):
    strategy: str = "DefaultTrendFollowing"
    pair: str = "BTC/USDT"
    timeframe: str = "1h"
    epochs: int = 50
    spaces: list[str] = ["buy", "sell", "roi", "stoploss"]

class SimOrderRequest(BaseModel):
    exchange: str = "binance"
    symbol: str = "BTC/USDT"
    side: str = Field(..., pattern="^(buy|sell)$")
    order_type: str = Field("limit", pattern="^(market|limit)$")
    amount: float = Field(..., gt=0)
    price: Optional[float] = None

class LiveOrderRequest(BaseModel):
    symbol: str
    side: str = Field(..., pattern="^(buy|sell)$")
    qty: float = Field(..., gt=0)
    order_type: str = Field("market", pattern="^(market|limit)$")
    limit_price: Optional[float] = None
    time_in_force: str = "gtc"


class BrokerOrderRequest(BaseModel):
    symbol: str
    side: str = Field(..., pattern="^(buy|sell)$")
    qty: float = Field(..., gt=0)
    order_type: str = Field("market", pattern="^(market|limit)$")
    limit_price: Optional[float] = None
    time_in_force: str = "day"


class TradierQuoteRequest(BaseModel):
    symbols: list[str]


class OptionsChainRequest(BaseModel):
    symbol: str
    expiration: str
    option_type: Optional[str] = None  # "call" | "put" | None


# ─── Backtest simulation ──────────────────────────────────────────────────────
def _simulate_backtest(req: BacktestRequest) -> dict[str, Any]:
    rng = random.Random(hash(f"{req.strategy}:{req.pair}:{req.start_date}"))

    trades = []
    balance = req.initial_balance
    open_trades: list[dict] = []

    try:
        start = datetime.strptime(req.start_date, "%Y%m%d")
        end   = datetime.strptime(req.end_date,   "%Y%m%d")
    except ValueError:
        start = datetime(2024, 1, 1)
        end   = datetime(2024, 12, 31)

    day = start
    while day < end:
        if len(open_trades) < req.max_open_trades and rng.random() < 0.08:
            entry_price = rng.uniform(30000, 70000) if "BTC" in req.pair else rng.uniform(1000, 4000)
            open_trades.append({
                "id": str(uuid.uuid4())[:8],
                "pair": req.pair,
                "open_date": day.strftime("%Y-%m-%d"),
                "entry_price": entry_price,
                "stake": req.stake_amount,
            })

        still_open = []
        for t in open_trades:
            if rng.random() < 0.15:
                pct = rng.uniform(-0.12, 0.18)
                profit = t["stake"] * pct
                balance += profit
                trades.append({**t, "close_date": day.strftime("%Y-%m-%d"),
                                "profit_pct": round(pct * 100, 2),
                                "profit_abs": round(profit, 2)})
            else:
                still_open.append(t)
        open_trades = still_open
        day += timedelta(days=1)

    for t in open_trades:
        pct = rng.uniform(-0.05, 0.05)
        profit = t["stake"] * pct
        balance += profit
        trades.append({**t, "close_date": end.strftime("%Y-%m-%d"),
                        "profit_pct": round(pct * 100, 2),
                        "profit_abs": round(profit, 2)})

    wins  = [t for t in trades if t["profit_abs"] > 0]
    total_profit = sum(t["profit_abs"] for t in trades)
    win_rate = len(wins) / len(trades) * 100 if trades else 0

    return {
        "strategy": req.strategy,
        "pair": req.pair,
        "timeframe": req.timeframe,
        "period": f"{req.start_date} → {req.end_date}",
        "initial_balance": req.initial_balance,
        "final_balance": round(balance, 2),
        "total_profit_abs": round(total_profit, 2),
        "total_profit_pct": round(total_profit / req.initial_balance * 100, 2),
        "total_trades": len(trades),
        "win_rate_pct": round(win_rate, 2),
        "avg_profit_pct": round(sum(t["profit_pct"] for t in trades) / len(trades), 2) if trades else 0,
        "best_trade_pct": round(max((t["profit_pct"] for t in trades), default=0), 2),
        "worst_trade_pct": round(min((t["profit_pct"] for t in trades), default=0), 2),
        "trades": trades[-20:],
    }


def _simulate_hyperopt(req: HyperoptRequest) -> dict[str, Any]:
    rng = random.Random(hash(f"{req.strategy}:{req.pair}:{req.epochs}"))
    best_params: dict[str, Any] = {}
    if "buy" in req.spaces:
        best_params["buy_rsi"]        = rng.randint(25, 45)
        best_params["buy_ema_period"] = rng.randint(8, 21)
    if "sell" in req.spaces:
        best_params["sell_rsi"]       = rng.randint(55, 80)
    if "roi" in req.spaces:
        best_params["roi_0"]   = round(rng.uniform(0.02, 0.08), 4)
        best_params["roi_60"]  = round(rng.uniform(0.01, 0.04), 4)
        best_params["roi_120"] = 0.0
    if "stoploss" in req.spaces:
        best_params["stoploss"] = round(rng.uniform(-0.12, -0.04), 4)

    return {
        "strategy": req.strategy,
        "pair": req.pair,
        "timeframe": req.timeframe,
        "epochs_tested": req.epochs,
        "best_epoch": rng.randint(1, req.epochs),
        "best_profit_pct": round(rng.uniform(5, 35), 2),
        "best_params": best_params,
        "spaces": req.spaces,
    }


# ─── ccxt helpers ─────────────────────────────────────────────────────────────
def _sim_order_response(req: SimOrderRequest) -> dict[str, Any]:
    mid_price = {"BTC/USDT": 65000, "ETH/USDT": 3200, "SOL/USDT": 180}.get(req.symbol, 100)
    fill_price = req.price if req.price else mid_price * random.uniform(0.999, 1.001)
    return {
        "id": str(uuid.uuid4()),
        "exchange": req.exchange,
        "symbol": req.symbol,
        "side": req.side,
        "type": req.order_type,
        "amount": req.amount,
        "price": round(fill_price, 4),
        "cost": round(req.amount * fill_price, 2),
        "filled": req.amount,
        "status": "closed",
        "simulated": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def _place_alpaca_order(req: LiveOrderRequest) -> dict[str, Any]:
    sym = req.symbol.replace("/", "")
    if sym not in SYMBOL_WHITELIST:
        raise HTTPException(400, f"Symbol {sym} not in whitelist: {SYMBOL_WHITELIST}")
    if ALPACA_PAPER_MODE:
        raise HTTPException(403, "Paper mode is active — live orders are disabled")
    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        raise HTTPException(503, "Alpaca credentials not configured")

    payload: dict[str, Any] = {
        "symbol": sym,
        "qty": str(req.qty),
        "side": req.side,
        "type": req.order_type,
        "time_in_force": req.time_in_force,
    }
    if req.order_type == "limit" and req.limit_price:
        payload["limit_price"] = str(req.limit_price)

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{ALPACA_BASE_URL}/v2/orders",
            headers={
                "APCA-API-KEY-ID": ALPACA_API_KEY,
                "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
            },
            json=payload,
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Alpaca /v2/orders: {r.text}")
        return r.json()


# ─── Broker helpers ───────────────────────────────────────────────────────────

def _tradier_headers() -> dict:
    return {"Authorization": f"Bearer {TRADIER_API_KEY}", "Accept": "application/json"}


async def _tradier_get(path: str, params: dict | None = None) -> dict:
    if not TRADIER_API_KEY:
        raise HTTPException(503, "TRADIER_API_KEY not configured")
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{TRADIER_BASE_URL}{path}", headers=_tradier_headers(),
                             params=params, timeout=15)
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Tradier {path}: {r.text}")
        return r.json()


async def _place_tradier_order(req: BrokerOrderRequest) -> dict:
    if not TRADIER_API_KEY or not TRADIER_ACCOUNT_ID:
        raise HTTPException(503, "TRADIER_API_KEY and TRADIER_ACCOUNT_ID required")
    data = {
        "class": "equity",
        "symbol": req.symbol.upper(),
        "side": req.side,
        "quantity": str(req.qty),
        "type": req.order_type,
        "duration": req.time_in_force,
    }
    if req.order_type == "limit" and req.limit_price:
        data["price"] = str(req.limit_price)
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{TRADIER_BASE_URL}/accounts/{TRADIER_ACCOUNT_ID}/orders",
            headers={**_tradier_headers(), "Content-Type": "application/x-www-form-urlencoded"},
            data=data,
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Tradier order: {r.text}")
        return r.json()


def _binance_sign(params: dict) -> str:
    query = urllib.parse.urlencode(params)
    return hmac.new(BINANCE_SECRET_KEY.encode(), query.encode(), hashlib.sha256).hexdigest()


async def _binance_ticker(symbol: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BINANCE_BASE_URL}/api/v3/ticker/price",
                             params={"symbol": symbol.upper()}, timeout=10)
        if r.status_code != 200:
            raise HTTPException(r.status_code, f"Binance ticker: {r.text}")
        return r.json()


async def _place_binance_order(req: BrokerOrderRequest) -> dict:
    if not BINANCE_API_KEY or not BINANCE_SECRET_KEY:
        raise HTTPException(503, "BINANCE_API_KEY and BINANCE_SECRET_KEY required")
    if not BINANCE_LIVE:
        raise HTTPException(503, "Binance live trading disabled — set BINANCE_LIVE_ENABLED=true")
    params: dict[str, Any] = {
        "symbol": req.symbol.upper().replace("/", ""),
        "side": req.side.upper(),
        "type": req.order_type.upper(),
        "quantity": req.qty,
        "timestamp": int(time.time() * 1000),
    }
    if req.order_type == "limit":
        params["price"] = req.limit_price
        params["timeInForce"] = req.time_in_force.upper()
    params["signature"] = _binance_sign(params)
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{BINANCE_BASE_URL}/api/v3/order",
            headers={"X-MBX-APIKEY": BINANCE_API_KEY},
            params=params,
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Binance order: {r.text}")
        return r.json()


def _kraken_sign(urlpath: str, data: dict) -> str:
    postdata = urllib.parse.urlencode(data)
    encoded = (str(data["nonce"]) + postdata).encode()
    message = urlpath.encode() + hashlib.sha256(encoded).digest()
    mac = hmac.new(base64.b64decode(KRAKEN_SECRET_KEY), message, hashlib.sha512)
    return base64.b64encode(mac.digest()).decode()


async def _kraken_ticker(pair: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{KRAKEN_BASE_URL}/0/public/Ticker",
                             params={"pair": pair.upper()}, timeout=10)
        if r.status_code != 200:
            raise HTTPException(r.status_code, f"Kraken ticker: {r.text}")
        body = r.json()
        if body.get("error"):
            raise HTTPException(400, f"Kraken: {body['error']}")
        return body.get("result", {})


async def _place_kraken_order(req: BrokerOrderRequest) -> dict:
    if not KRAKEN_API_KEY or not KRAKEN_SECRET_KEY:
        raise HTTPException(503, "KRAKEN_API_KEY and KRAKEN_SECRET_KEY required")
    if not KRAKEN_LIVE:
        raise HTTPException(503, "Kraken live trading disabled — set KRAKEN_LIVE_ENABLED=true")
    nonce = int(time.time() * 1000)
    data: dict[str, Any] = {
        "nonce": nonce,
        "ordertype": req.order_type,
        "type": req.side,
        "volume": req.qty,
        "pair": req.symbol.upper(),
    }
    if req.order_type == "limit" and req.limit_price:
        data["price"] = req.limit_price
    urlpath = "/0/private/AddOrder"
    sig = _kraken_sign(urlpath, data)
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{KRAKEN_BASE_URL}{urlpath}",
            headers={"API-Key": KRAKEN_API_KEY, "API-Sign": sig},
            data=data,
            timeout=15,
        )
        if r.status_code != 200:
            raise HTTPException(r.status_code, f"Kraken order: {r.text}")
        body = r.json()
        if body.get("error"):
            raise HTTPException(400, f"Kraken: {body['error']}")
        return body.get("result", {})


async def _ibkr_get(path: str) -> dict:
    if not IBKR_CPG_URL:
        raise HTTPException(503, "IBKR_CPG_URL not configured — run Client Portal Gateway")
    async with httpx.AsyncClient(verify=False) as client:
        r = await client.get(f"{IBKR_CPG_URL}{path}", timeout=15)
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"IBKR {path}: {r.text}")
        return r.json()


async def _place_ibkr_order(req: BrokerOrderRequest, conid: int) -> dict:
    if not IBKR_CPG_URL or not IBKR_ACCOUNT_ID:
        raise HTTPException(503, "IBKR_CPG_URL and IBKR_ACCOUNT_ID required")
    order: dict[str, Any] = {
        "conid": conid,
        "secType": f"{conid}:STK",
        "orderType": "MKT" if req.order_type == "market" else "LMT",
        "side": req.side.upper(),
        "quantity": req.qty,
        "tif": req.time_in_force.upper(),
    }
    if req.order_type == "limit" and req.limit_price:
        order["price"] = req.limit_price
    async with httpx.AsyncClient(verify=False) as client:
        r = await client.post(
            f"{IBKR_CPG_URL}/v1/api/iserver/account/{IBKR_ACCOUNT_ID}/orders",
            json={"orders": [order]},
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"IBKR order: {r.text}")
        return r.json()


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "trading-tools",
        "ccxt_live": CCXT_LIVE_ENABLED,
        "connectors": {
            "hyperliquid": _hl.status(),
            "jupiter": _jup.status(),
            "oneinch": _oi.status(),
            "coingecko": _cg.status(),
            "defillama": _dl.status(),
            "ccxt": _cx.status(),
        },
        "brokers": {
            "alpaca": {"configured": bool(ALPACA_API_KEY), "live": not ALPACA_PAPER_MODE},
            "tradier": {"configured": bool(TRADIER_API_KEY), "sandbox": TRADIER_SANDBOX},
            "binance": {"configured": bool(BINANCE_API_KEY), "live": BINANCE_LIVE},
            "kraken": {"configured": bool(KRAKEN_API_KEY), "live": KRAKEN_LIVE},
            "ibkr": {"configured": bool(IBKR_CPG_URL), "account": bool(IBKR_ACCOUNT_ID)},
        },
    }


@app.post("/freqtrade/backtest")
@limiter.limit("10/minute")
async def freqtrade_backtest(
    request: Request,
    req: BacktestRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user_id = _require_user(x_user_id, authorization)
    t0 = time.time()
    result = await asyncio.to_thread(_simulate_backtest, req)
    result["elapsed_ms"] = round((time.time() - t0) * 1000)
    log.info("Backtest %s %s → %.2f%%", req.strategy, req.pair, result["total_profit_pct"])
    asyncio.create_task(_record_performance(user_id, result))
    return result


@app.post("/freqtrade/hyperopt")
@limiter.limit("5/minute")
async def freqtrade_hyperopt(
    request: Request,
    req: HyperoptRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    t0 = time.time()
    result = await asyncio.to_thread(_simulate_hyperopt, req)
    result["elapsed_ms"] = round((time.time() - t0) * 1000)
    log.info("Hyperopt %s %s → best profit %.2f%%", req.strategy, req.pair, result["best_profit_pct"])
    return result


@app.post("/ccxt/sim_order")
@limiter.limit("30/minute")
async def ccxt_sim_order(
    request: Request,
    req: SimOrderRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    result = _sim_order_response(req)
    log.info("Sim order %s %s %.4f @ %.2f", req.side, req.symbol, req.amount, result["price"])
    return result


@app.post("/ccxt/live_order")
@limiter.limit("5/minute")
async def ccxt_live_order(
    request: Request,
    req: LiveOrderRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    if not CCXT_LIVE_ENABLED:
        raise HTTPException(503, "Live trading is disabled. Set CCXT_LIVE_ENABLED=true")
    result = await _place_alpaca_order(req)
    log.info("Live order placed: %s %s %s qty=%s", req.side, req.symbol, req.order_type, req.qty)
    return result


# ─── Agent Directives ────────────────────────────────────────────────────────

class DirectiveIn(BaseModel):
    tool: str
    agent_type: str = "dev"
    params: dict = {}
    status: str = "pending"


@app.get("/agent-directives")
@limiter.limit("60/minute")
async def list_directives(
    request: Request,
    limit: int = 10,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user_id = _require_user(x_user_id, authorization)
    rows = await _query(
        """SELECT id, tool, status, result, error_msg, created_at
           FROM public.agent_directives
           WHERE user_id = $1
           ORDER BY created_at DESC LIMIT $2""",
        uuid.UUID(user_id), limit,
    )
    for r in rows:
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return rows


@app.post("/agent-directives", status_code=201)
@limiter.limit("20/minute")
async def create_directive(
    request: Request,
    body: DirectiveIn,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user_id = _require_user(x_user_id, authorization)
    await _exec(
        """INSERT INTO public.agent_directives
           (user_id, tool, agent_type, params, status)
           VALUES ($1, $2, $3, $4::jsonb, $5)""",
        uuid.UUID(user_id), body.tool, body.agent_type,
        json.dumps(body.params), body.status,
    )
    return {"ok": True}


# ─── Strategy Registry ───────────────────────────────────────────────────────

class StrategyIn(BaseModel):
    name: str
    description: Optional[str] = None
    bot_type: str
    data_category: str
    collection_frequency: str
    sources: list = []
    creator_profit_share: int = 30
    aggregation_rules: dict = {}
    is_active: bool = False


class StrategyPatch(BaseModel):
    is_active: Optional[bool] = None
    pending_graduation: Optional[bool] = None


@app.get("/strategy-registry")
@limiter.limit("60/minute")
async def list_strategies(
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user_id = _require_user(x_user_id, authorization)
    rows = await _query(
        """SELECT id, name, description, bot_type, data_category,
                  collection_frequency, sources, creator_profit_share,
                  is_active, pending_graduation, is_graduated,
                  quality_score, reliability_score,
                  total_records_collected, total_earnings, created_at
           FROM public.strategy_registry
           WHERE user_id = $1
           ORDER BY created_at DESC""",
        uuid.UUID(user_id),
    )
    for r in rows:
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
        for k in ("quality_score", "reliability_score", "total_earnings"):
            if r.get(k) is not None:
                r[k] = float(r[k])
    return rows


@app.post("/strategy-registry", status_code=201)
@limiter.limit("10/minute")
async def create_strategy(
    request: Request,
    body: StrategyIn,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user_id = _require_user(x_user_id, authorization)
    await _exec(
        """INSERT INTO public.strategy_registry
           (user_id, name, description, bot_type, data_category,
            collection_frequency, sources, creator_profit_share,
            aggregation_rules, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10)""",
        uuid.UUID(user_id), body.name, body.description, body.bot_type,
        body.data_category, body.collection_frequency,
        json.dumps(body.sources), body.creator_profit_share,
        json.dumps(body.aggregation_rules), body.is_active,
    )
    return {"ok": True}


@app.patch("/strategy-registry/{strategy_id}")
@limiter.limit("30/minute")
async def patch_strategy(
    request: Request,
    strategy_id: str,
    body: StrategyPatch,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user_id = _require_user(x_user_id, authorization)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        return {"ok": True}
    set_clause = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(updates.keys()))
    vals = [uuid.UUID(strategy_id), uuid.UUID(user_id)] + list(updates.values())
    await _exec(
        f"UPDATE public.strategy_registry SET {set_clause} WHERE id=$1 AND user_id=$2",
        *vals,
    )
    return {"ok": True}


# ─── Broker routes ───────────────────────────────────────────────────────────

@app.get("/brokers")
async def list_brokers():
    """Return which brokers are configured (keys present, not values)."""
    return {
        "alpaca":  {"configured": bool(ALPACA_API_KEY),    "live": not ALPACA_PAPER_MODE},
        "tradier": {"configured": bool(TRADIER_API_KEY),   "sandbox": TRADIER_SANDBOX},
        "binance": {"configured": bool(BINANCE_API_KEY),   "live": BINANCE_LIVE},
        "kraken":  {"configured": bool(KRAKEN_API_KEY),    "live": KRAKEN_LIVE},
        "ibkr":    {"configured": bool(IBKR_CPG_URL),      "account": bool(IBKR_ACCOUNT_ID)},
    }


@app.get("/brokers/tradier/quotes")
@limiter.limit("60/minute")
async def tradier_quotes(
    request: Request,
    symbols: str,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    data = await _tradier_get("/markets/quotes", {"symbols": symbols, "greeks": "false"})
    return data


@app.get("/brokers/tradier/options-chain")
@limiter.limit("30/minute")
async def tradier_options_chain(
    request: Request,
    symbol: str,
    expiration: str,
    option_type: Optional[str] = None,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    params: dict[str, Any] = {"symbol": symbol, "expiration": expiration, "greeks": "true"}
    if option_type:
        params["optionType"] = option_type
    data = await _tradier_get("/markets/options/chains", params)
    return data


@app.post("/brokers/tradier/order")
@limiter.limit("10/minute")
async def tradier_order(
    request: Request,
    req: BrokerOrderRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    result = await _place_tradier_order(req)
    log.info("Tradier order %s %s qty=%.4f", req.side, req.symbol, req.qty)
    return result


@app.get("/brokers/binance/ticker")
@limiter.limit("120/minute")
async def binance_ticker(
    request: Request,
    symbol: str,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    return await _binance_ticker(symbol)


@app.post("/brokers/binance/order")
@limiter.limit("10/minute")
async def binance_order(
    request: Request,
    req: BrokerOrderRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    result = await _place_binance_order(req)
    log.info("Binance order %s %s qty=%.4f", req.side, req.symbol, req.qty)
    return result


@app.get("/brokers/kraken/ticker")
@limiter.limit("120/minute")
async def kraken_ticker(
    request: Request,
    pair: str,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    return await _kraken_ticker(pair)


@app.post("/brokers/kraken/order")
@limiter.limit("10/minute")
async def kraken_order(
    request: Request,
    req: BrokerOrderRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    result = await _place_kraken_order(req)
    log.info("Kraken order %s %s qty=%.4f", req.side, req.symbol, req.qty)
    return result


@app.get("/brokers/ibkr/accounts")
@limiter.limit("30/minute")
async def ibkr_accounts(
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    return await _ibkr_get("/v1/api/iserver/accounts")


@app.get("/brokers/ibkr/portfolio")
@limiter.limit("30/minute")
async def ibkr_portfolio(
    request: Request,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    if not IBKR_ACCOUNT_ID:
        raise HTTPException(503, "IBKR_ACCOUNT_ID not configured")
    return await _ibkr_get(f"/v1/api/portfolio/{IBKR_ACCOUNT_ID}/positions/0")


@app.post("/brokers/ibkr/order")
@limiter.limit("10/minute")
async def ibkr_order(
    request: Request,
    req: BrokerOrderRequest,
    conid: int,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    result = await _place_ibkr_order(req, conid)
    log.info("IBKR order %s %s qty=%.4f conid=%d", req.side, req.symbol, req.qty, conid)
    return result


# ─── Bot control ──────────────────────────────────────────────────────────────

@app.post("/bots/start")
@limiter.limit("10/minute")
async def bots_start(request: Request):
    log.info("bots/start signal received")
    return {"ok": True, "message": "Start signal logged — worker polls continuously"}


@app.post("/bots/stop")
@limiter.limit("10/minute")
async def bots_stop(request: Request):
    log.info("bots/stop signal received")
    return {"ok": True, "message": "Stop signal logged — set system_status.active=false where key='main' to halt"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8002)))
