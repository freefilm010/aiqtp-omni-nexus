"""FastAPI router exposing the strategy modules."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from connectors.routes import cx as _cx

from .arbitrage import detect as detect_arb
from .arbitrage import to_dicts as arb_to_dicts
from .dca import backtest_dca, build_dca_plan
from .grid import build_grid
from .momentum import evaluate as evaluate_momentum

router = APIRouter(prefix="/api/strategy", tags=["strategy"])


class GridIn(BaseModel):
    symbol: str
    lower: float = Field(..., gt=0)
    upper: float = Field(..., gt=0)
    current_price: float = Field(..., gt=0)
    levels: int = 10
    total_capital: float = 1000.0
    mode: str = Field("arithmetic", pattern="^(arithmetic|geometric)$")
    fee_pct: float = 0.001


@router.post("/grid")
def strategy_grid(body: GridIn) -> dict[str, Any]:
    try:
        plan = build_grid(
            body.symbol, body.lower, body.upper, body.current_price,
            body.levels, body.total_capital, body.mode, body.fee_pct,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return {**asdict(plan), "grid": [asdict(g) for g in plan.grid]}


class DCAIn(BaseModel):
    symbol: str
    cadence: str = Field("weekly", pattern="^(hourly|daily|weekly|monthly)$")
    base_usd: float = 100.0
    occurrences: int = 12
    value_averaging: bool = False
    target_growth_per_period_pct: float = 5.0


@router.post("/dca")
def strategy_dca(body: DCAIn) -> dict[str, Any]:
    try:
        plan = build_dca_plan(
            body.symbol, body.cadence, body.base_usd, body.occurrences,
            value_averaging=body.value_averaging,
            target_growth_per_period_pct=body.target_growth_per_period_pct,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return {**asdict(plan), "schedule": [asdict(s) for s in plan.schedule]}


class DCABacktestIn(BaseModel):
    prices: list[float]
    usd_per_period: float = 100.0


@router.post("/dca/backtest")
def strategy_dca_backtest(body: DCABacktestIn) -> dict[str, Any]:
    return backtest_dca(body.prices, body.usd_per_period)


class MomentumIn(BaseModel):
    closes: list[float]
    fast_period: int = 12
    slow_period: int = 26
    rsi_period: int = 14


@router.post("/momentum")
def strategy_momentum(body: MomentumIn) -> dict[str, Any]:
    return asdict(
        evaluate_momentum(
            body.closes, body.fast_period, body.slow_period, body.rsi_period
        )
    )


class ArbitrageIn(BaseModel):
    symbol: str = "BTC/USDT"
    exchanges: list[str] = ["kucoin", "mexc", "gateio"]
    fee_bps_per_side: float = 10.0
    slippage_bps: float = 5.0


@router.post("/arbitrage/scan")
async def strategy_arbitrage(body: ArbitrageIn) -> dict[str, Any]:
    try:
        opps = await detect_arb(
            _cx, body.symbol, body.exchanges,
            body.fee_bps_per_side, body.slippage_bps,
        )
    except Exception as exc:
        raise HTTPException(502, f"arbitrage scan failed: {exc}") from exc
    return {
        "symbol": body.symbol,
        "exchanges_polled": body.exchanges,
        "opportunities": arb_to_dicts(opps),
        "best_net_spread_pct": opps[0].net_spread_pct if opps else None,
    }
