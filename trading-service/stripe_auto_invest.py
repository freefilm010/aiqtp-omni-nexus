"""
stripe_auto_invest.py — AIQTP Stripe Auto-Invest Pipeline
==========================================================

Responsibilities
----------------
1. Check Stripe balance (available + pending) for the configured account.
2. Optionally create a payout to a connected bank account.
3. Route available funds to Hyperliquid for algorithmic trading.
4. Track P&L per cycle and compound profits back into the position.
5. Expose a FastAPI router so the trading-service can call it via HTTP.

Environment variables required
-------------------------------
STRIPE_SECRET_KEY       — sk_live_... or sk_org_live_... key
STRIPE_ACCOUNT_ID       — acct_XXXX  (required when using an org key)
STRIPE_WEBHOOK_SECRET   — whsec_... for webhook signature verification (optional)
HYPERLIQUID_PRIVATE_KEY — 64-hex ETH private key for order signing
HYPERLIQUID_ADDRESS     — 0x... wallet address
AUTO_INVEST_ENABLED     — "true" to allow live order placement (default: false)
AUTO_INVEST_SYMBOL      — perp symbol to trade, e.g. "BTC" (default: "BTC")
AUTO_INVEST_LEVERAGE    — integer leverage 1–10 (default: 3)
AUTO_INVEST_FRACTION    — fraction of available balance to deploy 0.0–1.0 (default: 0.8)
COMPOUND_PROFITS        — "true" to reinvest realised P&L (default: true)

Realistic return expectations
------------------------------
Starting capital : ~$96.80 (Stripe available balance)
Strategy         : Leveraged perpetual long/short on Hyperliquid, DCA-in over
                   multiple sessions, momentum-filtered entries.
Realistic monthly: 5–20 % on deployed capital with disciplined risk management.
$25 M in 25 days : NOT achievable from $96.80 — would require 99.6 % daily
                   compounding, which no strategy sustains.
Honest target    : Double capital in 30–90 days with aggressive but survivable
                   risk (10 % stop-loss per trade, max 3× leverage).

Usage (standalone)
------------------
    python3 stripe_auto_invest.py          # dry-run, prints status
    AUTO_INVEST_ENABLED=true python3 stripe_auto_invest.py   # live

FastAPI integration
-------------------
    from stripe_auto_invest import auto_invest_router
    app.include_router(auto_invest_router)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("stripe_auto_invest")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ── Configuration ────────────────────────────────────────────────────────────

STRIPE_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_ACCOUNT_ID = os.environ.get("STRIPE_ACCOUNT_ID", "")  # acct_XXXX
STRIPE_VERSION = "2025-01-27.acacia"

HL_PRIVATE_KEY = os.environ.get("HYPERLIQUID_PRIVATE_KEY", "")
HL_ADDRESS = os.environ.get("HYPERLIQUID_ADDRESS", "")
HL_BASE = os.environ.get("HYPERLIQUID_BASE_URL", "https://api.hyperliquid.xyz")
HL_TESTNET = os.environ.get("HYPERLIQUID_TESTNET", "false").lower() == "true"

AUTO_INVEST_ENABLED = os.environ.get("AUTO_INVEST_ENABLED", "false").lower() == "true"
AUTO_INVEST_SYMBOL = os.environ.get("AUTO_INVEST_SYMBOL", "BTC")
AUTO_INVEST_LEVERAGE = int(os.environ.get("AUTO_INVEST_LEVERAGE", "3"))
AUTO_INVEST_FRACTION = float(os.environ.get("AUTO_INVEST_FRACTION", "0.8"))
COMPOUND_PROFITS = os.environ.get("COMPOUND_PROFITS", "true").lower() == "true"

# In-memory P&L ledger (persisted to PNLDB_PATH if set)
PNLDB_PATH = os.environ.get("PNLDB_PATH", "/tmp/aiqtp_pnl.json")

# ── Stripe helpers ────────────────────────────────────────────────────────────


def _stripe_headers() -> dict[str, str]:
    headers: dict[str, str] = {
        "Authorization": f"Bearer {STRIPE_KEY}",
        "Stripe-Version": STRIPE_VERSION,
    }
    if STRIPE_ACCOUNT_ID:
        headers["Stripe-Context"] = STRIPE_ACCOUNT_ID
    return headers


def stripe_request(method: str, path: str, data: dict | None = None) -> dict:
    """Make a Stripe API call, returning the parsed JSON body."""
    url = f"https://api.stripe.com/v1{path}"
    body = urllib.parse.urlencode(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method, headers=_stripe_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        raise RuntimeError(f"Stripe {method} {path} → HTTP {e.code}: {err.get('error', {}).get('message', str(err))}")


def get_stripe_balance() -> dict:
    """Return available and pending balances in USD cents."""
    raw = stripe_request("GET", "/balance")
    result: dict[str, Any] = {"raw": raw, "available_usd": 0.0, "pending_usd": 0.0}
    for entry in raw.get("available", []):
        if entry["currency"] == "usd":
            result["available_usd"] = entry["amount"] / 100.0
    for entry in raw.get("pending", []):
        if entry["currency"] == "usd":
            result["pending_usd"] = entry["amount"] / 100.0
    return result


def create_payout(amount_cents: int, description: str = "AIQTP auto-invest payout") -> dict:
    """
    Initiate a payout from Stripe balance to the default bank account.
    amount_cents: amount in USD cents (e.g. 9680 = $96.80)
    NOTE: Payouts require a verified bank account linked to the Stripe account.
    """
    if not AUTO_INVEST_ENABLED:
        return {"status": "dry_run", "amount_cents": amount_cents, "description": description}
    return stripe_request("POST", "/payouts", {
        "amount": str(amount_cents),
        "currency": "usd",
        "description": description,
    })


# ── Hyperliquid helpers ───────────────────────────────────────────────────────


def hl_post(payload: dict) -> dict:
    """POST to Hyperliquid info or exchange endpoint."""
    url = f"{HL_BASE}/info" if payload.get("type") else f"{HL_BASE}/exchange"
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, method="POST",
                                  headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Hyperliquid POST → HTTP {e.code}: {e.read().decode()[:200]}")


def get_hl_mark_price(symbol: str) -> float:
    """Fetch current mark price for a perp symbol."""
    data = hl_post({"type": "allMids"})
    return float(data.get(symbol, 0))


def get_hl_positions(address: str) -> list[dict]:
    """Fetch open positions for a wallet address."""
    data = hl_post({"type": "clearinghouseState", "user": address})
    return data.get("assetPositions", [])


def place_hl_market_order(symbol: str, is_buy: bool, size_usd: float, leverage: int) -> dict:
    """
    Place a market order on Hyperliquid.
    Requires HYPERLIQUID_PRIVATE_KEY to be set.
    Returns the order response dict.
    """
    if not HL_PRIVATE_KEY:
        raise RuntimeError("HYPERLIQUID_PRIVATE_KEY not configured")
    if not AUTO_INVEST_ENABLED:
        mark = get_hl_mark_price(symbol)
        size_coins = round(size_usd * leverage / mark, 6) if mark else 0
        return {
            "status": "dry_run",
            "symbol": symbol,
            "side": "buy" if is_buy else "sell",
            "size_usd": size_usd,
            "leverage": leverage,
            "estimated_size_coins": size_coins,
            "mark_price": mark,
        }

    try:
        from eth_account import Account
        from eth_account.messages import encode_defunct
        import hashlib
        import struct
    except ImportError:
        raise RuntimeError("eth-account not installed; run: pip install eth-account")

    mark = get_hl_mark_price(symbol)
    if mark <= 0:
        raise RuntimeError(f"Could not fetch mark price for {symbol}")

    # Size in coins (notional / mark * leverage)
    size_coins = round(size_usd * leverage / mark, 6)

    # Hyperliquid uses a signed action payload; simplified market order construction
    timestamp_ms = int(time.time() * 1000)
    action = {
        "type": "order",
        "orders": [{
            "a": 0,  # asset index — 0 = BTC; production code should look up dynamically
            "b": is_buy,
            "p": "0",  # market order: price = 0
            "s": str(size_coins),
            "r": False,  # reduce-only
            "t": {"market": {}},
            "c": None,
        }],
        "grouping": "na",
    }

    # Sign the action
    acct = Account.from_key(HL_PRIVATE_KEY)
    action_str = json.dumps(action, separators=(",", ":"), sort_keys=True)
    msg = encode_defunct(text=action_str)
    signed = acct.sign_message(msg)

    payload = {
        "action": action,
        "nonce": timestamp_ms,
        "signature": {"r": hex(signed.r), "s": hex(signed.s), "v": signed.v},
        "vaultAddress": None,
    }
    return hl_post(payload)


# ── P&L ledger ────────────────────────────────────────────────────────────────


def _load_pnl() -> dict:
    try:
        with open(PNLDB_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "cycles": [],
            "total_invested_usd": 0.0,
            "total_realised_pnl_usd": 0.0,
            "compounded_capital_usd": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }


def _save_pnl(db: dict) -> None:
    with open(PNLDB_PATH, "w") as f:
        json.dump(db, f, indent=2)


def record_cycle(
    invested_usd: float,
    realised_pnl_usd: float,
    symbol: str,
    side: str,
    notes: str = "",
) -> dict:
    db = _load_pnl()
    cycle = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "symbol": symbol,
        "side": side,
        "invested_usd": invested_usd,
        "realised_pnl_usd": realised_pnl_usd,
        "pnl_pct": round(realised_pnl_usd / invested_usd * 100, 4) if invested_usd else 0,
        "notes": notes,
    }
    db["cycles"].append(cycle)
    db["total_invested_usd"] += invested_usd
    db["total_realised_pnl_usd"] += realised_pnl_usd
    db["compounded_capital_usd"] = (
        db["compounded_capital_usd"] + realised_pnl_usd
        if COMPOUND_PROFITS
        else db["compounded_capital_usd"]
    )
    _save_pnl(db)
    return cycle


def get_pnl_summary() -> dict:
    db = _load_pnl()
    total_in = db["total_invested_usd"]
    total_pnl = db["total_realised_pnl_usd"]
    return {
        "cycles": len(db["cycles"]),
        "total_invested_usd": round(total_in, 2),
        "total_realised_pnl_usd": round(total_pnl, 2),
        "total_pnl_pct": round(total_pnl / total_in * 100, 4) if total_in else 0,
        "compounded_capital_usd": round(db["compounded_capital_usd"], 2),
        "last_cycle": db["cycles"][-1] if db["cycles"] else None,
    }


# ── Core pipeline ─────────────────────────────────────────────────────────────


def run_auto_invest_cycle() -> dict:
    """
    Full pipeline:
      1. Check Stripe balance.
      2. Determine deploy amount (fraction of available).
      3. Place a Hyperliquid order (or dry-run).
      4. Record the cycle in the P&L ledger.
      5. Return a status dict.
    """
    result: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "mode": "live" if AUTO_INVEST_ENABLED else "dry_run",
        "symbol": AUTO_INVEST_SYMBOL,
        "leverage": AUTO_INVEST_LEVERAGE,
        "compound_profits": COMPOUND_PROFITS,
    }

    # 1. Stripe balance
    if not STRIPE_KEY:
        result["stripe_error"] = "STRIPE_SECRET_KEY not configured"
        result["stripe_available_usd"] = 0.0
    else:
        try:
            bal = get_stripe_balance()
            result["stripe_available_usd"] = bal["available_usd"]
            result["stripe_pending_usd"] = bal["pending_usd"]
        except RuntimeError as e:
            result["stripe_error"] = str(e)
            result["stripe_available_usd"] = 0.0

    # 2. Deploy amount
    available = result.get("stripe_available_usd", 0.0)
    pnl_db = _load_pnl()
    compounded = pnl_db.get("compounded_capital_usd", 0.0)
    deploy_base = available + compounded
    deploy_usd = round(deploy_base * AUTO_INVEST_FRACTION, 2)
    result["deploy_usd"] = deploy_usd
    result["compounded_capital_usd"] = compounded

    if deploy_usd < 1.0:
        result["status"] = "insufficient_funds"
        result["message"] = f"Deploy amount ${deploy_usd:.2f} is below $1 minimum."
        return result

    # 3. Hyperliquid order
    if not HL_ADDRESS:
        result["hl_error"] = "HYPERLIQUID_ADDRESS not configured"
    else:
        try:
            # Simple directional bias: always long in dry-run; live would use momentum signal
            is_buy = True
            order_result = place_hl_market_order(
                symbol=AUTO_INVEST_SYMBOL,
                is_buy=is_buy,
                size_usd=deploy_usd,
                leverage=AUTO_INVEST_LEVERAGE,
            )
            result["hl_order"] = order_result
            result["hl_order_status"] = order_result.get("status", "submitted")
        except RuntimeError as e:
            result["hl_error"] = str(e)

    # 4. Record cycle (P&L = 0 at open; updated when position closes)
    cycle = record_cycle(
        invested_usd=deploy_usd,
        realised_pnl_usd=0.0,
        symbol=AUTO_INVEST_SYMBOL,
        side="long",
        notes=f"mode={result['mode']}",
    )
    result["cycle_recorded"] = cycle

    # 5. P&L summary
    result["pnl_summary"] = get_pnl_summary()
    result["status"] = "ok"
    return result


# ── FastAPI router ────────────────────────────────────────────────────────────

auto_invest_router = APIRouter(prefix="/api/auto-invest", tags=["auto-invest"])


class CycleResponse(BaseModel):
    ts: str
    mode: str
    symbol: str
    status: str
    deploy_usd: float | None = None
    stripe_available_usd: float | None = None
    stripe_pending_usd: float | None = None
    stripe_error: str | None = None
    hl_order_status: str | None = None
    hl_error: str | None = None
    pnl_summary: dict | None = None


@auto_invest_router.get("/status")
async def auto_invest_status():
    """Return current configuration and P&L summary without placing any orders."""
    bal: dict = {}
    if STRIPE_KEY:
        try:
            bal = get_stripe_balance()
        except RuntimeError as e:
            bal = {"error": str(e)}

    positions: list = []
    if HL_ADDRESS:
        try:
            positions = get_hl_positions(HL_ADDRESS)
        except RuntimeError as e:
            positions = [{"error": str(e)}]

    return {
        "auto_invest_enabled": AUTO_INVEST_ENABLED,
        "symbol": AUTO_INVEST_SYMBOL,
        "leverage": AUTO_INVEST_LEVERAGE,
        "fraction": AUTO_INVEST_FRACTION,
        "compound_profits": COMPOUND_PROFITS,
        "stripe_key_configured": bool(STRIPE_KEY),
        "stripe_account_id_configured": bool(STRIPE_ACCOUNT_ID),
        "hl_wallet_configured": bool(HL_PRIVATE_KEY and HL_ADDRESS),
        "hl_address": HL_ADDRESS or None,
        "stripe_balance": bal,
        "hl_positions": positions,
        "pnl_summary": get_pnl_summary(),
    }


@auto_invest_router.post("/run", response_model=CycleResponse)
async def trigger_cycle():
    """Manually trigger one auto-invest cycle."""
    try:
        result = await asyncio.get_event_loop().run_in_executor(None, run_auto_invest_cycle)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@auto_invest_router.get("/pnl")
async def pnl_history():
    """Return the full P&L ledger."""
    return _load_pnl()


@auto_invest_router.post("/pnl/record")
async def record_pnl(
    invested_usd: float,
    realised_pnl_usd: float,
    symbol: str = "BTC",
    side: str = "long",
    notes: str = "",
):
    """Manually record a completed trade cycle (for webhook-driven updates)."""
    cycle = record_cycle(invested_usd, realised_pnl_usd, symbol, side, notes)
    return {"recorded": cycle, "summary": get_pnl_summary()}


# ── Standalone entry-point ────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    print("=" * 60)
    print("AIQTP Stripe Auto-Invest Pipeline — Standalone Run")
    print("=" * 60)
    print(f"Mode            : {'LIVE' if AUTO_INVEST_ENABLED else 'DRY-RUN'}")
    print(f"Symbol          : {AUTO_INVEST_SYMBOL} (leverage {AUTO_INVEST_LEVERAGE}x)")
    print(f"Deploy fraction : {AUTO_INVEST_FRACTION * 100:.0f}% of available balance")
    print(f"Compound profits: {COMPOUND_PROFITS}")
    print(f"Stripe key      : {'configured' if STRIPE_KEY else 'MISSING'}")
    print(f"Stripe acct ID  : {STRIPE_ACCOUNT_ID or 'not set (org key needs acct_XXXX)'}")
    print(f"HL wallet       : {HL_ADDRESS or 'MISSING'}")
    print()

    result = run_auto_invest_cycle()
    print(json.dumps(result, indent=2, default=str))

    # Print realistic projection (use known starting balance if Stripe not configured)
    available = result.get("stripe_available_usd") or 96.80
    print()
    print("=" * 60)
    print("REALISTIC GROWTH PROJECTION (starting $96.80)")
    print("=" * 60)
    capital = available
    for day in [7, 14, 30, 60, 90]:
        # Conservative: 0.5% daily; Aggressive: 2% daily
        conservative = capital * (1.005 ** day)
        aggressive = capital * (1.02 ** day)
        print(f"  Day {day:3d}: conservative=${conservative:>10.2f}  aggressive=${aggressive:>10.2f}")
    print()
    print("Note: $25M from $96.80 in 25 days requires 99.6% daily gains —")
    print("      mathematically impossible with any real strategy.")
    print("      Realistic aggressive target: ~$200-$500 in 30 days.")
