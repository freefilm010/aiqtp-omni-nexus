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

    CREATE TABLE IF NOT EXISTS public.system_status (
      id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      key        text        NOT NULL UNIQUE,
      value      text        NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    INSERT INTO public.system_status (key, value)
      VALUES ('trading_active', 'true')
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

    CREATE TABLE IF NOT EXISTS public.deposit_requests (
      id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           text        NOT NULL,
      amount_usd        numeric     NOT NULL,
      source            text,
      status            text        NOT NULL DEFAULT 'pending',
      session_id        text,
      stripe_session_id text,
      created_at        timestamptz NOT NULL DEFAULT now(),
      processed_at      timestamptz
    );
    ALTER TABLE public.deposit_requests
      ADD COLUMN IF NOT EXISTS source            text,
      ADD COLUMN IF NOT EXISTS session_id        text,
      ADD COLUMN IF NOT EXISTS stripe_session_id text,
      ADD COLUMN IF NOT EXISTS processed_at      timestamptz;

    CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
      id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          text        NOT NULL,
      amount_usd       numeric     NOT NULL,
      destination_type text,
      status           text        NOT NULL DEFAULT 'pending',
      created_at       timestamptz NOT NULL DEFAULT now(),
      processed_at     timestamptz
    );
    ALTER TABLE public.withdrawal_requests
      ADD COLUMN IF NOT EXISTS processed_at timestamptz;

    CREATE TABLE IF NOT EXISTS public.user_balances (
      user_id    text        PRIMARY KEY,
      balance_usd numeric    NOT NULL DEFAULT 0,
      updated_at  timestamptz NOT NULL DEFAULT now()
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
    return {"status": "ok", "service": "trading-tools", "ccxt_live": CCXT_LIVE_ENABLED}


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
    return {"ok": True, "message": "Stop signal logged — set system_status trading_active=false to halt"}


# ─── Payments (Stripe) ────────────────────────────────────────────────────────

STRIPE_SECRET_KEY      = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET  = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL           = os.getenv("FRONTEND_URL", "https://www.aiqtp.com")

# ─── Payments (PayPal) ────────────────────────────────────────────────────────

PAYPAL_CLIENT_ID     = os.getenv("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
PAYPAL_MODE          = os.getenv("PAYPAL_MODE", "live")  # "sandbox" | "live"
_PAYPAL_BASE_URL     = (
    "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox"
    else "https://api-m.paypal.com"
)


class CheckoutRequest(BaseModel):
    amount_usd: float = Field(..., gt=0)
    user_id: str
    destination_type: str = "stripe"


@app.post("/payments/create-checkout", status_code=201)
@limiter.limit("10/minute")
async def create_checkout(
    request: Request,
    body: CheckoutRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    if not STRIPE_SECRET_KEY:
        raise HTTPException(503, "STRIPE_SECRET_KEY not configured")

    amount_cents = int(round(body.amount_usd * 100))

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.stripe.com/v1/checkout/sessions",
            auth=(STRIPE_SECRET_KEY, ""),
            data={
                "mode": "payment",
                "success_url": f"{FRONTEND_URL}/dashboard?payment=success",
                "cancel_url":  f"{FRONTEND_URL}/dashboard?payment=cancelled",
                "line_items[0][price_data][currency]": "usd",
                "line_items[0][price_data][unit_amount]": str(amount_cents),
                "line_items[0][price_data][product_data][name]": "AIQTP Deposit",
                "line_items[0][quantity]": "1",
                "metadata[user_id]": body.user_id,
                "metadata[destination_type]": body.destination_type,
            },
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Stripe checkout: {r.text}")
        session = r.json()

    session_id = session["id"]
    checkout_url = session["url"]

    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """INSERT INTO public.deposit_requests
                       (user_id, amount_usd, destination_type, stripe_session_id, status, created_at)
                       VALUES ($1, $2, $3, $4, 'pending', now())
                       ON CONFLICT DO NOTHING""",
                    uuid.UUID(body.user_id),
                    body.amount_usd,
                    body.destination_type,
                    session_id,
                )
        except Exception as exc:
            log.warning("deposit_requests insert failed (non-fatal): %s", exc)

    log.info("Stripe checkout created session=%s user=%s amount=%.2f", session_id, body.user_id, body.amount_usd)
    return {"checkout_url": checkout_url, "session_id": session_id}


@app.post("/payments/webhook")
async def stripe_webhook(request: Request):
    """Stripe sends webhook events here — no JWT auth, verified by signature."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not STRIPE_WEBHOOK_SECRET:
        log.warning("STRIPE_WEBHOOK_SECRET not set — skipping signature verification")
    else:
        # Manual HMAC verification matching Stripe's v1 scheme
        try:
            parts = dict(part.split("=", 1) for part in sig_header.split(",") if "=" in part)
            timestamp = parts.get("t", "")
            v1_sig = parts.get("v1", "")
            signed_payload = f"{timestamp}.".encode() + payload
            expected = hmac.new(STRIPE_WEBHOOK_SECRET.encode(), signed_payload, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected, v1_sig):
                raise HTTPException(400, "Stripe signature mismatch")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(400, f"Stripe signature error: {exc}")

    try:
        event = json.loads(payload)
    except Exception:
        return {"ok": True}  # Stripe requirement: always 200

    event_type = event.get("type", "")
    log.info("Stripe webhook: %s", event_type)

    if event_type == "checkout.session.completed":
        session_obj = event.get("data", {}).get("object", {})
        session_id   = session_obj.get("id", "")
        user_id_str  = (session_obj.get("metadata") or {}).get("user_id", "")
        amount_total = session_obj.get("amount_total", 0)  # cents
        amount_usd   = amount_total / 100.0

        pool = await get_pool()
        if pool and user_id_str:
            try:
                async with pool.acquire() as conn:
                    await conn.execute(
                        """UPDATE public.deposit_requests
                           SET status = 'completed', updated_at = now()
                           WHERE stripe_session_id = $1""",
                        session_id,
                    )
                    await conn.execute(
                        """INSERT INTO public.user_balances (user_id, balance_usd, updated_at)
                           VALUES ($1, $2, now())
                           ON CONFLICT (user_id)
                           DO UPDATE SET balance_usd = user_balances.balance_usd + $2,
                                         updated_at  = now()""",
                        uuid.UUID(user_id_str),
                        amount_usd,
                    )
                log.info("Deposit credited: user=%s amount=%.2f", user_id_str, amount_usd)
            except Exception as exc:
                log.error("Stripe webhook DB update failed: %s", exc)

    return {"ok": True}


@app.get("/payments/history/{user_id}")
@limiter.limit("30/minute")
async def payment_history(
    request: Request,
    user_id: str,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    rows = await _query(
        """SELECT id, amount_usd, destination_type, stripe_session_id,
                  status, created_at, updated_at
           FROM public.deposit_requests
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 20""",
        uuid.UUID(user_id),
    )
    for r in rows:
        for k in ("created_at", "updated_at"):
            if isinstance(r.get(k), datetime):
                r[k] = r[k].isoformat()
        if r.get("amount_usd") is not None:
            r["amount_usd"] = float(r["amount_usd"])
    return rows


# ─── PayPal helpers ───────────────────────────────────────────────────────────

async def _paypal_access_token() -> str:
    """Obtain a short-lived OAuth2 bearer token from PayPal."""
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(503, "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET not configured")
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{_PAYPAL_BASE_URL}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"PayPal OAuth2: {r.text}")
        return r.json()["access_token"]


# ─── PayPal models ────────────────────────────────────────────────────────────

class PayPalCreateRequest(BaseModel):
    amount_usd: float = Field(..., gt=0)
    user_id: str


class PayPalCaptureRequest(BaseModel):
    order_id: str
    user_id: str


# ─── PayPal routes ────────────────────────────────────────────────────────────

@app.post("/payments/paypal/create", status_code=201)
@limiter.limit("10/minute")
async def paypal_create_order(
    request: Request,
    body: PayPalCreateRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    """Create a PayPal order and return the approval URL for the payer."""
    _require_user(x_user_id, authorization)

    access_token = await _paypal_access_token()
    amount_str = f"{body.amount_usd:.2f}"

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{_PAYPAL_BASE_URL}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "amount": {"currency_code": "USD", "value": amount_str},
                        "description": "AIQTP Deposit",
                        "custom_id": body.user_id,
                    }
                ],
                "application_context": {
                    "return_url": f"{FRONTEND_URL}/dashboard?payment=success",
                    "cancel_url": f"{FRONTEND_URL}/dashboard?payment=cancelled",
                    "brand_name": "AIQTP",
                    "user_action": "PAY_NOW",
                },
            },
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"PayPal create order: {r.text}")
        order = r.json()

    order_id = order["id"]
    approve_url = next(
        (link["href"] for link in order.get("links", []) if link.get("rel") == "approve"),
        None,
    )
    if not approve_url:
        raise HTTPException(502, "PayPal did not return an approval URL")

    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """INSERT INTO public.deposit_requests
                       (id, user_id, amount_usd, source, session_id, status, created_at)
                       VALUES (gen_random_uuid(), $1, $2, 'paypal', $3, 'pending', now())""",
                    body.user_id,
                    body.amount_usd,
                    order_id,
                )
        except Exception as exc:
            log.warning("deposit_requests PayPal insert failed (non-fatal): %s", exc)

    log.info("PayPal order created: order_id=%s user=%s amount=%.2f", order_id, body.user_id, body.amount_usd)
    return {"order_id": order_id, "approve_url": approve_url}


@app.post("/payments/paypal/capture", status_code=200)
@limiter.limit("10/minute")
async def paypal_capture_order(
    request: Request,
    body: PayPalCaptureRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    """Capture an approved PayPal order and credit the user's balance."""
    _require_user(x_user_id, authorization)

    access_token = await _paypal_access_token()

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{_PAYPAL_BASE_URL}/v2/checkout/orders/{body.order_id}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"PayPal capture: {r.text}")
        capture_result = r.json()

    capture_status = capture_result.get("status", "")
    if capture_status != "COMPLETED":
        raise HTTPException(402, f"PayPal capture not completed — status: {capture_status}")

    # Extract captured amount from the response
    purchase_units = capture_result.get("purchase_units", [])
    captured_amount = 0.0
    if purchase_units:
        captures = purchase_units[0].get("payments", {}).get("captures", [])
        if captures:
            try:
                captured_amount = float(captures[0]["amount"]["value"])
            except (KeyError, ValueError, TypeError):
                captured_amount = 0.0

    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """UPDATE public.deposit_requests
                       SET status = 'completed', processed_at = now()
                       WHERE session_id = $1 AND source = 'paypal'""",
                    body.order_id,
                )
                await conn.execute(
                    """INSERT INTO public.user_balances (user_id, balance_usd, updated_at)
                       VALUES ($1, $2, now())
                       ON CONFLICT (user_id)
                       DO UPDATE SET balance_usd = user_balances.balance_usd + $2,
                                     updated_at  = now()""",
                    body.user_id,
                    captured_amount,
                )
            log.info("PayPal deposit credited: user=%s amount=%.2f order_id=%s",
                     body.user_id, captured_amount, body.order_id)
        except Exception as exc:
            log.error("PayPal capture DB update failed: %s", exc)
            raise HTTPException(500, f"Payment captured but balance update failed: {exc}")

    return {
        "order_id": body.order_id,
        "status": "completed",
        "amount_usd": captured_amount,
        "user_id": body.user_id,
    }


# ─── AI Proxy (Anthropic) ─────────────────────────────────────────────────────

ANTHROPIC_API_KEY       = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_API_URL       = "https://api.anthropic.com/v1/messages"
AI_DEFAULT_MODEL        = "claude-haiku-4-5-20251001"
AI_MAX_TOKENS_DEFAULT   = 1024


class ChatMessage(BaseModel):
    role: str
    content: Any  # str or list of content blocks


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    tools: Optional[list[dict]] = None
    tool_choice: Optional[Any] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None


@app.post("/ai/chat")
@limiter.limit("30/minute")
async def ai_chat(
    request: Request,
    body: ChatRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    if not ANTHROPIC_API_KEY:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured")

    model = body.model or AI_DEFAULT_MODEL
    max_tokens = body.max_tokens or AI_MAX_TOKENS_DEFAULT

    # Separate system message (Anthropic takes it as a top-level param)
    system_content: Optional[str] = None
    messages_filtered = []
    for msg in body.messages:
        if msg.role == "system":
            system_content = msg.content if isinstance(msg.content, str) else json.dumps(msg.content)
        else:
            messages_filtered.append({"role": msg.role, "content": msg.content})

    anthropic_payload: dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": messages_filtered,
    }
    if system_content:
        anthropic_payload["system"] = system_content
    if body.tools:
        anthropic_payload["tools"] = body.tools
    if body.tool_choice is not None:
        anthropic_payload["tool_choice"] = body.tool_choice

    async with httpx.AsyncClient() as client:
        r = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key":         ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type":      "application/json",
            },
            json=anthropic_payload,
            timeout=60,
        )
        if r.status_code not in (200, 201):
            raise HTTPException(r.status_code, f"Anthropic API: {r.text}")
        anthropic_resp = r.json()

    # Convert Anthropic response → OpenAI-compatible shape
    content_blocks = anthropic_resp.get("content", [])
    # Collapse text blocks into a single string; preserve tool_use blocks
    text_parts = [b["text"] for b in content_blocks if b.get("type") == "text"]
    tool_calls = [b for b in content_blocks if b.get("type") == "tool_use"]

    message_out: dict[str, Any] = {
        "role": "assistant",
        "content": "\n".join(text_parts) if text_parts else None,
    }
    if tool_calls:
        message_out["tool_calls"] = [
            {
                "id":       tc.get("id"),
                "type":     "function",
                "function": {
                    "name":      tc.get("name"),
                    "arguments": json.dumps(tc.get("input", {})),
                },
            }
            for tc in tool_calls
        ]

    finish_reason = anthropic_resp.get("stop_reason", "stop")
    if finish_reason == "end_turn":
        finish_reason = "stop"
    elif finish_reason == "tool_use":
        finish_reason = "tool_calls"

    log.info("AI chat model=%s input_tokens=%d output_tokens=%d",
             model,
             anthropic_resp.get("usage", {}).get("input_tokens", 0),
             anthropic_resp.get("usage", {}).get("output_tokens", 0))

    return {
        "id":      anthropic_resp.get("id"),
        "object":  "chat.completion",
        "model":   anthropic_resp.get("model", model),
        "choices": [
            {
                "index":         0,
                "message":       message_out,
                "finish_reason": finish_reason,
            }
        ],
        "usage": {
            "prompt_tokens":     anthropic_resp.get("usage", {}).get("input_tokens", 0),
            "completion_tokens": anthropic_resp.get("usage", {}).get("output_tokens", 0),
        },
    }


# ─── Withdrawals ──────────────────────────────────────────────────────────────

WITHDRAWAL_MIN_USD = 20.0


class WithdrawalRequest(BaseModel):
    amount_usd: float = Field(..., gt=0)
    destination_type: str
    user_id: str


@app.post("/withdrawals/request", status_code=201)
@limiter.limit("5/minute")
async def withdrawal_request(
    request: Request,
    body: WithdrawalRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)

    if body.amount_usd < WITHDRAWAL_MIN_USD:
        raise HTTPException(400, f"Minimum withdrawal is ${WITHDRAWAL_MIN_USD:.2f} USD")

    pool = await get_pool()
    if not pool:
        raise HTTPException(503, "Render PostgreSQL not configured — set DATABASE_URL")

    async with pool.acquire() as conn:
        # Check balance
        row = await conn.fetchrow(
            "SELECT balance_usd FROM public.user_balances WHERE user_id = $1",
            uuid.UUID(body.user_id),
        )
        current_balance = float(row["balance_usd"]) if row else 0.0

        if current_balance < body.amount_usd:
            raise HTTPException(400, f"Insufficient balance: ${current_balance:.2f} available, "
                                     f"${body.amount_usd:.2f} requested")

        withdrawal_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO public.withdrawal_requests
               (id, user_id, amount_usd, destination_type, status, created_at)
               VALUES ($1, $2, $3, $4, 'pending', now())""",
            uuid.UUID(withdrawal_id),
            uuid.UUID(body.user_id),
            body.amount_usd,
            body.destination_type,
        )
        # Reserve the funds immediately (debit balance)
        await conn.execute(
            """UPDATE public.user_balances
               SET balance_usd = balance_usd - $1, updated_at = now()
               WHERE user_id = $2""",
            body.amount_usd,
            uuid.UUID(body.user_id),
        )

    log.info("Withdrawal requested: id=%s user=%s amount=%.2f dest=%s",
             withdrawal_id, body.user_id, body.amount_usd, body.destination_type)
    return {"withdrawal_id": withdrawal_id, "status": "pending"}


@app.get("/withdrawals/history/{user_id}")
@limiter.limit("30/minute")
async def withdrawal_history(
    request: Request,
    user_id: str,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    _require_user(x_user_id, authorization)
    rows = await _query(
        """SELECT id, amount_usd, destination_type, status, created_at, updated_at
           FROM public.withdrawal_requests
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 20""",
        uuid.UUID(user_id),
    )
    for r in rows:
        for k in ("created_at", "updated_at"):
            if isinstance(r.get(k), datetime):
                r[k] = r[k].isoformat()
        if r.get("amount_usd") is not None:
            r["amount_usd"] = float(r["amount_usd"])
    return rows


# ─── Arbitrage Scanner ───────────────────────────────────────────────────────

# In-memory price cache: key → {"price": float, "ts": float}
_price_cache: dict[str, dict] = {}
_PRICE_CACHE_TTL = 10.0  # seconds

# In-memory scan history (last 10 results, newest first)
_arb_scan_history: list[dict] = []

# Default top-20 USDT pairs to scan (Binance symbol format; Kraken variants mapped below)
_DEFAULT_ARB_PAIRS = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
    "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT", "MATICUSDT",
    "ATOMUSDT", "NEARUSDT", "LTCUSDT", "UNIUSDT", "AAVEUSDT",
    "FILUSDT", "ALGOUSDT", "XLMUSDT", "VETUSDT", "TRXUSDT",
]

# Mapping from Binance USDT symbol → Kraken pair name
_BINANCE_TO_KRAKEN: dict[str, str] = {
    "BTCUSDT":   "XBTUSD",
    "ETHUSDT":   "ETHUSD",
    "SOLUSDT":   "SOLUSD",
    "ADAUSDT":   "ADAUSD",
    "DOTUSDT":   "DOTUSD",
    "LINKUSDT":  "LINKUSD",
    "MATICUSDT": "MATICUSD",
    "AVAXUSDT":  "AVAXUSD",
    "ATOMUSDT":  "ATOMUSD",
    "NEARUSDT":  "NEARUSD",
    "LTCUSDT":   "LTCUSD",
    "UNIUSDT":   "UNIUSD",
    "XRPUSDT":   "XRPUSD",
    "AAVEUSDT":  "AAVEUSD",
    "ALGOUSDT":  "ALGOUSD",
    "XLMUSDT":   "XLMUSD",
    "FILUSDT":   "FILUSD",
    "TRXUSDT":   "TRXUSD",
}

# USD-denominated suffixes accepted when a caller supplies custom pairs
_USD_SUFFIXES = ("USDT", "USDC", "USD", "BUSD")

_ARB_FEE_RATE = 0.001  # 0.1% per side → 0.2% round-trip


class ArbitrageScanRequest(BaseModel):
    pairs: Optional[list[str]] = None          # Binance symbol format, e.g. ["BTCUSDT"]
    min_profit_usdt: float = Field(default=2.0, ge=0)


class ArbitrageExecuteRequest(BaseModel):
    pair: str                                   # Binance symbol, e.g. "BTCUSDT"
    buy_exchange: str = Field(..., pattern="^(binance|kraken)$")
    sell_exchange: str = Field(..., pattern="^(binance|kraken)$")
    amount_usdt: float = Field(..., ge=50)


# ── Price cache helpers ───────────────────────────────────────────────────────

def _arb_cache_get(key: str) -> Optional[float]:
    entry = _price_cache.get(key)
    if entry and (time.time() - entry["ts"]) < _PRICE_CACHE_TTL:
        return entry["price"]
    return None


def _arb_cache_set(key: str, price: float) -> None:
    _price_cache[key] = {"price": price, "ts": time.time()}


# ── Exchange fetch helpers ────────────────────────────────────────────────────

async def _fetch_binance_prices_bulk() -> dict[str, float]:
    """Fetch all Binance spot prices in one API call. Returns {symbol: price}."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.binance.com/api/v3/ticker/price",
            timeout=10,
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, f"Binance bulk ticker: {r.text}")
    result: dict[str, float] = {}
    for item in r.json():
        sym = item.get("symbol", "")
        try:
            result[sym] = float(item["price"])
        except (KeyError, ValueError):
            pass
    return result


async def _fetch_kraken_prices_bulk(kraken_pairs: list[str]) -> dict[str, float]:
    """Fetch Kraken prices for the given pair list. Returns {kraken_pair: last_price}."""
    if not kraken_pairs:
        return {}
    pair_str = ",".join(kraken_pairs)
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.kraken.com/0/public/Ticker",
            params={"pair": pair_str},
            timeout=10,
        )
    if r.status_code != 200:
        raise HTTPException(r.status_code, f"Kraken bulk ticker: {r.text}")
    body = r.json()
    if body.get("error"):
        raise HTTPException(400, f"Kraken: {body['error']}")
    result: dict[str, float] = {}
    for key, data in body.get("result", {}).items():
        try:
            # "c" field is [last_trade_price, lot_volume]
            result[key] = float(data["c"][0])
        except (KeyError, IndexError, ValueError):
            pass
    return result


def _is_usd_pair(symbol: str) -> bool:
    return any(symbol.upper().endswith(s) for s in _USD_SUFFIXES)


# ── Core spread computation ───────────────────────────────────────────────────

def _compute_arb_opportunities(
    pairs: list[str],
    binance_prices: dict[str, float],
    kraken_prices: dict[str, float],
    min_profit_usdt: float,
) -> list[dict]:
    opportunities: list[dict] = []

    for bn_sym in pairs:
        bn_sym = bn_sym.upper()
        if not _is_usd_pair(bn_sym):
            continue
        kraken_sym = _BINANCE_TO_KRAKEN.get(bn_sym)
        if not kraken_sym:
            continue

        # Prefer cache; fill from freshly-fetched bulk data
        bp = _arb_cache_get(f"binance:{bn_sym}") or binance_prices.get(bn_sym)
        kp: Optional[float] = _arb_cache_get(f"kraken:{kraken_sym}")
        if kp is None:
            # Kraken may return the pair under an alternate key (e.g. "XXBTZUSD")
            for k, v in kraken_prices.items():
                if kraken_sym in k or k in kraken_sym:
                    kp = v
                    break

        if not bp or not kp or bp <= 0 or kp <= 0:
            continue

        # Refresh cache
        _arb_cache_set(f"binance:{bn_sym}", bp)
        _arb_cache_set(f"kraken:{kraken_sym}", kp)

        # Evaluate both directions; keep only the profitable one
        for buy_ex, buy_price, sell_ex, sell_price in [
            ("binance", bp, "kraken", kp),
            ("kraken",  kp, "binance", bp),
        ]:
            gross_spread = sell_price - buy_price
            fee_cost = (buy_price + sell_price) * _ARB_FEE_RATE  # total fee in price units
            net_spread = gross_spread - fee_cost
            if net_spread <= 0:
                continue

            spread_pct = round(net_spread / buy_price * 100, 4)
            # Profit per 1000 USDT invested
            profit_per_1k = round((1000.0 / buy_price) * net_spread, 4)

            if profit_per_1k < min_profit_usdt:
                continue

            # Confidence: higher spread → higher confidence, capped at 1.0
            confidence = round(min(spread_pct / 2.0, 1.0), 4)

            opportunities.append({
                "pair":                  bn_sym,
                "buy_exchange":          buy_ex,
                "buy_price":             round(buy_price, 6),
                "sell_exchange":         sell_ex,
                "sell_price":            round(sell_price, 6),
                "spread_pct":            spread_pct,
                "spread_usdt":           round(net_spread, 6),
                "profit_usdt_per_1000":  profit_per_1k,
                "confidence":            confidence,
            })
            break  # only report the best direction per pair

    opportunities.sort(key=lambda x: x["profit_usdt_per_1000"], reverse=True)
    return opportunities


# ── Arbitrage routes ─────────────────────────────────────────────────────────

@app.post("/arbitrage/scan")
@limiter.limit("20/minute")
async def arbitrage_scan(
    request: Request,
    body: ArbitrageScanRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    """Scan Binance and Kraken simultaneously for CEX-CEX arbitrage opportunities."""
    _require_user(x_user_id, authorization)

    pairs = [p.upper() for p in body.pairs] if body.pairs else _DEFAULT_ARB_PAIRS

    # Keep only USD-denominated pairs
    pairs = [p for p in pairs if _is_usd_pair(p)]

    # Collect the Kraken pair names we need for this scan
    kraken_pairs_needed = list({
        _BINANCE_TO_KRAKEN[p] for p in pairs if p in _BINANCE_TO_KRAKEN
    })

    t0 = time.time()
    binance_prices, kraken_prices = await asyncio.gather(
        _fetch_binance_prices_bulk(),
        _fetch_kraken_prices_bulk(kraken_pairs_needed),
    )

    opportunities = _compute_arb_opportunities(
        pairs, binance_prices, kraken_prices, body.min_profit_usdt
    )

    scan_result = {
        "scanned_at":        datetime.now(timezone.utc).isoformat(),
        "pairs_scanned":     len(pairs),
        "elapsed_ms":        round((time.time() - t0) * 1000),
        "min_profit_usdt":   body.min_profit_usdt,
        "fee_rate_pct":      _ARB_FEE_RATE * 100,
        "opportunities":     opportunities,
        "opportunity_count": len(opportunities),
    }

    # Prepend to history; keep at most 10 entries
    _arb_scan_history.insert(0, scan_result)
    del _arb_scan_history[10:]

    log.info(
        "Arbitrage scan: %d pairs scanned, %d opportunities found in %dms",
        len(pairs), len(opportunities), scan_result["elapsed_ms"],
    )
    return scan_result


@app.get("/arbitrage/opportunities")
@limiter.limit("60/minute")
async def arbitrage_opportunities(request: Request):
    """Return the last 10 cached arbitrage scan results (no auth required)."""
    return {"scans": _arb_scan_history, "count": len(_arb_scan_history)}


@app.post("/arbitrage/execute")
@limiter.limit("5/minute")
async def arbitrage_execute(
    request: Request,
    body: ArbitrageExecuteRequest,
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    """
    Execute both legs of a CEX-CEX arbitrage trade simultaneously.
    Buys on buy_exchange and sells on sell_exchange using existing broker helpers.
    Both exchanges must have API keys configured and live trading enabled.
    """
    _require_user(x_user_id, authorization)

    pair = body.pair.upper()
    if not _is_usd_pair(pair):
        raise HTTPException(
            400, f"Pair {pair} is not USD-denominated — only USDT/USDC/USD pairs allowed"
        )

    if body.buy_exchange == body.sell_exchange:
        raise HTTPException(400, "buy_exchange and sell_exchange must be different")

    # Validate that API keys exist for each requested exchange
    exchange_has_keys = {
        "binance": bool(BINANCE_API_KEY and BINANCE_SECRET_KEY),
        "kraken":  bool(KRAKEN_API_KEY and KRAKEN_SECRET_KEY),
    }
    for ex in (body.buy_exchange, body.sell_exchange):
        if not exchange_has_keys.get(ex):
            raise HTTPException(503, f"{ex} API keys not configured")

    # Resolve current price for each exchange leg (cache → fresh fetch)
    async def _get_arb_price(exchange: str) -> float:
        if exchange == "binance":
            cached = _arb_cache_get(f"binance:{pair}")
            if cached:
                return cached
            data = await _binance_ticker(pair)
            p = float(data["price"])
            _arb_cache_set(f"binance:{pair}", p)
            return p
        # kraken
        kraken_sym = _BINANCE_TO_KRAKEN.get(pair)
        if not kraken_sym:
            raise HTTPException(400, f"No Kraken mapping for pair {pair}")
        cached = _arb_cache_get(f"kraken:{kraken_sym}")
        if cached:
            return cached
        result = await _kraken_ticker(kraken_sym)
        for data in result.values():
            p = float(data["c"][0])
            _arb_cache_set(f"kraken:{kraken_sym}", p)
            return p
        raise HTTPException(502, f"Kraken returned no price data for {kraken_sym}")

    buy_price, sell_price = await asyncio.gather(
        _get_arb_price(body.buy_exchange),
        _get_arb_price(body.sell_exchange),
    )

    qty = round(body.amount_usdt / buy_price, 8)

    buy_req  = BrokerOrderRequest(symbol=pair, side="buy",  qty=qty, order_type="market")
    sell_req = BrokerOrderRequest(symbol=pair, side="sell", qty=qty, order_type="market")

    async def _execute_arb_leg(exchange: str, req: BrokerOrderRequest) -> dict:
        if exchange == "binance":
            if not BINANCE_LIVE:
                raise HTTPException(
                    503, "Binance live trading disabled — set BINANCE_LIVE_ENABLED=true"
                )
            return await _place_binance_order(req)
        if not KRAKEN_LIVE:
            raise HTTPException(
                503, "Kraken live trading disabled — set KRAKEN_LIVE_ENABLED=true"
            )
        return await _place_kraken_order(req)

    buy_order, sell_order = await asyncio.gather(
        _execute_arb_leg(body.buy_exchange, buy_req),
        _execute_arb_leg(body.sell_exchange, sell_req),
    )

    gross_spread = sell_price - buy_price
    fee_cost = (buy_price + sell_price) * _ARB_FEE_RATE
    estimated_profit = round(qty * (gross_spread - fee_cost), 4)

    log.info(
        "Arbitrage executed: %s buy %s @ %.6f sell %s @ %.6f qty=%.8f est_profit=%.4f USDT",
        pair, body.buy_exchange, buy_price,
        body.sell_exchange, sell_price,
        qty, estimated_profit,
    )

    return {
        "pair":                  pair,
        "qty":                   qty,
        "buy_exchange":          body.buy_exchange,
        "buy_price":             round(buy_price, 6),
        "sell_exchange":         body.sell_exchange,
        "sell_price":            round(sell_price, 6),
        "buy_order":             buy_order,
        "sell_order":            sell_order,
        "estimated_profit_usdt": estimated_profit,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8002)))
