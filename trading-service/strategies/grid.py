"""
Grid trading strategy.

Inspired by Hummingbot's PMM/grid bots and Freqtrade's grid examples.
Pure plan generator — does not place real orders. Combine with a connector
to actually execute the levels.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

GridMode = Literal["arithmetic", "geometric"]


@dataclass
class GridLevel:
    side: str          # "buy" | "sell"
    price: float
    size: float
    index: int


@dataclass
class GridPlan:
    symbol: str
    lower: float
    upper: float
    levels: int
    mode: GridMode
    total_capital: float
    grid: list[GridLevel]
    expected_profit_per_trade_pct: float


def build_grid(
    symbol: str,
    lower: float,
    upper: float,
    current_price: float,
    levels: int = 10,
    total_capital: float = 1000.0,
    mode: GridMode = "arithmetic",
    fee_pct: float = 0.001,
) -> GridPlan:
    if upper <= lower:
        raise ValueError("upper must be > lower")
    if levels < 2:
        raise ValueError("levels must be >= 2")
    if not (lower <= current_price <= upper):
        raise ValueError("current_price must lie within [lower, upper]")

    if mode == "arithmetic":
        step = (upper - lower) / (levels - 1)
        prices = [lower + i * step for i in range(levels)]
    else:
        ratio = (upper / lower) ** (1 / (levels - 1))
        prices = [lower * (ratio ** i) for i in range(levels)]

    capital_per_level = total_capital / levels
    grid: list[GridLevel] = []
    for i, p in enumerate(prices):
        side = "buy" if p < current_price else "sell"
        size = capital_per_level / p
        grid.append(GridLevel(side=side, price=round(p, 8), size=round(size, 8), index=i))

    # Profit per cycle ≈ grid spacing minus 2 * fee
    spacing_pct = ((upper - lower) / (levels - 1)) / current_price * 100
    expected_pct = max(0.0, spacing_pct - 2 * fee_pct * 100)

    return GridPlan(
        symbol=symbol,
        lower=lower,
        upper=upper,
        levels=levels,
        mode=mode,
        total_capital=total_capital,
        grid=grid,
        expected_profit_per_trade_pct=round(expected_pct, 4),
    )
