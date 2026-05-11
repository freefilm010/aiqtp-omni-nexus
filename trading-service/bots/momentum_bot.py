#!/usr/bin/env python3
"""AIQTP Momentum Trading Bot for Hyperliquid.

Strategy:
    EMA(12)/EMA(26) crossover + RSI(14) confirmation on 1-hour Hyperliquid
    candles for BTC, ETH, SOL.  Long-only on bull cross when RSI < 70,
    short on bear cross when RSI > 30.  Closes opposite positions before
    flipping; respects a max-position-size and per-trade dollar risk budget.

Risk management (defaults, overridable via env):
    POSITION_SIZE_PCT  10        % of account equity per trade
    STOP_LOSS_PCT      2.0       hard SL relative to entry
    TAKE_PROFIT_PCT    4.0       hard TP relative to entry (2:1 RR)
    MAX_LEVERAGE       3         caps notional / equity
    MIN_EQUITY_USD     10        below this the bot only logs, never trades

Operation:
    - Reads the wallet from HYPERLIQUID_PRIVATE_KEY
    - Polls Hyperliquid public REST every POLL_SECONDS (default 60)
    - Persists trade log + P&L to ./bot_state/trades.jsonl
    - Idempotent: it reconciles open positions on every iteration

Run locally:
    HYPERLIQUID_PRIVATE_KEY=... python bots/momentum_bot.py

Run on Render (worker service):
    See render.yaml entry `aiqtp-momentum-bot`.
"""
from __future__ import annotations

import json
import logging
import os
import signal
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import httpx

# ---------------------------------------------------------------------------
# Configuration (env overrides)
# ---------------------------------------------------------------------------
COINS = [c.strip().upper() for c in os.getenv("BOT_COINS", "BTC,ETH,SOL").split(",") if c.strip()]
POLL_SECONDS = int(os.getenv("BOT_POLL_SECONDS", "60"))
INTERVAL = os.getenv("BOT_CANDLE_INTERVAL", "1h")
LOOKBACK_HOURS = int(os.getenv("BOT_LOOKBACK_HOURS", "200"))

POSITION_SIZE_PCT = float(os.getenv("POSITION_SIZE_PCT", "10"))
STOP_LOSS_PCT = float(os.getenv("STOP_LOSS_PCT", "2.0"))
TAKE_PROFIT_PCT = float(os.getenv("TAKE_PROFIT_PCT", "4.0"))
MAX_LEVERAGE = float(os.getenv("MAX_LEVERAGE", "3"))
MIN_EQUITY_USD = float(os.getenv("MIN_EQUITY_USD", "10"))

DRY_RUN = os.getenv("BOT_DRY_RUN", "false").lower() == "true"
TESTNET = os.getenv("HYPERLIQUID_TESTNET", "false").lower() == "true"
PRIVATE_KEY = os.getenv("HYPERLIQUID_PRIVATE_KEY", "")

STATE_DIR = Path(os.getenv("BOT_STATE_DIR", "./bot_state"))
STATE_DIR.mkdir(parents=True, exist_ok=True)
TRADES_LOG = STATE_DIR / "trades.jsonl"
EQUITY_LOG = STATE_DIR / "equity.jsonl"

BASE_URL = "https://api.hyperliquid-testnet.xyz" if TESTNET else "https://api.hyperliquid.xyz"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("momentum-bot")


# ---------------------------------------------------------------------------
# Indicators
# ---------------------------------------------------------------------------
def ema(values: list[float], period: int) -> list[float]:
    k = 2 / (period + 1)
    out = [values[0]]
    for v in values[1:]:
        out.append(v * k + out[-1] * (1 - k))
    return out


def rsi(values: list[float], period: int = 14) -> float:
    gains, losses = [], []
    for i in range(1, len(values)):
        d = values[i] - values[i - 1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    if len(gains) < period:
        return 50.0
    avg_g = sum(gains[-period:]) / period
    avg_l = sum(losses[-period:]) / period
    if avg_l == 0:
        return 100.0
    rs = avg_g / avg_l
    return 100 - 100 / (1 + rs)


@dataclass
class Signal:
    coin: str
    price: float
    ema12: float
    ema26: float
    rsi14: float
    trend: str
    just_crossed: bool
    action: str  # "buy" | "sell" | "hold"


def compute_signal(coin: str, closes: list[float]) -> Signal:
    e12 = ema(closes, 12)
    e26 = ema(closes, 26)
    r = rsi(closes, 14)
    trend = "bull" if e12[-1] > e26[-1] else "bear"
    prev = "bull" if e12[-2] > e26[-2] else "bear"
    crossed = trend != prev
    action = "hold"
    if crossed and trend == "bull" and r < 70:
        action = "buy"
    elif crossed and trend == "bear" and r > 30:
        action = "sell"
    elif trend == "bull" and r < 30:
        action = "buy"   # mean-reversion within uptrend
    elif trend == "bear" and r > 70:
        action = "sell"
    return Signal(coin, closes[-1], e12[-1], e26[-1], r, trend, crossed, action)


# ---------------------------------------------------------------------------
# Hyperliquid client (public REST + signed SDK)
# ---------------------------------------------------------------------------
class HL:
    def __init__(self, private_key: str, testnet: bool = False) -> None:
        self.private_key = private_key
        self.testnet = testnet
        self.base = BASE_URL
        self._sdk = None
        self._wallet_address: Optional[str] = None
        if private_key:
            try:
                from eth_account import Account  # type: ignore
                self._wallet_address = Account.from_key(private_key).address
            except Exception as exc:  # noqa: BLE001
                log.warning("cannot derive wallet: %s", exc)

    @property
    def address(self) -> Optional[str]:
        return self._wallet_address

    def post_info(self, body: dict[str, Any]) -> Any:
        with httpx.Client(timeout=15) as c:
            r = c.post(f"{self.base}/info", json=body)
            r.raise_for_status()
            return r.json()

    def candles(self, coin: str, interval: str, hours: int) -> list[dict]:
        end = int(time.time() * 1000)
        start = end - hours * 3600 * 1000
        return self.post_info({
            "type": "candleSnapshot",
            "req": {"coin": coin, "interval": interval,
                    "startTime": start, "endTime": end},
        })

    def user_state(self) -> dict:
        if not self._wallet_address:
            return {}
        return self.post_info({"type": "clearinghouseState",
                               "user": self._wallet_address})

    def account_equity(self) -> float:
        try:
            us = self.user_state()
            return float(us.get("marginSummary", {}).get("accountValue", 0))
        except Exception as e:  # noqa: BLE001
            log.error("account_equity error: %s", e)
            return 0.0

    def positions(self) -> dict[str, dict]:
        try:
            us = self.user_state()
        except Exception:
            return {}
        out = {}
        for ap in us.get("assetPositions", []):
            pos = ap.get("position", {})
            coin = pos.get("coin")
            sz = float(pos.get("szi") or 0)
            if not coin or sz == 0:
                continue
            out[coin] = {
                "size": sz,
                "entry_px": float(pos.get("entryPx") or 0),
                "unrealized_pnl": float(pos.get("unrealizedPnl") or 0),
                "leverage": (pos.get("leverage") or {}).get("value"),
            }
        return out

    # signed actions
    def _exchange(self):
        if self._sdk is not None:
            return self._sdk
        from eth_account import Account  # type: ignore
        from hyperliquid.exchange import Exchange  # type: ignore
        from hyperliquid.utils import constants  # type: ignore
        wallet = Account.from_key(self.private_key)
        url = constants.TESTNET_API_URL if self.testnet else constants.MAINNET_API_URL
        self._sdk = Exchange(wallet, url)
        return self._sdk

    def market_order(self, coin: str, is_buy: bool, size: float) -> dict:
        if DRY_RUN:
            log.info("[DRY] market_order %s buy=%s size=%s", coin, is_buy, size)
            return {"dry_run": True}
        return self._exchange().market_open(coin, is_buy, size)

    def close_position(self, coin: str) -> dict:
        if DRY_RUN:
            log.info("[DRY] close_position %s", coin)
            return {"dry_run": True}
        return self._exchange().market_close(coin)


# ---------------------------------------------------------------------------
# Trade logging
# ---------------------------------------------------------------------------
def log_event(path: Path, event: dict) -> None:
    event = {"ts": int(time.time()), **event}
    with path.open("a") as f:
        f.write(json.dumps(event) + "\n")


# ---------------------------------------------------------------------------
# Trade loop
# ---------------------------------------------------------------------------
@dataclass
class BotState:
    last_signal: dict[str, str] = field(default_factory=dict)


def size_for(equity: float, price: float) -> float:
    notional = equity * (POSITION_SIZE_PCT / 100.0)
    notional = min(notional, equity * MAX_LEVERAGE)
    return round(max(notional / price, 0.0), 4)


def manage_risk(hl: HL, positions: dict[str, dict]) -> None:
    """Hard SL/TP exits regardless of signal."""
    for coin, p in positions.items():
        entry = p["entry_px"]
        if entry <= 0:
            continue
        # need current price
        try:
            mids = hl.post_info({"type": "allMids"})
            px = float(mids.get(coin, 0))
        except Exception:
            continue
        if px <= 0:
            continue
        long = p["size"] > 0
        change_pct = (px - entry) / entry * 100 * (1 if long else -1)
        if change_pct <= -STOP_LOSS_PCT:
            log.warning("STOP-LOSS %s: %.2f%%  closing", coin, change_pct)
            try:
                r = hl.close_position(coin)
                log_event(TRADES_LOG, {"action": "stop_loss_close", "coin": coin,
                                        "px": px, "entry": entry,
                                        "pnl_pct": change_pct, "resp": r})
            except Exception as e:  # noqa: BLE001
                log.error("close fail: %s", e)
        elif change_pct >= TAKE_PROFIT_PCT:
            log.info("TAKE-PROFIT %s: %.2f%%  closing", coin, change_pct)
            try:
                r = hl.close_position(coin)
                log_event(TRADES_LOG, {"action": "take_profit_close", "coin": coin,
                                        "px": px, "entry": entry,
                                        "pnl_pct": change_pct, "resp": r})
            except Exception as e:  # noqa: BLE001
                log.error("close fail: %s", e)


def trade_iter(hl: HL, state: BotState) -> None:
    equity = hl.account_equity()
    log_event(EQUITY_LOG, {"equity_usd": equity, "address": hl.address})
    log.info("equity=$%.2f  wallet=%s  dry=%s  testnet=%s",
             equity, hl.address, DRY_RUN, TESTNET)

    if equity < MIN_EQUITY_USD and not DRY_RUN:
        log.warning("equity below MIN_EQUITY_USD ($%.2f) — read-only mode", MIN_EQUITY_USD)

    positions = hl.positions()
    if positions:
        log.info("open positions: %s", {k: round(v["size"], 4) for k, v in positions.items()})
        manage_risk(hl, positions)
        positions = hl.positions()  # refresh after potential closes

    for coin in COINS:
        try:
            candles = hl.candles(coin, INTERVAL, LOOKBACK_HOURS)
            closes = [float(c["c"]) for c in candles]
            if len(closes) < 30:
                continue
            sig = compute_signal(coin, closes)
        except Exception as e:  # noqa: BLE001
            log.error("%s signal error: %s", coin, e)
            continue

        log.info("%s px=%.4f ema12=%.4f ema26=%.4f rsi=%.1f trend=%s cross=%s → %s",
                 coin, sig.price, sig.ema12, sig.ema26, sig.rsi14, sig.trend,
                 sig.just_crossed, sig.action)

        last = state.last_signal.get(coin)
        state.last_signal[coin] = sig.action
        if sig.action == "hold" or sig.action == last:
            continue

        pos = positions.get(coin)
        if pos:
            long = pos["size"] > 0
            if (sig.action == "buy" and long) or (sig.action == "sell" and not long):
                continue  # already aligned
            # flip: close opposing position first
            log.info("flipping %s — closing existing", coin)
            try:
                hl.close_position(coin)
                log_event(TRADES_LOG, {"action": "flip_close", "coin": coin})
            except Exception as e:  # noqa: BLE001
                log.error("close fail: %s", e)
                continue

        if equity < MIN_EQUITY_USD and not DRY_RUN:
            continue

        size = size_for(equity, sig.price)
        if size <= 0:
            continue
        is_buy = sig.action == "buy"
        try:
            r = hl.market_order(coin, is_buy, size)
            log_event(TRADES_LOG, {"action": "open", "coin": coin,
                                    "buy": is_buy, "size": size,
                                    "price": sig.price, "rsi": sig.rsi14,
                                    "trend": sig.trend, "resp": r})
            log.info("OPEN %s %s size=%s @ %.4f  resp=%s",
                     "LONG" if is_buy else "SHORT", coin, size, sig.price, r)
        except Exception as e:  # noqa: BLE001
            log.error("order fail: %s", e)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
def main() -> int:
    if not PRIVATE_KEY:
        log.error("HYPERLIQUID_PRIVATE_KEY env var is required")
        return 2

    hl = HL(PRIVATE_KEY, testnet=TESTNET)
    log.info("AIQTP momentum bot starting — wallet=%s testnet=%s coins=%s",
             hl.address, TESTNET, COINS)

    state = BotState()
    running = True

    def stop(_s, _f):
        nonlocal running
        running = False
        log.info("shutdown signal received")

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    while running:
        t0 = time.time()
        try:
            trade_iter(hl, state)
        except Exception as e:  # noqa: BLE001
            log.exception("iteration error: %s", e)
        # sleep with responsiveness to SIGTERM
        elapsed = time.time() - t0
        sleep_for = max(POLL_SECONDS - elapsed, 1)
        for _ in range(int(sleep_for)):
            if not running:
                break
            time.sleep(1)
    log.info("bot exited cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
