"""
real_strategy.py — RSI + EMA Crossover + Volume Confirmation Strategy
======================================================================
Provides live trading signals for AIQTP Omni-Nexus crypto trading.

Signal logic (all three conditions must be met simultaneously):
  BUY  : Fast EMA crosses above Slow EMA  AND  RSI < 70  AND  Volume > Volume MA
  SELL : Fast EMA crosses below Slow EMA  AND  RSI > 30  AND  Volume > Volume MA
  HOLD : No crossover detected, or volume is below average

OHLCV data source: Binance public REST API (no API key required for standard rate limits).
Alpaca crypto symbols (e.g. BTCUSD) are automatically converted to Binance format (BTCUSDT).

Default parameters:
  rsi_period      = 14   (standard Wilder RSI period)
  ema_fast        = 9    (short-term trend)
  ema_slow        = 21   (medium-term trend)
  volume_ma_period= 20   (volume baseline)
  candle_interval = 1h   (hourly candles for swing-trade cadence)
  candle_limit    = 100  (enough history for all indicators to warm up)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import pandas as pd
import requests

log = logging.getLogger("core-brain.strategy")

# ─── Binance public OHLCV endpoint ────────────────────────────────────────────
_BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines"

# Alpaca uses "BTCUSD"; Binance uses "BTCUSDT"
_ALPACA_TO_BINANCE: Dict[str, str] = {
    "BTCUSD":  "BTCUSDT",
    "ETHUSD":  "ETHUSDT",
    "SOLUSD":  "SOLUSDT",
    "AVAXUSD": "AVAXUSDT",
    "LINKUSD": "LINKUSDT",
    "MATICUSD":"MATICUSDT",
    "DOTUSD":  "DOTUSDT",
    "ADAUSD":  "ADAUSDT",
}


def _alpaca_to_binance(symbol: str) -> str:
    """Convert an Alpaca crypto symbol to its Binance equivalent."""
    return _ALPACA_TO_BINANCE.get(symbol.upper(), symbol.upper().replace("USD", "USDT"))


class CryptoStrategy:
    """
    RSI + EMA crossover + volume confirmation strategy.

    All indicator calculations are performed on closed candles only (index -2
    relative to the most-recently fetched bar) to avoid acting on a
    still-forming candle that would produce a false signal.
    """

    def __init__(
        self,
        rsi_period: int = 14,
        ema_fast: int = 9,
        ema_slow: int = 21,
        volume_ma_period: int = 20,
        candle_interval: str = "1h",
        candle_limit: int = 100,
    ) -> None:
        self.rsi_period = rsi_period
        self.ema_fast = ema_fast
        self.ema_slow = ema_slow
        self.volume_ma_period = volume_ma_period
        self.candle_interval = candle_interval
        self.candle_limit = candle_limit

    # ── Data fetching ──────────────────────────────────────────────────────────

    def fetch_ohlcv(self, symbol: str) -> Optional[pd.DataFrame]:
        """
        Fetch OHLCV candles from Binance for the given Alpaca-format symbol.
        Returns a DataFrame with columns [open, high, low, close, volume] or
        None on any network or parsing error.
        """
        binance_symbol = _alpaca_to_binance(symbol)
        try:
            resp = requests.get(
                _BINANCE_KLINES_URL,
                params={
                    "symbol":   binance_symbol,
                    "interval": self.candle_interval,
                    "limit":    self.candle_limit,
                },
                timeout=10,
            )
            resp.raise_for_status()
            raw = resp.json()

            # Binance kline columns (index 0–11):
            # 0  open_time, 1 open, 2 high, 3 low, 4 close, 5 volume,
            # 6  close_time, 7 quote_asset_volume, 8 num_trades,
            # 9  taker_buy_base, 10 taker_buy_quote, 11 ignore
            df = pd.DataFrame(raw, columns=[
                "open_time", "open", "high", "low", "close", "volume",
                "close_time", "quote_asset_volume", "num_trades",
                "taker_buy_base", "taker_buy_quote", "ignore",
            ])
            df["close"]  = df["close"].astype(float)
            df["volume"] = df["volume"].astype(float)
            return df

        except requests.RequestException as exc:
            log.warning("OHLCV fetch failed for %s (%s): %s", symbol, binance_symbol, exc)
            return None
        except Exception as exc:
            log.error("Unexpected error fetching OHLCV for %s: %s", symbol, exc)
            return None

    # ── Indicator calculation ──────────────────────────────────────────────────

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute EMA fast, EMA slow, RSI, and Volume MA in-place and return df.
        Uses Wilder's smoothing (adjust=False) for RSI to match standard charting tools.
        """
        # Exponential Moving Averages
        df["ema_fast"] = df["close"].ewm(span=self.ema_fast, adjust=False).mean()
        df["ema_slow"] = df["close"].ewm(span=self.ema_slow, adjust=False).mean()

        # RSI (Wilder's method)
        delta = df["close"].diff()
        gain  = delta.where(delta > 0, 0.0).ewm(
            com=self.rsi_period - 1, adjust=False, min_periods=self.rsi_period
        ).mean()
        loss  = (-delta.where(delta < 0, 0.0)).ewm(
            com=self.rsi_period - 1, adjust=False, min_periods=self.rsi_period
        ).mean()
        rs = gain / loss.replace(0, float("nan"))
        df["rsi"] = 100.0 - (100.0 / (1.0 + rs))

        # Volume Moving Average
        df["volume_ma"] = df["volume"].rolling(window=self.volume_ma_period).mean()

        return df

    # ── Signal generation ──────────────────────────────────────────────────────

    def generate_signal(self, symbol: str) -> Dict[str, Any]:
        """
        Generate a trading signal for the given Alpaca-format symbol.

        Returns a dict with keys:
          direction  : 'buy' | 'sell' | 'hold'
          confidence : float 0.0–1.0 (0.8 for actionable signals, 0.0 for hold)
          reason     : human-readable explanation
          price      : float — the last closed candle's close price (or 0.0 on error)
          rsi        : float — current RSI value (NaN if insufficient data)
          ema_fast   : float — current fast EMA
          ema_slow   : float — current slow EMA
        """
        df = self.fetch_ohlcv(symbol)

        min_rows = max(self.ema_slow, self.rsi_period, self.volume_ma_period) + 5
        if df is None or len(df) < min_rows:
            return {
                "direction":  "hold",
                "confidence": 0.0,
                "reason":     f"Insufficient data (got {len(df) if df is not None else 0}, need {min_rows})",
                "price":      0.0,
                "rsi":        float("nan"),
                "ema_fast":   float("nan"),
                "ema_slow":   float("nan"),
            }

        df = self.calculate_indicators(df)

        # Use the last *closed* candle (index -2); index -1 is still forming
        cur  = df.iloc[-2]
        prev = df.iloc[-3]

        price    = float(cur["close"])
        rsi      = float(cur["rsi"])
        ema_f    = float(cur["ema_fast"])
        ema_s    = float(cur["ema_slow"])
        vol      = float(cur["volume"])
        vol_ma   = float(cur["volume_ma"])

        # Guard against NaN indicators (insufficient warm-up data)
        if pd.isna(rsi) or pd.isna(ema_f) or pd.isna(ema_s) or pd.isna(vol_ma):
            return {
                "direction":  "hold",
                "confidence": 0.0,
                "reason":     "Indicators still warming up (NaN values present)",
                "price":      price,
                "rsi":        rsi,
                "ema_fast":   ema_f,
                "ema_slow":   ema_s,
            }

        # Crossover detection on the last two closed candles
        ema_cross_up   = float(prev["ema_fast"]) <= float(prev["ema_slow"]) and ema_f > ema_s
        ema_cross_down = float(prev["ema_fast"]) >= float(prev["ema_slow"]) and ema_f < ema_s
        volume_ok      = vol > vol_ma

        if ema_cross_up and rsi < 70 and volume_ok:
            return {
                "direction":  "buy",
                "confidence": 0.8,
                "reason":     (
                    f"EMA{self.ema_fast} crossed above EMA{self.ema_slow} | "
                    f"RSI={rsi:.1f} (not overbought) | "
                    f"Vol={vol:.0f} > VolMA={vol_ma:.0f}"
                ),
                "price":    price,
                "rsi":      rsi,
                "ema_fast": ema_f,
                "ema_slow": ema_s,
            }

        if ema_cross_down and rsi > 30 and volume_ok:
            return {
                "direction":  "sell",
                "confidence": 0.8,
                "reason":     (
                    f"EMA{self.ema_fast} crossed below EMA{self.ema_slow} | "
                    f"RSI={rsi:.1f} (not oversold) | "
                    f"Vol={vol:.0f} > VolMA={vol_ma:.0f}"
                ),
                "price":    price,
                "rsi":      rsi,
                "ema_fast": ema_f,
                "ema_slow": ema_s,
            }

        # No actionable signal
        reason_parts = []
        if not ema_cross_up and not ema_cross_down:
            reason_parts.append("No EMA crossover")
        if not volume_ok:
            reason_parts.append(f"Low volume ({vol:.0f} < VolMA {vol_ma:.0f})")
        if ema_cross_up and rsi >= 70:
            reason_parts.append(f"RSI overbought ({rsi:.1f})")
        if ema_cross_down and rsi <= 30:
            reason_parts.append(f"RSI oversold ({rsi:.1f})")

        return {
            "direction":  "hold",
            "confidence": 0.0,
            "reason":     "; ".join(reason_parts) or "No clear signal",
            "price":      price,
            "rsi":        rsi,
            "ema_fast":   ema_f,
            "ema_slow":   ema_s,
        }


# ─── Module-level singleton ───────────────────────────────────────────────────
# Imported by trading_worker.py as:
#   from real_strategy import strategy as real_strategy
# Then called as:
#   signal = real_strategy.generate_signal("BTCUSD")

strategy = CryptoStrategy()
