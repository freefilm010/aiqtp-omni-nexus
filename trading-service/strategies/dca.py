"""
Dollar-Cost Averaging (DCA) plan builder.

Generates a schedule of recurring buys (with optional value-averaging
adjustment) and a backtest summary against a price series.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal

Cadence = Literal["hourly", "daily", "weekly", "monthly"]

CADENCE_DELTA = {
    "hourly": timedelta(hours=1),
    "daily": timedelta(days=1),
    "weekly": timedelta(days=7),
    "monthly": timedelta(days=30),
}


@dataclass
class DCAEntry:
    timestamp: str
    usd_amount: float


@dataclass
class DCAPlan:
    symbol: str
    cadence: Cadence
    base_usd: float
    occurrences: int
    total_usd: float
    schedule: list[DCAEntry]


def build_dca_plan(
    symbol: str,
    cadence: Cadence = "weekly",
    base_usd: float = 100.0,
    occurrences: int = 12,
    start: datetime | None = None,
    value_averaging: bool = False,
    target_growth_per_period_pct: float = 5.0,
) -> DCAPlan:
    if base_usd <= 0:
        raise ValueError("base_usd must be > 0")
    if occurrences < 1:
        raise ValueError("occurrences must be >= 1")
    if cadence not in CADENCE_DELTA:
        raise ValueError(f"cadence must be one of {list(CADENCE_DELTA)}")

    start = start or datetime.now(timezone.utc)
    delta = CADENCE_DELTA[cadence]

    schedule: list[DCAEntry] = []
    expected_value = 0.0
    for i in range(occurrences):
        ts = start + delta * i
        if value_averaging:
            expected_value += base_usd
            expected_value *= 1 + target_growth_per_period_pct / 100
            amt = max(base_usd * 0.25, base_usd + (expected_value - (i + 1) * base_usd) * 0.5)
        else:
            amt = base_usd
        schedule.append(DCAEntry(timestamp=ts.isoformat(), usd_amount=round(amt, 2)))

    return DCAPlan(
        symbol=symbol,
        cadence=cadence,
        base_usd=base_usd,
        occurrences=occurrences,
        total_usd=round(sum(e.usd_amount for e in schedule), 2),
        schedule=schedule,
    )


def backtest_dca(prices: list[float], usd_per_period: float) -> dict[str, float]:
    """Backtest fixed DCA against a uniform price series.

    `prices` is a list of close prices, one per DCA period.
    """
    if not prices:
        return {"trades": 0}
    units = 0.0
    spent = 0.0
    for p in prices:
        if p <= 0:
            continue
        units += usd_per_period / p
        spent += usd_per_period
    final_price = prices[-1]
    final_value = units * final_price
    return {
        "trades": len(prices),
        "total_invested_usd": round(spent, 2),
        "units_acquired": round(units, 8),
        "avg_cost": round(spent / units, 6) if units else 0.0,
        "final_price": final_price,
        "final_value_usd": round(final_value, 2),
        "pnl_usd": round(final_value - spent, 2),
        "pnl_pct": round((final_value - spent) / spent * 100, 4) if spent else 0.0,
    }
