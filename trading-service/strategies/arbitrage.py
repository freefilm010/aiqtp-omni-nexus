"""
Cross-exchange arbitrage detector.

Compares last-trade prices for the same symbol across multiple CCXT
exchanges (and optionally Hyperliquid) and surfaces opportunities where
the spread net of fees and a slippage buffer is positive.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import asdict, dataclass
from typing import Any

log = logging.getLogger("arbitrage")


@dataclass
class ArbOpportunity:
    symbol: str
    buy_exchange: str
    sell_exchange: str
    buy_price: float
    sell_price: float
    gross_spread_pct: float
    net_spread_pct: float
    profitable: bool


async def _fetch_one(cx, exchange: str, symbol: str) -> tuple[str, float | None]:
    try:
        t = await cx.ticker(exchange, symbol)
        last = t.get("last") or t.get("close")
        return exchange, float(last) if last else None
    except Exception as exc:  # pragma: no cover
        log.warning("arb: %s ticker failed: %s", exchange, exc)
        return exchange, None


async def detect(
    cx,                                # CCXTConnector instance
    symbol: str,
    exchanges: list[str],
    fee_bps_per_side: float = 10.0,    # 0.10%
    slippage_bps: float = 5.0,         # 0.05%
) -> list[ArbOpportunity]:
    """Return profitable arbitrage opportunities sorted by net spread.

    `fee_bps_per_side` is taker fee per side in basis points.
    """
    results = await asyncio.gather(*[_fetch_one(cx, ex, symbol) for ex in exchanges])
    quotes = {ex: px for ex, px in results if px is not None}
    if len(quotes) < 2:
        return []

    cost_pct = (2 * fee_bps_per_side + slippage_bps) / 100.0  # bps → pct
    opps: list[ArbOpportunity] = []
    items = list(quotes.items())
    for i, (ex_a, px_a) in enumerate(items):
        for ex_b, px_b in items[i + 1 :]:
            if px_a < px_b:
                buy_ex, buy_px, sell_ex, sell_px = ex_a, px_a, ex_b, px_b
            else:
                buy_ex, buy_px, sell_ex, sell_px = ex_b, px_b, ex_a, px_a
            gross = (sell_px - buy_px) / buy_px * 100
            net = gross - cost_pct
            opps.append(
                ArbOpportunity(
                    symbol=symbol,
                    buy_exchange=buy_ex,
                    sell_exchange=sell_ex,
                    buy_price=buy_px,
                    sell_price=sell_px,
                    gross_spread_pct=round(gross, 4),
                    net_spread_pct=round(net, 4),
                    profitable=net > 0,
                )
            )
    opps.sort(key=lambda o: o.net_spread_pct, reverse=True)
    return opps


def to_dicts(opps: list[ArbOpportunity]) -> list[dict[str, Any]]:
    return [asdict(o) for o in opps]
