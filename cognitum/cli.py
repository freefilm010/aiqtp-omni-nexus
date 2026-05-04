"""
Cognitum CLI — lightweight e-ware client for hardware and virtual swarm nodes.

Usage:
    cognitum start [--hardware] [--virtual]
    cognitum stake <amount> --wallet <address>
    cognitum status
    cognitum earnings
    cognitum stop

Config file: ~/.cognitum/config.json
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import pathlib
import signal
import sys
import time
import uuid
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cognitum.cli")

# ---------------------------------------------------------------------------
# Paths and defaults
# ---------------------------------------------------------------------------

CONFIG_DIR = pathlib.Path.home() / ".cognitum"
CONFIG_FILE = CONFIG_DIR / "config.json"
STATE_FILE = CONFIG_DIR / "state.json"
PID_FILE = CONFIG_DIR / "node.pid"

DEFAULT_CONFIG: dict[str, Any] = {
    "node_id": str(uuid.uuid4()),
    "node_type": "virtual",
    "wallet_address": "",
    "staked_nxvr": 0.0,
    "tier": 0,
    "api_base_url": "https://aiqtp-trading-service.onrender.com",
    "quantum_url": "https://aiqtp-quantum-agent.onrender.com",
    "log_level": "INFO",
}

# ---------------------------------------------------------------------------
# ASCII banner
# ---------------------------------------------------------------------------

BANNER = r"""
  ____            _ _
 / ___|___   __ _| (_)_ __ _   _ _ __ ___
| |   / _ \ / _` | | | '__| | | | '_ ` _ \
| |__| (_) | (_| | | | |  | |_| | | | | | |
 \____\___/ \__, |_|_|_|   \__,_|_| |_| |_|
  NEXAVIR    |___/  Swarm Node  v0.1.0-swarm
"""


# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------

def _load_config() -> dict[str, Any]:
    """Load config from ~/.cognitum/config.json, creating defaults if absent."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if CONFIG_FILE.exists():
        try:
            with CONFIG_FILE.open() as fh:
                data = json.load(fh)
            # Merge with defaults so new keys are always present
            merged = {**DEFAULT_CONFIG, **data}
            return merged
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Could not read config (%s); using defaults.", exc)
    return dict(DEFAULT_CONFIG)


def _save_config(cfg: dict[str, Any]) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with CONFIG_FILE.open("w") as fh:
        json.dump(cfg, fh, indent=2)


def _load_state() -> dict[str, Any]:
    if STATE_FILE.exists():
        try:
            with STATE_FILE.open() as fh:
                return json.load(fh)
        except (json.JSONDecodeError, OSError):
            pass
    return {
        "start_time": None,
        "events_processed": 0,
        "mev_opportunities_found": 0,
        "estimated_nxvr_earned": 0.0,
        "epoch_earnings": [],
    }


def _save_state(state: dict[str, Any]) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with STATE_FILE.open("w") as fh:
        json.dump(state, fh, indent=2)


def _derive_tier(amount: float) -> int:
    if amount >= 10_000:
        return 3
    if amount >= 1_000:
        return 2
    if amount >= 100:
        return 1
    return 0


def _tier_label(tier: int) -> str:
    return {0: "Inactive", 1: "Tier 1 (1.0x)", 2: "Tier 2 (1.5x)", 3: "Tier 3 (2.5x)"}.get(
        tier, "Unknown"
    )


def _fingerprint(node_id: str) -> str:
    """Return a short public-key fingerprint derived from node_id."""
    import hashlib

    digest = hashlib.sha256(node_id.encode()).hexdigest()
    return ":".join(digest[i : i + 4] for i in range(0, 20, 4))


def _uptime_str(start_ts: float | None) -> str:
    if start_ts is None:
        return "not running"
    elapsed = time.time() - start_ts
    hours, rem = divmod(int(elapsed), 3600)
    minutes, seconds = divmod(rem, 60)
    return f"{hours:02d}h {minutes:02d}m {seconds:02d}s"


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

def cmd_start(args: argparse.Namespace) -> int:
    """Start the Cognitum node (hardware or virtual)."""
    cfg = _load_config()
    state = _load_state()

    # Determine node type from flags; default to virtual
    if args.hardware:
        node_type = "hardware"
    elif args.virtual:
        node_type = "virtual"
    else:
        node_type = cfg.get("node_type", "virtual")

    cfg["node_type"] = node_type
    _save_config(cfg)

    node_id = cfg["node_id"]

    print(BANNER)
    print(f"  Node ID       : {node_id}")
    print(f"  Node Type     : {node_type.upper()}")
    print(f"  Pub-Key Fingerprint : {_fingerprint(node_id)}")
    print(f"  Wallet        : {cfg.get('wallet_address') or '(not set)'}")
    print(f"  Staked NXVR   : {cfg.get('staked_nxvr', 0.0):.2f}")
    print(f"  Tier          : {_tier_label(cfg.get('tier', 0))}")
    print()

    if cfg.get("staked_nxvr", 0.0) < 100.0:
        print(
            "  WARNING: Node requires a minimum stake of 100 NXVR.\n"
            "  Run: cognitum stake <amount> --wallet <address>\n"
        )

    # Write PID and start timestamp
    PID_FILE.write_text(str(os.getpid()))
    state["start_time"] = time.time()
    _save_state(state)

    print(f"  Cognitum {node_type} node started (PID {os.getpid()}).")
    print("  Press Ctrl+C to stop.\n")

    # Keep running until interrupted
    def _handle_sigterm(signum: int, frame: Any) -> None:
        print("\n  SIGTERM received — shutting down …")
        _do_stop()
        sys.exit(0)

    signal.signal(signal.SIGTERM, _handle_sigterm)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n  KeyboardInterrupt — stopping node …")
        _do_stop()

    return 0


def cmd_stake(args: argparse.Namespace) -> int:
    """Register a staking position."""
    amount: float = args.amount
    wallet: str = args.wallet

    if amount < 100.0:
        print(
            f"ERROR: Minimum stake is 100 NXVR. You specified {amount:.2f} NXVR."
        )
        return 1

    cfg = _load_config()
    cfg["wallet_address"] = wallet
    cfg["staked_nxvr"] = amount
    cfg["tier"] = _derive_tier(amount)
    _save_config(cfg)

    tier = _derive_tier(amount)
    print(f"\n  Stake registered successfully.")
    print(f"  Wallet  : {wallet}")
    print(f"  Amount  : {amount:.2f} NXVR")
    print(f"  Tier    : {_tier_label(tier)}")
    print(
        f"\n  NOTE: In production this would submit a transaction to the NXVR staking\n"
        f"  contract. Currently stored in local config only.\n"
    )
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    """Print current node health and compute statistics."""
    cfg = _load_config()
    state = _load_state()

    running = PID_FILE.exists()
    pid = PID_FILE.read_text().strip() if running else "—"

    print("\n  ── Cognitum Node Status ──────────────────────────────")
    print(f"  Running             : {'YES (PID ' + pid + ')' if running else 'NO'}")
    print(f"  Uptime              : {_uptime_str(state.get('start_time'))}")
    print(f"  Node ID             : {cfg['node_id']}")
    print(f"  Node Type           : {cfg.get('node_type', 'virtual').upper()}")
    print(f"  Wallet              : {cfg.get('wallet_address') or '(not set)'}")
    print(f"  Staked NXVR         : {cfg.get('staked_nxvr', 0.0):.2f}")
    print(f"  Tier                : {_tier_label(cfg.get('tier', 0))}")
    print(f"  Events Processed    : {state.get('events_processed', 0):,}")
    print(f"  MEV Opportunities   : {state.get('mev_opportunities_found', 0):,}")
    print(f"  Est. NXVR Earned    : {state.get('estimated_nxvr_earned', 0.0):.4f}")
    print("  ──────────────────────────────────────────────────────\n")
    return 0


def cmd_earnings(args: argparse.Namespace) -> int:
    """Display NXVR earnings breakdown per epoch."""
    cfg = _load_config()
    state = _load_state()
    epoch_earnings: list[dict[str, Any]] = state.get("epoch_earnings", [])

    print("\n  ── NXVR Earnings Breakdown ───────────────────────────")
    print(f"  Wallet : {cfg.get('wallet_address') or '(not set)'}")
    print(f"  Tier   : {_tier_label(cfg.get('tier', 0))}")
    print()

    if not epoch_earnings:
        print("  No epoch earnings recorded yet.\n")
        print("  Earnings are credited at the end of each 1-hour epoch.\n")
    else:
        print(f"  {'Epoch':<10}  {'NXVR Earned':>14}  {'Quality Score':>14}  {'Events':>10}")
        print("  " + "-" * 56)
        total = 0.0
        for entry in epoch_earnings[-20:]:  # show last 20 epochs
            total += entry.get("nxvr_earned", 0.0)
            print(
                f"  {entry.get('epoch', '?'):<10}  "
                f"{entry.get('nxvr_earned', 0.0):>14.4f}  "
                f"{entry.get('quality_score', 0.0):>14.4f}  "
                f"{entry.get('events_processed', 0):>10,}"
            )
        print("  " + "-" * 56)
        print(f"  {'TOTAL':<10}  {total:>14.4f}")

    print(
        f"\n  Estimated cumulative NXVR earned: "
        f"{state.get('estimated_nxvr_earned', 0.0):.4f}\n"
    )
    return 0


def _do_stop() -> None:
    state = _load_state()
    state["start_time"] = None
    _save_state(state)
    if PID_FILE.exists():
        PID_FILE.unlink(missing_ok=True)
    print("  Node stopped. State saved.")


def cmd_stop(args: argparse.Namespace) -> int:
    """Gracefully stop the running Cognitum node."""
    if not PID_FILE.exists():
        print("  No running node found (PID file absent).")
        return 0

    pid_str = PID_FILE.read_text().strip()
    try:
        pid = int(pid_str)
        os.kill(pid, signal.SIGTERM)
        print(f"  SIGTERM sent to PID {pid}.")
    except (ValueError, ProcessLookupError):
        print(f"  PID {pid_str} not found — cleaning up state file.")
    finally:
        _do_stop()

    return 0


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cognitum",
        description="AIQTP Cognitum swarm node CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command", metavar="<command>")

    # start
    p_start = sub.add_parser("start", help="Start the Cognitum node")
    p_start.add_argument(
        "--hardware",
        action="store_true",
        help="Run as a hardware e-ware node (eSIM enabled)",
    )
    p_start.add_argument(
        "--virtual",
        action="store_true",
        help="Run as a virtual software node (default)",
    )

    # stake
    p_stake = sub.add_parser("stake", help="Register an NXVR stake for this node")
    p_stake.add_argument("amount", type=float, help="Amount of NXVR to stake (min 100)")
    p_stake.add_argument(
        "--wallet",
        required=True,
        metavar="<address>",
        help="Wallet address (EVM hex)",
    )

    # status
    sub.add_parser("status", help="Show node health, compute units, pending rewards")

    # earnings
    sub.add_parser("earnings", help="Show NXVR earnings breakdown per epoch")

    # stop
    sub.add_parser("stop", help="Gracefully stop the running node")

    return parser


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

COMMAND_MAP = {
    "start": cmd_start,
    "stake": cmd_stake,
    "status": cmd_status,
    "earnings": cmd_earnings,
    "stop": cmd_stop,
}


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command is None:
        parser.print_help()
        return 0

    handler = COMMAND_MAP.get(args.command)
    if handler is None:
        parser.print_help()
        return 1

    return handler(args)


if __name__ == "__main__":
    sys.exit(main())
