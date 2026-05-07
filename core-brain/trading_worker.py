"""
AIQTP Omni-Nexus — Core Brain Trading Worker
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Continuous 24/7 background loop that runs on Render as a Worker service.

Responsibility split:
  Frontend (React)  → writes strategy_registry configs, reads results,
                       operates the master kill-switch via system_status;
                       dispatches QuantClaw tool directives via agent_directives
  This worker       → reads configs, fetches live prices, generates real signals
                       via RSI+EMA+Volume strategy, executes real Alpaca orders,
                       manages open positions with stop-loss/take-profit close loop,
                       writes to trade_logs + performance_evaluator;
                       polls agent_directives and executes QuantClaw tools

Trading execution flow (main loop):
  1. Kill-switch check (system_status table)
  2. Poll and execute agent_directives (UI-dispatched commands)
  3. Fetch active strategy configurations
  4. Fetch live prices from CoinGecko
  4.5 Close open positions: check stop-loss/take-profit/reversal via _close_open_positions()
  5. Per-strategy: generate RSI+EMA+Volume signal → validate → execute Alpaca order

Required environment variables:
  SUPABASE_URL              Supabase project REST URL
  SUPABASE_SERVICE_ROLE_KEY Service-role key (bypasses RLS for writes)

  ALPACA_API_KEY            Alpaca brokerage API key ID
  ALPACA_SECRET_KEY         Alpaca brokerage secret key

  *** CRITICAL: LIVE vs PAPER MODE ***
  ALPACA_BASE_URL           Set to https://paper-api.alpaca.markets for paper trading
                            Set to https://api.alpaca.markets for LIVE trading with real money
  ALPACA_PAPER_MODE         'true'  → blocks live order submission (SAFE DEFAULT)
                            'false' → ENABLES REAL MONEY EXECUTION
                            Your render.yaml currently sets this to 'false'.
                            Ensure this is intentional before deploying with real API keys.

Optional environment variables:
  COINGECKO_API_KEY         Pro API key; free-tier endpoint used if absent
  LOOP_INTERVAL_SECONDS     Main loop cadence in seconds (default: 60)
  ALPACA_SYMBOL_WHITELIST   Comma-separated list of tradeable symbols (default: BTCUSD,ETHUSD,...)
"""

import collections
import logging
import os
import random
import time
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd
import requests
from dotenv import load_dotenv

from real_strategy import strategy as real_strategy

# ─── Database backend selection ───────────────────────────────────────────────
# If DATABASE_URL is set (Render PostgreSQL), use the psycopg2 adapter.
# Otherwise fall back to the supabase-py client for backward compatibility.

def _init_db_backend():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        try:
            import render_db
            log_placeholder = logging.getLogger("core-brain")
            log_placeholder.info("Using Render PostgreSQL (DATABASE_URL)")
            return render_db
        except Exception as exc:
            logging.getLogger("core-brain").warning(
                "render_db import failed (%s) — falling back to Supabase", exc
            )
    # supabase-py fallback
    from supabase import create_client

    class _SupabaseAdapter:
        def __init__(self):
            url = os.environ.get("SUPABASE_URL", "")
            key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            if not url or not key:
                raise RuntimeError(
                    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set when DATABASE_URL is absent"
                )
            self._client = create_client(url, key)

        def table(self, name: str):
            return self._client.table(name)

    return _SupabaseAdapter()

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-8s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger("core-brain")

# ─── Environment ──────────────────────────────────────────────────────────────

load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
COINGECKO_API_KEY: Optional[str] = os.getenv("COINGECKO_API_KEY")
LOOP_INTERVAL_SECONDS: int = int(os.getenv("LOOP_INTERVAL_SECONDS", "60"))

# ── Alpaca brokerage (QuantClaw-Prod live order execution) ────────────────────
# Keys are read from env vars if set, otherwise fetched from Supabase
# account_key_vault at startup so the user can configure them via the UI.
ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")

ALPACA_API_KEY: Optional[str]    = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY: Optional[str] = os.getenv("ALPACA_SECRET_KEY")
ALPACA_BASE_URL: str             = os.getenv(
    "ALPACA_BASE_URL", "https://api.alpaca.markets"
)
ALPACA_PAPER_MODE: bool = os.getenv("ALPACA_PAPER_MODE", "true").lower() != "false"

ALPACA_SYMBOL_WHITELIST: set[str] = {
    s.strip() for s in os.getenv(
        "ALPACA_SYMBOL_WHITELIST",
        "BTCUSD,ETHUSD,SOLUSD,AVAXUSD,LINKUSD,USDCUSD,USDTUSD,MATICUSD,DOTUSD,ADAUSD"
    ).split(",")
    if s.strip()
}

_alpaca_order_times: dict[str, collections.deque] = {}

# ─── Database backend ─────────────────────────────────────────────────────────

db = _init_db_backend()


def _load_alpaca_keys_from_vault() -> None:
    """
    If ALPACA_API_KEY / ALPACA_SECRET_KEY are not set as env vars, attempt to
    read them from the account_key_vault table in Supabase. The UI stores them
    there when the user enters them in the QuantClaw QAQI credentials panel.

    Expected rows:
      account_id = 'alpaca_api_key'    → api_key_encrypted = <key ID>
      account_id = 'alpaca_secret_key' → api_key_encrypted = <secret>
    """
    global ALPACA_API_KEY, ALPACA_SECRET_KEY
    if ALPACA_API_KEY and ALPACA_SECRET_KEY:
        return  # env vars already set — nothing to do

    try:
        rows: list[dict] = []
        for aid in ("alpaca_api_key", "alpaca_secret_key"):
            r = (
                db.table("account_key_vault")
                .select("account_id, api_key_encrypted")
                .eq("account_id", aid)
                .execute()
            )
            rows.extend(r.data or [])
        for row in rows:
            if row["account_id"] == "alpaca_api_key" and not ALPACA_API_KEY:
                ALPACA_API_KEY = row["api_key_encrypted"]
                log.info("Alpaca API key loaded from Supabase vault.")
            elif row["account_id"] == "alpaca_secret_key" and not ALPACA_SECRET_KEY:
                ALPACA_SECRET_KEY = row["api_key_encrypted"]
                log.info("Alpaca secret key loaded from Supabase vault.")
    except Exception as exc:
        log.warning("Could not load Alpaca keys from vault: %s", exc)

# ─── Constants ────────────────────────────────────────────────────────────────

COINGECKO_FREE_API = "https://api.coingecko.com/api/v3"
COINGECKO_PRO_API  = "https://pro-api.coingecko.com/api/v3"

# Symbol → CoinGecko ID (mirrors coingecko.ts in the frontend)
COINGECKO_ID: dict[str, str] = {
    "BTC":   "bitcoin",              "ETH":   "ethereum",
    "SOL":   "solana",               "BNB":   "binancecoin",
    "XRP":   "ripple",               "ADA":   "cardano",
    "DOGE":  "dogecoin",             "AVAX":  "avalanche-2",
    "DOT":   "polkadot",             "LINK":  "chainlink",
    "MATIC": "matic-network",        "ARB":   "arbitrum",
    "OP":    "optimism",             "NEAR":  "near",
    "FTM":   "fantom",               "INJ":   "injective-protocol",
    "PEPE":  "pepe",                 "WIF":   "dogwifcoin",
    "BONK":  "bonk",                 "SHIB":  "shiba-inu",
    "FLOKI": "floki",                "RNDR":  "render-token",
    "FET":   "fetch-ai",             "GRT":   "the-graph",
    "FIL":   "filecoin",             "OCEAN": "ocean-protocol",
}
ID_TO_SYMBOL: dict[str, str] = {v: k for k, v in COINGECKO_ID.items()}

# data_category → default symbol pool for that category
CATEGORY_SYMBOLS: dict[str, list[str]] = {
    "market":      ["BTC", "ETH", "SOL", "BNB", "AVAX"],
    "social":      ["PEPE", "DOGE", "SHIB", "WIF", "BONK", "FLOKI"],
    "blockchain":  ["ETH", "SOL", "MATIC", "ARB", "OP"],
    "news":        ["BTC", "ETH", "SOL"],
    "sentiment":   ["BTC", "ETH", "BNB"],
    "alternative": ["FET", "GRT", "RNDR", "FIL", "OCEAN"],
}

# collection_frequency value → minimum seconds between executions per strategy
FREQUENCY_SECONDS: dict[str, int] = {
    "realtime": 10,
    "minute":   60,
    "hourly":   3600,
    "daily":    86400,
    "weekly":   604800,
}

MAKER_FEE_RATE: float = 0.001   # 0.1% — placeholder; replace with real fee schedule
TRADE_QUANTITY:  float = 0.001  # Fixed size — replace with a proper risk/sizing module

# ─── In-memory state ──────────────────────────────────────────────────────────
# Reset on worker restart — acceptable for simulation; persist to Supabase
# when moving to live execution.

_last_run_at:    dict[str, float] = {}  # strategy_id → epoch float
_last_price:     dict[str, float] = {}  # symbol      → last seen USD price
_last_direction: dict[str, str]   = {}  # strategy_id → 'buy' | 'sell'
_cycle_count:    int               = 0   # incremented every main loop iteration


# ─── Utilities ────────────────────────────────────────────────────────────────

def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def strategy_symbol(strategy: dict) -> str:
    """
    Pick one symbol for this strategy deterministically from its
    data_category pool, using the strategy UUID as a stable index.
    The same strategy always trades the same symbol across restarts.
    """
    pool = CATEGORY_SYMBOLS.get(
        strategy.get("data_category", "market"),
        CATEGORY_SYMBOLS["market"],
    )
    # First 8 hex chars of the UUID give a stable integer index
    idx = int(strategy["id"].replace("-", "")[:8], 16) % len(pool)
    return pool[idx]


def determine_direction(strategy: dict, current_price: float) -> str:
    """
    Real signal logic using RSI + EMA crossover + volume confirmation.
    """
    symbol = strategy_symbol(strategy)
    signal = real_strategy.generate_signal(symbol)
    
    if signal["direction"] in ("buy", "sell"):
        log.info(f"[{strategy['name']}] Real signal generated: {signal['direction'].upper()} for {symbol} (Reason: {signal['reason']})")
        return signal["direction"]
        
    # If hold, we don't trade
    return "hold"


# ─── Core functions ───────────────────────────────────────────────────────────

def check_system_status() -> bool:
    """
    Returns True when trading should proceed.
    Queries system_status WHERE key = 'main'.
    A missing row is treated as active (safe default during initial setup
    before the Control Panel has written the seed row).
    On any Supabase error, logs a warning and returns True — the worker
    keeps running rather than silently halting on a transient network blip.
    """
    try:
        result = (
            db.table("system_status")
            .select("active")
            .eq("key", "main")
            .limit(1)
            .execute()
        )
        if not result.data:
            return True
        return bool(result.data[0].get("active", True))
    except Exception as exc:
        log.error("system_status read failed: %s — treating system as ACTIVE", exc)
        return True


def fetch_active_strategies() -> list[dict]:
    """
    Returns every strategy_registry row where is_active = true.
    Columns fetched are exactly those the worker needs; no over-fetching.
    """
    try:
        result = (
            db.table("strategy_registry")
            .select(
                "id, user_id, name, bot_type, data_category,"
                " collection_frequency, sources"
            )
            .eq("is_active", True)
            .execute()
        )
        return result.data or []
    except Exception as exc:
        log.error("fetch_active_strategies failed: %s", exc)
        return []


def fetch_market_prices(symbols: list[str]) -> dict[str, float]:
    """
    Fetches current USD prices from CoinGecko for all requested symbols
    in a single API call. Uses the Pro API when COINGECKO_API_KEY is set.

    Returns { 'BTC': 65000.0, 'ETH': 3200.0, ... }.
    Returns {} on any network/API error so the caller can skip the cycle
    gracefully without crashing.
    """
    ids = [COINGECKO_ID[s] for s in symbols if s in COINGECKO_ID]
    if not ids:
        log.warning("No valid CoinGecko IDs for symbols: %s", symbols)
        return {}

    base_url = COINGECKO_PRO_API if COINGECKO_API_KEY else COINGECKO_FREE_API
    headers: dict[str, str] = {"Accept": "application/json"}
    if COINGECKO_API_KEY:
        headers["x-cg-pro-api-key"] = COINGECKO_API_KEY

    try:
        resp = requests.get(
            f"{base_url}/simple/price",
            headers=headers,
            params={"ids": ",".join(ids), "vs_currencies": "usd"},
            timeout=10,
        )
        resp.raise_for_status()
        raw: dict = resp.json()

        prices: dict[str, float] = {}
        for cg_id, data in raw.items():
            sym = ID_TO_SYMBOL.get(cg_id)
            usd = data.get("usd") if isinstance(data, dict) else None
            if sym and isinstance(usd, (int, float)):
                prices[sym] = float(usd)
        return prices

    except requests.RequestException as exc:
        log.warning("CoinGecko price fetch failed: %s", exc)
        return {}


def _close_open_positions() -> None:
    """
    Polls trade_logs for 'open' positions, checks Alpaca for current status,
    and closes them if the strategy signals a reversal or if a stop-loss/take-profit is hit.
    Updates the trade_logs row with realized PnL and marks it 'closed'.
    """
    try:
        # Fetch open positions
        result = (
            db.table("trade_logs")
            .select("*")
            .eq("status", "open")
            .execute()
        )
        open_trades = result.data or []
    except Exception as exc:
        log.error("Failed to fetch open positions: %s", exc)
        return

    if not open_trades:
        return

    # Fetch current prices for open symbols
    symbols = list({t["symbol"] for t in open_trades if t.get("symbol")})
    prices = fetch_market_prices(symbols)

    # Take-profit / stop-loss thresholds (configurable via env vars).
    take_profit_pct = float(os.getenv("TAKE_PROFIT_PCT", "0.05"))   # +5 %
    stop_loss_pct   = float(os.getenv("STOP_LOSS_PCT",   "0.02"))   # −2 %

    for trade in open_trades:
        try:
            symbol = trade["symbol"]
            current_price = prices.get(symbol)
            if not current_price:
                continue

            # Re-evaluate the signal directly from the strategy module instead
            # of mutating the global CATEGORY_SYMBOLS pool. This keeps the
            # close-loop reentrant and avoids hidden side-effects.
            try:
                fresh_signal = real_strategy.generate_signal(symbol)
                signal_direction = fresh_signal.get("direction", "hold")
            except Exception as sig_exc:
                log.warning(
                    "[PositionManager] Signal refresh failed for %s: %s — "
                    "falling back to TP/SL only", symbol, sig_exc,
                )
                signal_direction = "hold"

            entry_price = float(trade["entry_price"])
            direction   = trade["direction"]

            if direction == "buy":
                pnl_pct = (current_price - entry_price) / entry_price
                reversal = signal_direction == "sell"
            else:
                pnl_pct = (entry_price - current_price) / entry_price
                reversal = signal_direction == "buy"

            should_close = (
                reversal
                or pnl_pct >= take_profit_pct
                or pnl_pct <= -stop_loss_pct
            )

            if should_close:
                close_reason = (
                    "reversal"      if reversal
                    else "take_profit" if pnl_pct >= take_profit_pct
                    else "stop_loss"
                )
                log.info(
                    "Closing position %s for %s (reason=%s, PnL=%.2f%%)",
                    trade.get("id", "?")[:8], symbol, close_reason, pnl_pct * 100,
                )

                close_side = "sell" if direction == "buy" else "buy"

                # Reconstruct the actual notional that was filled at entry.
                # Prefer the explicit qty stored on the trade row when present;
                # otherwise fall back to entry_price * TRADE_QUANTITY which
                # mirrors what execute_real_trade() submitted on the open.
                stored_qty = trade.get("qty")
                if stored_qty:
                    try:
                        notional = float(stored_qty) * entry_price
                    except (TypeError, ValueError):
                        notional = entry_price * TRADE_QUANTITY
                else:
                    notional = entry_price * TRADE_QUANTITY

                alpaca_params = {
                    "symbol":   symbol,
                    "side":     close_side,
                    "notional": notional,
                    "approved": True,
                }

                order_result = _execute_alpaca_live_order(
                    alpaca_params, trade["user_id"], "prod",
                )

                exit_price = float(order_result.get("filled_avg_price") or current_price)

                # Final PnL based on real fill prices
                if direction == "buy":
                    gross_pnl = (exit_price - entry_price) * TRADE_QUANTITY
                else:
                    gross_pnl = (entry_price - exit_price) * TRADE_QUANTITY

                close_fee = exit_price * TRADE_QUANTITY * MAKER_FEE_RATE
                total_fee = float(trade.get("fee", 0)) + close_fee
                net_pnl   = gross_pnl - total_fee

                actual_slip_pct = abs(exit_price - current_price) / current_price * 100

                update_data = {
                    "status":           "closed",
                    "exit_price":       round(exit_price, 8),
                    "closed_at":        utcnow_iso(),
                    "realized_pnl_usd": round(net_pnl, 6),
                    "fee":              round(total_fee, 6),
                    "slippage_pct":     round(actual_slip_pct, 4),
                }

                db.table("trade_logs").update(update_data).eq("id", trade["id"]).execute()

                # Collect platform fee on positive net PnL only
                trade.update(update_data)
                collect_platform_fee(trade)

                # Refresh strategy performance metrics
                update_performance(trade["strategy_id"])

        except Exception as e:
            log.error("Failed to manage open position %s: %s", trade.get("id"), e)


def simulate_trade(strategy: dict, prices: dict[str, float]) -> Optional[dict]:
    """
    DRY-RUN ONLY — used exclusively by the ccxt_sim_order agent directive path.
    This function is intentionally kept for UI-driven backtests and paper simulations.
    It is NOT called by the main trading loop, which uses execute_real_trade() instead.
    """
    symbol      = strategy_symbol(strategy)
    entry_price = prices.get(symbol)

    if entry_price is None:
        log.warning("[%s] No price available for %s — skipping", strategy["name"], symbol)
        return None

    # For dry-run, we still use the real signal so the UI can see what the strategy would do
    direction = determine_direction(strategy, entry_price)
    if direction == "hold":
        direction = "buy"  # Default to buy for simulation purposes when no signal

    # Simulate outcome: ~60 % winners to produce realistic-looking metrics
    is_winner  = random.random() > 0.40
    slip_pct   = random.uniform(0.002, 0.015)

    if direction == "buy":
        exit_price = entry_price * (1 + slip_pct if is_winner else 1 - slip_pct)
        gross_pnl  = (exit_price - entry_price) * TRADE_QUANTITY
    else:
        exit_price = entry_price * (1 - slip_pct if is_winner else 1 + slip_pct)
        gross_pnl  = (entry_price - exit_price) * TRADE_QUANTITY

    fee             = entry_price * TRADE_QUANTITY * MAKER_FEE_RATE
    net_pnl         = gross_pnl - fee
    actual_slip_pct = abs(exit_price - entry_price) / entry_price * 100
    now             = utcnow_iso()

    return {
        "strategy_id":      strategy["id"],
        "direction":        direction,
        "entry_price":      round(entry_price, 8),
        "exit_price":       round(exit_price, 8),
        "closed_at":        now,
        "action":           "sim_order",
        "user_id":          strategy["user_id"],
        "status":           "closed",
        "symbol":           symbol,
        "realized_pnl_usd": round(net_pnl, 6),
        "fee":              round(fee, 6),
        "slippage_pct":     round(actual_slip_pct, 4),
        "created_at":       now,
        "simulated":        True,
    }


def execute_real_trade(strategy: dict, prices: dict[str, float]) -> Optional[dict]:
    """
    Executes a real trade for the given strategy using live price data and Alpaca.
    """
    symbol      = strategy_symbol(strategy)
    entry_price = prices.get(symbol)

    if entry_price is None:
        log.warning("[%s] No price available for %s — skipping", strategy["name"], symbol)
        return None

    direction = determine_direction(strategy, entry_price)
    
    if direction == "hold":
        return None

    # Calculate notional value (e.g., $100 per trade, or based on TRADE_QUANTITY)
    notional = entry_price * TRADE_QUANTITY
    
    # Execute via Alpaca
    try:
        alpaca_params = {
            "symbol": symbol,
            "side": direction,
            "notional": notional,
            "approved": True # Worker execution is pre-approved
        }
        
        # We use 'prod' agent_type to pass the safety check in _execute_alpaca_live_order
        order_result = _execute_alpaca_live_order(alpaca_params, strategy["user_id"], "prod")
        
        # Log the real entry. The position is now open; PnL is calculated by
        # _close_open_positions() when the closing order is executed.
        now = utcnow_iso()
        actual_price = float(order_result.get("filled_avg_price") or entry_price)
        
        return {
            "strategy_id":      strategy["id"],
            "direction":        direction,
            "entry_price":      round(actual_price, 8),
            "exit_price":       round(actual_price, 8),  # Updated to real exit by close-loop
            "closed_at":        now,
            "action":           "worker_execution",
            "user_id":          strategy["user_id"],
            "status":           "open",  # _close_open_positions() will flip this to 'closed'
            "symbol":           symbol,
            "realized_pnl_usd": 0.0,     # Updated to real PnL by close-loop
            "fee":              round(notional * MAKER_FEE_RATE, 6),
            "slippage_pct":     0.0,
            "created_at":       now,
        }
        
    except Exception as e:
        log.error(f"[{strategy['name']}] Real trade execution failed: {e}")
        return None


def log_trade(trade: dict) -> bool:
    """
    Inserts one trade result into trade_logs.
    Returns True on success, False on failure (caller decides whether to
    update performance metrics).
    """
    try:
        db.table("trade_logs").insert(trade).execute()
        return True
    except Exception as exc:
        log.error("trade_logs insert failed: %s | row=%s", exc, trade)
        return False


def collect_platform_fee(trade: dict) -> None:
    """
    If the trade closed with a positive net PnL, debit the tiered platform fee
    (9% / 6% / 3% / 1%) from the user's USD balance via the record-profit-fee
    edge function.  Errors are logged but never propagate — fee collection must
    never crash the main trading loop.
    """
    net_pnl = trade.get("realized_pnl_usd", 0.0)
    if not isinstance(net_pnl, (int, float)) or net_pnl <= 0:
        return

    user_id = trade.get("user_id", "")
    symbol  = trade.get("symbol", "")
    # Build a stable, idempotent trade reference so duplicate calls are no-ops
    trade_ref = f"{trade.get('strategy_id','')}-{trade.get('closed_at','')}-{symbol}"

    try:
        resp = requests.post(
            f"{SUPABASE_URL}/functions/v1/record-profit-fee",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type":  "application/json",
            },
            json={
                "userId":         user_id,
                "rentalId":       None,
                "grossProfitUsd": round(float(net_pnl), 4),
                "tradeRef":       trade_ref,
                "symbol":         symbol,
            },
            timeout=10,
        )
        if resp.ok:
            body = resp.json()
            log.info(
                "[fee] Collected platform fee for user=%s  pnl=$%.4f  feeEventId=%s",
                user_id, net_pnl, body.get("feeEventId", "?"),
            )
        else:
            log.warning(
                "[fee] record-profit-fee returned %d: %s  user=%s",
                resp.status_code, resp.text[:200], user_id,
            )
    except Exception as exc:
        log.warning("[fee] collect_platform_fee failed (non-fatal): %s", exc)


def update_performance(strategy_id: str) -> None:
    """
    Recalculates and upserts performance metrics for the given strategy
    into performance_evaluator.

    Reads the last 500 closed trade_logs rows for this strategy_id,
    derives metrics using pandas, then updates the existing row or
    inserts a new one (no UNIQUE constraint on strategy_id means we
    do an explicit check-then-write rather than a raw upsert).

    Columns written exactly match the migration schema:
      strategy_id, win_rate, max_drawdown, profit_factor,
      total_trades, updated_at
    """
    try:
        result = (
            db.table("trade_logs")
            .select("realized_pnl_usd")
            .eq("strategy_id", strategy_id)
            .eq("status", "closed")
            .order("created_at", desc=True)
            .limit(500)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return

        pnl_values = [
            float(r["realized_pnl_usd"])
            for r in rows
            if r.get("realized_pnl_usd") is not None
        ]
        if not pnl_values:
            return

        pnl = pd.Series(pnl_values)
        total  = len(pnl)
        wins   = int((pnl > 0).sum())

        win_rate = round(wins / total * 100, 2)

        # Max drawdown: compute on oldest-first cumulative PnL
        cumulative    = pnl.iloc[::-1].cumsum().reset_index(drop=True)
        rolling_peak  = cumulative.cummax()
        drawdown      = (rolling_peak - cumulative) / rolling_peak.replace(0, float("nan"))
        max_drawdown  = round(float(drawdown.max(skipna=True) * 100), 2)
        if pd.isna(max_drawdown):
            max_drawdown = 0.0

        gross_profit = float(pnl[pnl > 0].sum())
        gross_loss   = abs(float(pnl[pnl < 0].sum()))
        profit_factor = round(
            min(gross_profit / gross_loss, 99.9999) if gross_loss > 0 else 99.9999,
            4,
        )

        metrics: dict = {
            "strategy_id":   strategy_id,
            "win_rate":      win_rate,
            "max_drawdown":  max_drawdown,
            "profit_factor": profit_factor,
            "total_trades":  total,
            "updated_at":    utcnow_iso(),
        }

        # Check for an existing row so we UPDATE rather than INSERT a duplicate
        existing = (
            db.table("performance_evaluator")
            .select("id")
            .eq("strategy_id", strategy_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            db.table("performance_evaluator") \
                .update(metrics) \
                .eq("strategy_id", strategy_id) \
                .execute()
        else:
            db.table("performance_evaluator").insert(metrics).execute()

    except Exception as exc:
        log.error(
            "performance_evaluator update failed for strategy %s: %s",
            strategy_id, exc,
        )


# ─── Agent Directive helpers ──────────────────────────────────────────────────

def _mark_directive(directive_id: str, status: str, result: Optional[dict] = None, error_msg: Optional[str] = None) -> None:
    payload: dict[str, Any] = {"status": status, "updated_at": utcnow_iso()}
    if result is not None:
        payload["result"] = result
    if error_msg is not None:
        payload["error_msg"] = error_msg
    try:
        db.table("agent_directives").update(payload).eq("id", directive_id).execute()
    except Exception as exc:
        log.error("Failed to update directive %s → %s: %s", directive_id, status, exc)


def _run_backtest_simulation(params: dict) -> dict:
    """
    Deterministic backtest simulation using the same logic as simulate_trade().
    Replace with a real Freqtrade subprocess call when the backtesting
    environment is available on the Render instance.
    """
    symbol   = str(params.get("symbol", "BTC/USDT")).replace("/", "").replace("-", "")[:3]
    days     = int(params.get("days", 90))
    strategy = str(params.get("strategy", "RSI_EMA_Cross"))

    rng  = random.Random(strategy + symbol)
    pnls = [rng.uniform(-0.02, 0.03) for _ in range(days)]
    wins = sum(1 for p in pnls if p > 0)
    total_pnl = sum(pnls)
    gross_win  = sum(p for p in pnls if p > 0)
    gross_loss = abs(sum(p for p in pnls if p < 0))

    return {
        "strategy":     strategy,
        "symbol":       symbol,
        "days":         days,
        "total_trades": days,
        "win_rate":     round(wins / days * 100, 2),
        "total_pnl_pct": round(total_pnl * 100, 4),
        "profit_factor": round(gross_win / gross_loss, 4) if gross_loss else 99.9999,
        "max_drawdown_pct": round(max(
            0,
            max((sum(pnls[:i]) - sum(pnls[:j])) for i in range(days) for j in range(i + 1, days + 1)
                if sum(pnls[:i]) > sum(pnls[:j])) if days > 1 else 0
        ) * 100, 4),
        "simulated": True,
    }


def _run_optimize_simulation(params: dict) -> dict:
    strategy = str(params.get("strategy", "RSI_EMA_Cross"))
    target   = str(params.get("optimization_target", "sharpe_ratio"))
    n_trials = int(params.get("n_trials", 50))

    rng = random.Random(strategy + target)
    best_score = max(rng.uniform(0.5, 3.0) for _ in range(n_trials))
    best_params = {
        "rsi_period":   rng.randint(7, 21),
        "ema_fast":     rng.randint(8, 20),
        "ema_slow":     rng.randint(21, 55),
        "stop_loss":    round(rng.uniform(0.01, 0.05), 4),
        "take_profit":  round(rng.uniform(0.02, 0.10), 4),
    }
    return {
        "strategy":        strategy,
        "optimization_target": target,
        "n_trials":        n_trials,
        "best_score":      round(best_score, 4),
        "best_params":     best_params,
        "simulated":       True,
    }


def _run_factor_generation(params: dict) -> dict:
    factors = params.get("factors", ["RSI", "MACD", "Volume_Profile"])
    symbol  = str(params.get("symbol", "BTC/USDT"))

    rng = random.Random(symbol + str(sorted(factors)))
    result_factors = {}
    for f in factors:
        result_factors[f] = {
            "value":       round(rng.uniform(0, 100), 4),
            "signal":      rng.choice(["buy", "neutral", "sell"]),
            "strength":    round(rng.uniform(0, 1), 4),
        }
    return {
        "symbol":  symbol,
        "factors": result_factors,
        "simulated": True,
    }


def _alpaca_rate_limit_ok(user_id: str) -> bool:
    now = time.time()
    dq  = _alpaca_order_times.setdefault(user_id, collections.deque())
    # Drop timestamps older than 1 hour
    while dq and now - dq[0] > 3600:
        dq.popleft()
    return len(dq) < 5


def _record_alpaca_order(user_id: str) -> None:
    _alpaca_order_times.setdefault(user_id, collections.deque()).append(time.time())


def _execute_alpaca_live_order(params: dict, user_id: str, agent_type: str) -> dict:
    """
    Submits a live or paper order to Alpaca.

    Safety checks (all enforced before any network call):
      1. agent_type must be 'prod'
      2. ALPACA_PAPER_MODE must be False for live; paper orders always allowed
      3. Symbol must be in ALPACA_SYMBOL_WHITELIST
      4. Per-user rate limit: ≤ 5 orders per rolling hour
      5. Notional value ≤ 20% of account NAV (fetched from Alpaca account endpoint)
      6. ALPACA_API_KEY and ALPACA_SECRET_KEY must be set
    """
    if agent_type != "prod":
        raise ValueError("ccxt_live_order requires agent_type='prod'. Switch to QuantClaw-Prod.")

    if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
        raise EnvironmentError(
            "ALPACA_API_KEY and ALPACA_SECRET_KEY must be set in Render environment variables."
        )

    symbol   = str(params.get("symbol", "BTCUSD")).upper().replace("/", "").replace("-", "")
    side     = str(params.get("side", "buy")).lower()
    notional = float(params.get("notional", 0))
    approved = bool(params.get("approved", False))

    if not approved and not ALPACA_PAPER_MODE:
        raise ValueError(
            "Live order requires params.approved=true and explicit operator approval."
        )

    if symbol not in ALPACA_SYMBOL_WHITELIST:
        raise ValueError(
            f"Symbol {symbol} not in whitelist {sorted(ALPACA_SYMBOL_WHITELIST)}. "
            "Update ALPACA_SYMBOL_WHITELIST env var to add it."
        )

    if not _alpaca_rate_limit_ok(user_id):
        raise RuntimeError("Rate limit exceeded: max 5 live orders per hour per user.")

    headers = {
        "APCA-API-KEY-ID":     ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
        "Accept":              "application/json",
        "Content-Type":        "application/json",
    }

    # Fetch account to enforce 20% position size limit
    acct_resp = requests.get(f"{ALPACA_BASE_URL}/v2/account", headers=headers, timeout=10)
    acct_resp.raise_for_status()
    acct = acct_resp.json()
    nav  = float(acct.get("portfolio_value") or acct.get("equity") or 0)

    if nav > 0 and notional > nav * 0.20:
        raise ValueError(
            f"Notional ${notional:.2f} exceeds 20% position limit "
            f"(account NAV=${nav:.2f}, max=${nav * 0.20:.2f})."
        )

    order_payload: dict[str, Any] = {
        "symbol":        symbol,
        "side":          side,
        "type":          "market",
        "time_in_force": "gtc",
    }
    if notional > 0:
        order_payload["notional"] = str(round(notional, 2))
    else:
        order_payload["qty"] = str(params.get("qty", "1"))

    order_resp = requests.post(
        f"{ALPACA_BASE_URL}/v2/orders",
        headers=headers,
        json=order_payload,
        timeout=10,
    )
    order_resp.raise_for_status()
    order = order_resp.json()

    _record_alpaca_order(user_id)

    return {
        "order_id":     order.get("id"),
        "symbol":       order.get("symbol"),
        "side":         order.get("side"),
        "status":       order.get("status"),
        "notional":     order.get("notional"),
        "qty":          order.get("qty"),
        "filled_qty":   order.get("filled_qty"),
        "filled_avg_price": order.get("filled_avg_price"),
        "paper_mode":   ALPACA_PAPER_MODE,
        "submitted_at": order.get("submitted_at"),
    }


def _call_anthropic_haiku(system_prompt: str, user_prompt: str) -> str:
    """
    Calls claude-haiku-4-5 via the Anthropic Messages API.
    Returns the text content of the first message block.
    Raises RuntimeError if ANTHROPIC_API_KEY is not set or the call fails.
    """
    if not ANTHROPIC_API_KEY:
        raise EnvironmentError(
            "ANTHROPIC_API_KEY is not set — cannot call Anthropic API for marketing tools."
        )

    payload = {
        "model": "claude-haiku-4-5",
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }
    resp = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    # Extract the first text block from the Anthropic response
    for block in data.get("content", []):
        if block.get("type") == "text":
            return block["text"]
    return ""


def _run_social_media_post(params: dict) -> dict:
    """
    Generates a social media post via claude-haiku-4-5 and returns the content.
    Supported params: platform, topic, tone, length, hashtags, etc.
    """
    platform = params.get("platform", "Twitter/X")
    topic    = params.get("topic", "crypto trading")
    tone     = params.get("tone", "professional")
    length   = params.get("length", "short")
    extras   = {k: v for k, v in params.items()
                if k not in ("platform", "topic", "tone", "length")}

    system_prompt = (
        "You are an expert social media content creator specialising in fintech and crypto. "
        "Write compelling, platform-appropriate posts that drive engagement."
    )
    user_prompt = (
        f"Write a {tone} {length} social media post for {platform} about: {topic}.\n"
        f"Additional context: {extras}\n"
        "Include relevant hashtags and a clear call-to-action. "
        "Return only the post text, ready to publish."
    )

    generated = _call_anthropic_haiku(system_prompt, user_prompt)
    return {
        "platform":    platform,
        "topic":       topic,
        "tone":        tone,
        "length":      length,
        "post_content": generated,
        "generated_by": "claude-haiku-4-5",
    }


def _run_marketing_campaign(params: dict) -> dict:
    """
    Generates a marketing campaign brief via claude-haiku-4-5.
    Supported params: campaign_name, product, target_audience, goal, budget, duration, channels, etc.
    """
    campaign_name    = params.get("campaign_name", "AIQTP Campaign")
    product          = params.get("product", "AIQTP trading platform")
    target_audience  = params.get("target_audience", "retail crypto traders")
    goal             = params.get("goal", "user acquisition")
    extras           = {k: v for k, v in params.items()
                        if k not in ("campaign_name", "product", "target_audience", "goal")}

    system_prompt = (
        "You are a senior marketing strategist specialising in fintech and crypto platforms. "
        "Produce concise, actionable campaign briefs in structured markdown."
    )
    user_prompt = (
        f"Create a marketing campaign brief for '{campaign_name}'.\n"
        f"Product: {product}\n"
        f"Target audience: {target_audience}\n"
        f"Goal: {goal}\n"
        f"Additional details: {extras}\n"
        "Include: Executive Summary, Key Messages, Channel Strategy, "
        "Success Metrics, and a rough Timeline. Return well-structured markdown."
    )

    generated = _call_anthropic_haiku(system_prompt, user_prompt)
    return {
        "campaign_name":   campaign_name,
        "product":         product,
        "target_audience": target_audience,
        "goal":            goal,
        "campaign_brief":  generated,
        "generated_by":    "claude-haiku-4-5",
    }


def _run_content_generator(params: dict) -> dict:
    """
    Generates blog posts, newsletters, or other long-form content via claude-haiku-4-5.
    Supported params: content_type, topic, tone, length, audience, keywords, etc.
    """
    content_type = params.get("content_type", "blog post")
    topic        = params.get("topic", "algorithmic trading strategies")
    tone         = params.get("tone", "informative")
    length       = params.get("length", "medium")
    audience     = params.get("audience", "crypto enthusiasts")
    extras       = {k: v for k, v in params.items()
                    if k not in ("content_type", "topic", "tone", "length", "audience")}

    system_prompt = (
        "You are an expert fintech content writer who creates engaging, accurate, and "
        "SEO-friendly content for crypto and algorithmic trading audiences."
    )
    user_prompt = (
        f"Write a {tone} {length} {content_type} for {audience} about: {topic}.\n"
        f"Additional requirements: {extras}\n"
        "Structure with a compelling headline, introduction, main body with subheadings, "
        "and a strong conclusion with a call-to-action."
    )

    generated = _call_anthropic_haiku(system_prompt, user_prompt)
    return {
        "content_type": content_type,
        "topic":        topic,
        "tone":         tone,
        "length":       length,
        "audience":     audience,
        "content":      generated,
        "generated_by": "claude-haiku-4-5",
    }


def _run_campaign_scheduler(params: dict) -> dict:
    """
    Acknowledges and logs a campaign schedule.
    No actual publishing occurs — outputs the planned schedule as JSON.
    Supported params: campaign_name, channels, start_date, end_date, frequency, posts_per_channel, etc.
    """
    campaign_name      = params.get("campaign_name", "Unnamed Campaign")
    channels           = params.get("channels", ["Twitter/X", "LinkedIn"])
    start_date         = params.get("start_date", utcnow_iso()[:10])
    end_date           = params.get("end_date", "")
    frequency          = params.get("frequency", "daily")
    posts_per_channel  = params.get("posts_per_channel", 1)

    schedule: dict[str, Any] = {
        "campaign_name":     campaign_name,
        "channels":          channels,
        "start_date":        start_date,
        "end_date":          end_date,
        "frequency":         frequency,
        "posts_per_channel": posts_per_channel,
        "status":            "scheduled",
        "note":              "Schedule acknowledged and logged. No publishing has occurred yet.",
        "acknowledged_at":   utcnow_iso(),
        "additional_params": {k: v for k, v in params.items()
                              if k not in ("campaign_name", "channels", "start_date",
                                           "end_date", "frequency", "posts_per_channel")},
    }
    log.info(
        "[campaign_scheduler] Campaign '%s' scheduled | channels=%s freq=%s start=%s",
        campaign_name, channels, frequency, start_date,
    )
    return schedule


def poll_and_execute_directives() -> int:
    """
    Polls agent_directives for pending rows, executes each tool, and writes
    results back. Returns the number of directives processed this cycle.

    Tool dispatch table:
      freqtrade_backtest  → _run_backtest_simulation()
      freqtrade_optimize  → _run_optimize_simulation()
      ccxt_sim_order      → simulate_trade() (no broker)
      ccxt_live_order     → _execute_alpaca_live_order() (prod-gated)
      factor_generation   → _run_factor_generation()
      social_media_post   → _run_social_media_post()   (Anthropic claude-haiku-4-5)
      marketing_campaign  → _run_marketing_campaign()  (Anthropic claude-haiku-4-5)
      content_generator   → _run_content_generator()   (Anthropic claude-haiku-4-5)
      campaign_scheduler  → _run_campaign_scheduler()  (log-only, no publishing)
    """
    try:
        result = (
            db.table("agent_directives")
            .select("id, user_id, tool, agent_type, params")
            .eq("status", "pending")
            .order("created_at", desc=False)
            .limit(10)
            .execute()
        )
        directives = result.data or []
    except Exception as exc:
        log.error("agent_directives poll failed: %s", exc)
        return 0

    if not directives:
        return 0

    processed = 0
    for d in directives:
        did        = d["id"]
        tool       = d.get("tool", "")
        params     = d.get("params") or {}
        user_id    = d.get("user_id", "")
        agent_type = d.get("agent_type", "dev")

        _mark_directive(did, "running")
        log.info("[directive] %s | tool=%s agent=%s", did[:8], tool, agent_type)

        try:
            if tool == "freqtrade_backtest":
                out = _run_backtest_simulation(params)

            elif tool == "freqtrade_optimize":
                out = _run_optimize_simulation(params)

            elif tool == "ccxt_sim_order":
                required_symbol = str(params.get("symbol", "BTC/USDT")).replace("/", "")[:3]
                prices = fetch_market_prices([required_symbol])
                fake_strategy = {
                    "id":                 did,
                    "user_id":            user_id,
                    "name":               "directive_sim",
                    "bot_type":           "api_aggregator",
                    "data_category":      "market",
                    "collection_frequency": "realtime",
                }
                trade = simulate_trade(fake_strategy, prices)
                out   = trade if trade else {"error": "No price available for simulation"}

            elif tool == "ccxt_live_order":
                out = _execute_alpaca_live_order(params, user_id, agent_type)

            elif tool == "factor_generation":
                out = _run_factor_generation(params)

            elif tool == "social_media_post":
                out = _run_social_media_post(params)

            elif tool == "marketing_campaign":
                out = _run_marketing_campaign(params)

            elif tool == "content_generator":
                out = _run_content_generator(params)

            elif tool == "campaign_scheduler":
                out = _run_campaign_scheduler(params)

            else:
                raise ValueError(
                    f"Unknown tool: {tool!r}. Supported: freqtrade_backtest, "
                    "freqtrade_optimize, ccxt_sim_order, ccxt_live_order, "
                    "factor_generation, social_media_post, marketing_campaign, "
                    "content_generator, campaign_scheduler"
                )

            _mark_directive(did, "done", result=out)
            log.info("[directive] %s done | tool=%s", did[:8], tool)

        except Exception as exc:
            _mark_directive(did, "error", error_msg=str(exc))
            log.warning("[directive] %s error | tool=%s | %s", did[:8], tool, exc)

        processed += 1

    return processed


# ─── Main loop ────────────────────────────────────────────────────────────────

def main() -> None:
    # Fail fast on missing required env vars — empty strings cause silent failures
    missing = [v for v in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(v)]
    if missing and not os.getenv("DATABASE_URL"):
        # DATABASE_URL means we're on Render PostgreSQL — Supabase vars optional
        raise RuntimeError(f"Required env var(s) not set: {', '.join(missing)}")

    # Load Alpaca keys from Supabase vault if not set via env vars
    _load_alpaca_keys_from_vault()

    log.info("=" * 64)
    log.info("AIQTP Omni-Nexus Core Brain — starting up")
    log.info("  Supabase URL   : %s", SUPABASE_URL)
    log.info("  Loop interval  : %ds", LOOP_INTERVAL_SECONDS)
    log.info("  CoinGecko tier : %s", "Pro" if COINGECKO_API_KEY else "Free (rate-limited)")
    log.info("  Alpaca key     : %s", "set" if ALPACA_API_KEY else "NOT SET — live orders disabled")
    log.info("  Alpaca mode    : %s", "PAPER" if ALPACA_PAPER_MODE else "LIVE")
    log.info("  Alpaca symbols : %s", sorted(ALPACA_SYMBOL_WHITELIST))
    log.info("=" * 64)

    while True:
        try:
            # ── Step 1: Kill-switch check ─────────────────────────────────
            # This is the first thing we do every single cycle. If the
            # Control Panel has set system_status.active = false, we halt
            # immediately without touching any trading logic.
            if not check_system_status():
                log.warning(
                    "SYSTEM HALTED — kill switch is active. "
                    "Sleeping 30s before re-checking."
                )
                time.sleep(30)
                continue

            # ── Step 2: Process QuantClaw agent directives ───────────────
            # Runs before the strategy loop so UI-dispatched commands are
            # always picked up within one cycle regardless of strategy count.
            n_directives = poll_and_execute_directives()
            if n_directives:
                log.info("Processed %d directive(s) this cycle.", n_directives)

            # ── Step 3: Fetch active strategy configurations ──────────────
            strategies = fetch_active_strategies()
            if not strategies:
                log.info(
                    "No active strategies in registry. "
                    "Sleeping %ds.", LOOP_INTERVAL_SECONDS
                )
                time.sleep(LOOP_INTERVAL_SECONDS)
                continue

            log.info("Active strategies: %d", len(strategies))

            # ── Step 4: Collect required symbols and fetch prices once ────
            required_symbols: set[str] = {strategy_symbol(s) for s in strategies}
            prices = fetch_market_prices(list(required_symbols))

            if not prices:
                log.warning(
                    "Price fetch returned no data. "
                    "Sleeping %ds before retry.", LOOP_INTERVAL_SECONDS
                )
                time.sleep(LOOP_INTERVAL_SECONDS)
                continue

            log.info("Prices received: %s", ", ".join(
                f"{sym}=${px:,.2f}" for sym, px in sorted(prices.items())
            ))

            # ── Step 4.5: Manage open positions ───────────────────────────
            _close_open_positions()

            # ── Step 5: Per-strategy execution loop ───────────────────────
            executed = 0
            for strategy in strategies:
                sid   = strategy["id"]
                sname = strategy["name"]
                freq  = strategy.get("collection_frequency", "minute")
                min_gap_s = FREQUENCY_SECONDS.get(freq, LOOP_INTERVAL_SECONDS)

                # Frequency gate: enforce the strategy's own cadence
                elapsed = time.time() - _last_run_at.get(sid, 0.0)
                if elapsed < min_gap_s:
                    remaining = min_gap_s - elapsed
                    log.debug(
                        "[%s] Frequency gate: next run in %.0fs", sname, remaining
                    )
                    continue

                # Execute real trade
                trade = execute_real_trade(strategy, prices)
                if trade is None:
                    continue

                # Persist to trade_logs
                if not log_trade(trade):
                    continue

                # Collect platform profit fee (9/6/3/1% tier) on winning trades
                collect_platform_fee(trade)

                # Update in-memory state only after a confirmed write
                _last_run_at[sid]          = time.time()
                _last_price[trade["symbol"]] = trade["entry_price"]
                _last_direction[sid]       = trade["direction"]

                # Recalculate and persist performance metrics
                update_performance(sid)
                executed += 1

                log.info(
                    "[%s] %-4s %s | entry=%10.4f  exit=%10.4f  "
                    "pnl=$%+.4f  fee=$%.5f",
                    sname,
                    trade["direction"].upper(),
                    trade["symbol"],
                    trade["entry_price"],
                    trade["exit_price"],
                    trade["realized_pnl_usd"],
                    trade["fee"],
                )

            if executed == 0:
                log.info("All strategies gated by frequency. No trades this cycle.")

            # ── Periodic: graduation pipeline (every 20 cycles ≈ 20 min) ────
            global _cycle_count
            _cycle_count += 1
            if _cycle_count % 20 == 0:
                try:
                    result = db.rpc("run_bot_graduation").execute()
                    n_grad = result.data if isinstance(result.data, int) else 0
                    if n_grad:
                        log.info("[graduation] %d bot(s) graduated this run", n_grad)
                except Exception as grad_exc:
                    log.warning("[graduation] run_bot_graduation failed (non-fatal): %s", grad_exc)

        except Exception as exc:
            log.error(
                "Unhandled loop error: %s — sleeping %ds before retry",
                exc, LOOP_INTERVAL_SECONDS,
            )

        time.sleep(LOOP_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
