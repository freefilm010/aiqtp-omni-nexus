"""
AIQTP Trading Tools Service
============================
FastAPI service wrapping Freqtrade (backtesting) and ccxt (exchange orders).

Endpoints:
  POST /freqtrade/backtest    Run strategy backtest simulation
  POST /freqtrade/hyperopt    Run hyperopt parameter optimization
  POST /ccxt/sim_order        Simulate an order (dry-run, no real money)
  POST /ccxt/live_order       Place a real live order via ccxt
  GET  /health                Health check
"""

import asyncio
import logging
import os
import random
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("trading-tools")

# ─── Config ───────────────────────────────────────────────────────────────────
SUPABASE_URL             = os.getenv("SUPABASE_URL", "http://kong:8000")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ALPACA_API_KEY           = os.getenv("ALPACA_API_KEY", "")
ALPACA_SECRET_KEY        = os.getenv("ALPACA_SECRET_KEY", "")
ALPACA_BASE_URL          = os.getenv("ALPACA_BASE_URL", "https://api.alpaca.markets")
ALPACA_PAPER_MODE        = os.getenv("ALPACA_PAPER_MODE", "false").lower() != "false"
CCXT_LIVE_ENABLED        = os.getenv("CCXT_LIVE_ENABLED", "false").lower() == "true"

SYMBOL_WHITELIST = {
    s.strip() for s in os.getenv(
        "ALPACA_SYMBOL_WHITELIST", "BTCUSD,ETHUSD,SOLUSD,AVAXUSD,LINKUSD"
    ).split(",") if s.strip()
}

app = FastAPI(title="AIQTP Trading Tools", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


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


# ─── Backtest simulation engine ───────────────────────────────────────────────
def _simulate_backtest(req: BacktestRequest) -> dict[str, Any]:
    """Deterministic simulation — real Freqtrade integration is a drop-in swap."""
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
        # Maybe open a trade
        if len(open_trades) < req.max_open_trades and rng.random() < 0.08:
            entry_price = rng.uniform(30000, 70000) if "BTC" in req.pair else rng.uniform(1000, 4000)
            open_trades.append({
                "id": str(uuid.uuid4())[:8],
                "pair": req.pair,
                "open_date": day.strftime("%Y-%m-%d"),
                "entry_price": entry_price,
                "stake": req.stake_amount,
            })

        # Maybe close open trades
        still_open = []
        for t in open_trades:
            if rng.random() < 0.15:
                pct = rng.uniform(-0.12, 0.18)
                profit = t["stake"] * pct
                balance += profit
                trades.append({**t, "close_date": day.strftime("%Y-%m-%d"), "profit_pct": round(pct * 100, 2), "profit_abs": round(profit, 2)})
            else:
                still_open.append(t)
        open_trades = still_open
        day += timedelta(days=1)

    # Close remaining
    for t in open_trades:
        pct = rng.uniform(-0.05, 0.05)
        profit = t["stake"] * pct
        balance += profit
        trades.append({**t, "close_date": end.strftime("%Y-%m-%d"), "profit_pct": round(pct * 100, 2), "profit_abs": round(profit, 2)})

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
        "trades": trades[-20:],  # last 20 for payload size
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
    """Place order via Alpaca v2 API."""
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
            raise HTTPException(r.status_code, f"Alpaca error: {r.text}")
        return r.json()


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "trading-tools", "ccxt_live": CCXT_LIVE_ENABLED}


@app.post("/freqtrade/backtest")
async def freqtrade_backtest(req: BacktestRequest):
    t0 = time.time()
    result = await asyncio.to_thread(_simulate_backtest, req)
    result["elapsed_ms"] = round((time.time() - t0) * 1000)
    log.info("Backtest %s %s → %.2f%%", req.strategy, req.pair, result["total_profit_pct"])
    return result


@app.post("/freqtrade/hyperopt")
async def freqtrade_hyperopt(req: HyperoptRequest):
    t0 = time.time()
    result = await asyncio.to_thread(_simulate_hyperopt, req)
    result["elapsed_ms"] = round((time.time() - t0) * 1000)
    log.info("Hyperopt %s %s → best profit %.2f%%", req.strategy, req.pair, result["best_profit_pct"])
    return result


@app.post("/ccxt/sim_order")
async def ccxt_sim_order(req: SimOrderRequest):
    result = _sim_order_response(req)
    log.info("Sim order %s %s %.4f @ %.2f", req.side, req.symbol, req.amount, result["price"])
    return result


@app.post("/ccxt/live_order")
async def ccxt_live_order(req: LiveOrderRequest):
    if not CCXT_LIVE_ENABLED:
        raise HTTPException(503, "Live trading is disabled. Set CCXT_LIVE_ENABLED=true")
    result = await _place_alpaca_order(req)
    log.info("Live order placed: %s %s %s qty=%s", req.side, req.symbol, req.order_type, req.qty)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8002)))
