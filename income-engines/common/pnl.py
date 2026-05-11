"""
Lightweight JSON-lines PnL ledger shared by every engine.

Each engine appends one record per realised event (trade, claim, signal sale,
referral payout). The orchestrator reads the same file to compute combined PnL.
"""

from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any, Dict

from .config import settings

_LOCK = threading.Lock()
LEDGER_PATH: Path = settings.log_dir / "pnl_ledger.jsonl"


def record(engine: str, event: str, usd_pnl: float, **extra: Any) -> None:
    """Append a realised event to the PnL ledger."""
    payload: Dict[str, Any] = {
        "ts": time.time(),
        "engine": engine,
        "event": event,
        "usd_pnl": round(float(usd_pnl), 6),
    }
    payload.update(extra)
    with _LOCK:
        with LEDGER_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, default=str) + "\n")


def summary() -> Dict[str, Any]:
    """Aggregate ledger entries by engine."""
    by_engine: Dict[str, Dict[str, float]] = {}
    total = 0.0
    count = 0
    if not LEDGER_PATH.exists():
        return {"total_usd": 0.0, "events": 0, "by_engine": {}}
    with LEDGER_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            engine = row.get("engine", "unknown")
            pnl = float(row.get("usd_pnl", 0.0))
            bucket = by_engine.setdefault(engine, {"usd_pnl": 0.0, "events": 0})
            bucket["usd_pnl"] += pnl
            bucket["events"] += 1
            total += pnl
            count += 1
    return {
        "total_usd": round(total, 4),
        "events": count,
        "by_engine": {k: {"usd_pnl": round(v["usd_pnl"], 4), "events": int(v["events"])}
                      for k, v in by_engine.items()},
    }
