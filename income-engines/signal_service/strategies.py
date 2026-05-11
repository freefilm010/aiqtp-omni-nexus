"""
Trading-signal generators reused from the AIQTP momentum + grid strategies.

These are pure-Python signal calculators that consume OHLCV data from
Coingecko (free, no API key) and emit BUY/SELL/HOLD recommendations with
sizing hints. The signal service posts them to Telegram + the AIQTP site.
"""

from __future__ import annotations

import statistics
import time
from dataclasses import dataclass
from typing import List, Optional

import requests

from common.config import settings
from common.logger import get_logger

log = get_logger("signal_strategies")


@dataclass
class Signal:
    coin_id: str
    symbol: str
    side: str           # "LONG" / "SHORT" / "FLAT"
    strength: float     # 0..1
    entry: float
    stop: float
    target: float
    reason: str
    ts: float


def fetch_ohlc(coin_id: str, days: int = 14) -> List[List[float]]:
    """Coingecko free OHLC endpoint. Returns [[ts, open, high, low, close], ...]."""
    url = f"{settings.coingecko_api}/coins/{coin_id}/ohlc"
    r = requests.get(url, params={"vs_currency": "usd", "days": str(days)}, timeout=30)
    r.raise_for_status()
    return r.json()


def momentum_signal(coin_id: str, symbol: str) -> Optional[Signal]:
    """
    Classic dual-momentum: compare 24h return to 7d return; require the
    short-term move to be stronger AND aligned with the long-term.
    Risk = 1.5x ATR proxy from high-low range.
    """
    try:
        ohlc = fetch_ohlc(coin_id, days=14)
    except Exception as e:
        log.error("OHLC fetch failed for %s: %s", coin_id, e)
        return None
    if len(ohlc) < 50:
        return None
    closes = [row[4] for row in ohlc]
    last = closes[-1]
    px_24h = closes[-6] if len(closes) >= 6 else closes[0]   # 4h candles, 6 = 24h
    px_7d = closes[-42] if len(closes) >= 42 else closes[0]
    ret_24h = (last - px_24h) / px_24h
    ret_7d = (last - px_7d) / px_7d
    atr = statistics.mean([row[2] - row[3] for row in ohlc[-14:]])

    side = "FLAT"
    if ret_24h > 0.02 and ret_7d > 0.05:
        side = "LONG"
    elif ret_24h < -0.02 and ret_7d < -0.05:
        side = "SHORT"
    if side == "FLAT":
        return None
    strength = min(1.0, abs(ret_24h) * 10)
    sign = 1 if side == "LONG" else -1
    stop = last - sign * atr * 1.5
    target = last + sign * atr * 3.0
    return Signal(
        coin_id=coin_id, symbol=symbol, side=side, strength=strength,
        entry=last, stop=stop, target=target,
        reason=f"24h {ret_24h*100:+.2f}%, 7d {ret_7d*100:+.2f}%",
        ts=time.time(),
    )


def grid_signal(coin_id: str, symbol: str) -> Optional[Signal]:
    """
    Range-bound grid scout: if 24h volatility is *low* and price is at the
    upper/lower band of the 14d Bollinger envelope, suggest a fade.
    """
    try:
        ohlc = fetch_ohlc(coin_id, days=14)
    except Exception:
        return None
    closes = [row[4] for row in ohlc]
    if len(closes) < 50:
        return None
    mean = statistics.mean(closes)
    sd = statistics.pstdev(closes)
    last = closes[-1]
    upper = mean + 2 * sd
    lower = mean - 2 * sd
    vol = sd / mean
    if vol > 0.05:
        return None  # too volatile for grid
    if last >= upper:
        return Signal(
            coin_id=coin_id, symbol=symbol, side="SHORT", strength=0.6,
            entry=last, stop=upper + sd, target=mean,
            reason="At +2σ Bollinger band, vol contracting",
            ts=time.time(),
        )
    if last <= lower:
        return Signal(
            coin_id=coin_id, symbol=symbol, side="LONG", strength=0.6,
            entry=last, stop=lower - sd, target=mean,
            reason="At -2σ Bollinger band, vol contracting",
            ts=time.time(),
        )
    return None


COIN_UNIVERSE = [
    ("bitcoin", "BTC"),
    ("ethereum", "ETH"),
    ("solana", "SOL"),
    ("arbitrum", "ARB"),
    ("chainlink", "LINK"),
    ("hyperliquid", "HYPE"),
    ("ondo-finance", "ONDO"),
    ("pendle", "PENDLE"),
]


def scan_all() -> List[Signal]:
    out: List[Signal] = []
    for coin_id, sym in COIN_UNIVERSE:
        for fn in (momentum_signal, grid_signal):
            try:
                s = fn(coin_id, sym)
                if s:
                    out.append(s)
            except Exception as e:
                log.exception("strategy error %s/%s: %s", fn.__name__, sym, e)
        time.sleep(2.0)  # Coingecko free tier rate-limit guard
    return out
