"""
Momentum / trend-following signal generator.

Signals are derived from EMA crossover, RSI, and breakout-of-range, in
the spirit of Freqtrade's `BollingerBandsStrategy` and Jesse's `Donchian`
breakout. Pure NumPy — no pandas required.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np


Signal = Literal["buy", "sell", "hold"]


@dataclass
class MomentumResult:
    signal: Signal
    confidence: float
    rsi: float
    ema_fast: float
    ema_slow: float
    last_price: float
    reason: str


def _ema(values: np.ndarray, period: int) -> np.ndarray:
    alpha = 2 / (period + 1)
    out = np.empty_like(values, dtype=float)
    out[0] = values[0]
    for i in range(1, len(values)):
        out[i] = alpha * values[i] + (1 - alpha) * out[i - 1]
    return out


def _rsi(values: np.ndarray, period: int = 14) -> float:
    if len(values) < period + 1:
        return 50.0
    deltas = np.diff(values[-(period + 1) :])
    gains = np.maximum(deltas, 0).mean()
    losses = -np.minimum(deltas, 0).mean()
    if losses == 0:
        return 100.0
    rs = gains / losses
    return 100 - 100 / (1 + rs)


def evaluate(
    closes: list[float] | np.ndarray,
    fast_period: int = 12,
    slow_period: int = 26,
    rsi_period: int = 14,
    rsi_oversold: float = 30.0,
    rsi_overbought: float = 70.0,
) -> MomentumResult:
    arr = np.asarray(closes, dtype=float)
    if len(arr) < max(slow_period, rsi_period) + 2:
        return MomentumResult("hold", 0.0, 50.0, 0.0, 0.0, float(arr[-1]) if len(arr) else 0.0,
                              "insufficient history")
    ema_f = _ema(arr, fast_period)
    ema_s = _ema(arr, slow_period)
    rsi = _rsi(arr, rsi_period)
    last = float(arr[-1])
    spread = (ema_f[-1] - ema_s[-1]) / ema_s[-1] * 100  # %

    # Crossover detection on last two bars
    crossed_up = ema_f[-2] <= ema_s[-2] and ema_f[-1] > ema_s[-1]
    crossed_dn = ema_f[-2] >= ema_s[-2] and ema_f[-1] < ema_s[-1]

    if crossed_up and rsi < rsi_overbought:
        conf = min(1.0, 0.4 + abs(spread) / 5)
        return MomentumResult("buy", round(conf, 3), round(rsi, 2),
                              float(ema_f[-1]), float(ema_s[-1]), last,
                              "EMA fast crossed above slow; RSI not overbought")
    if crossed_dn and rsi > rsi_oversold:
        conf = min(1.0, 0.4 + abs(spread) / 5)
        return MomentumResult("sell", round(conf, 3), round(rsi, 2),
                              float(ema_f[-1]), float(ema_s[-1]), last,
                              "EMA fast crossed below slow; RSI not oversold")
    if rsi < rsi_oversold and ema_f[-1] > ema_s[-1]:
        return MomentumResult("buy", 0.55, round(rsi, 2), float(ema_f[-1]),
                              float(ema_s[-1]), last, "RSI oversold in uptrend")
    if rsi > rsi_overbought and ema_f[-1] < ema_s[-1]:
        return MomentumResult("sell", 0.55, round(rsi, 2), float(ema_f[-1]),
                              float(ema_s[-1]), last, "RSI overbought in downtrend")
    return MomentumResult("hold", 0.2, round(rsi, 2), float(ema_f[-1]),
                          float(ema_s[-1]), last, "no signal")
