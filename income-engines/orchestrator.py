"""
AIQTP Income-Engine Orchestrator.

Runs every engine simultaneously in its own thread, prints a combined PnL
dashboard every 60 seconds, and exposes a small FastAPI status endpoint
on port 8089 for the AIQTP dashboard to scrape.

Usage:
    python orchestrator.py
    python orchestrator.py --only yield_optimizer arbitrage
    python orchestrator.py --once    # one-shot, useful in CI
"""

from __future__ import annotations

import argparse
import signal
import sys
import threading
import time
from typing import Callable, Dict, List

from common.config import settings
from common.logger import get_logger
from common.pnl import summary

log = get_logger("orchestrator")

# Lazy imports so a missing dep in one engine does not break the rest.
ENGINES: Dict[str, Callable[[], None]] = {}


def _register(name: str, importer: Callable[[], Callable[[], None]]) -> None:
    try:
        ENGINES[name] = importer()
    except Exception as e:
        log.error("Could not load engine %s: %s", name, e)


_register("mev_bot",            lambda: __import__("mev_bot.sandwich", fromlist=["main"]).main)
_register("liquidation_bot",    lambda: __import__("liquidation_bot.liquidator", fromlist=["main"]).main)
_register("yield_optimizer",    lambda: __import__("yield_optimizer.optimizer", fromlist=["main"]).main)
_register("arbitrage",          lambda: __import__("arbitrage.scanner", fromlist=["main"]).main)
_register("signal_service",     lambda: __import__("signal_service.bot", fromlist=["main"]).main)
_register("airdrop_farmer",     lambda: __import__("airdrop_farmer.farmer", fromlist=["main"]).main)
_register("referral_automation",lambda: __import__("referral_automation.affiliates", fromlist=["run_forever"]).run_forever)


_stop = threading.Event()


def _runner(name: str, fn: Callable[[], None]) -> None:
    log.info("Starting engine: %s", name)
    try:
        fn()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        log.exception("Engine %s crashed: %s", name, e)


def print_dashboard() -> None:
    s = summary()
    line = "+---------------------- AIQTP COMBINED P&L ----------------------+"
    log.info(line)
    log.info("Total: $%.4f over %d events | DRY_RUN=%s", s["total_usd"], s["events"], settings.dry_run)
    for engine, stats in sorted(s["by_engine"].items(), key=lambda kv: -kv[1]["usd_pnl"]):
        log.info("  %-22s %8.4f USD  (%d events)", engine, stats["usd_pnl"], stats["events"])
    log.info("+" + "-" * (len(line) - 2) + "+")


def start_status_server() -> None:
    try:
        from fastapi import FastAPI
        import uvicorn
    except ImportError:
        log.info("FastAPI not installed; skipping status server")
        return
    app = FastAPI(title="AIQTP Orchestrator")

    @app.get("/status")
    def status():
        return {"engines": list(ENGINES.keys()),
                "pnl": summary(),
                "dry_run": settings.dry_run}

    def _run():
        uvicorn.run(app, host="0.0.0.0", port=8089, log_level="warning")
    threading.Thread(target=_run, daemon=True, name="status-http").start()
    log.info("Status server on http://0.0.0.0:8089/status")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="Run only the listed engines")
    ap.add_argument("--once", action="store_true", help="Print the dashboard once and exit")
    args = ap.parse_args()

    if args.once:
        print_dashboard()
        return

    targets = {k: v for k, v in ENGINES.items() if not args.only or k in args.only}
    if not targets:
        log.error("No engines matched %s", args.only)
        sys.exit(1)

    start_status_server()

    threads: List[threading.Thread] = []
    for name, fn in targets.items():
        t = threading.Thread(target=_runner, args=(name, fn), daemon=True, name=name)
        t.start()
        threads.append(t)

    def _on_signal(signum, frame):
        log.info("Signal %s received, shutting down", signum)
        _stop.set()
    signal.signal(signal.SIGINT, _on_signal)
    signal.signal(signal.SIGTERM, _on_signal)

    log.info("AIQTP orchestrator running %d engines: %s",
             len(threads), ", ".join(targets.keys()))
    try:
        while not _stop.is_set():
            time.sleep(60)
            print_dashboard()
    except KeyboardInterrupt:
        pass
    log.info("Orchestrator exiting.")


if __name__ == "__main__":
    main()
