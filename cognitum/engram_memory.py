"""
Cognitum Engram Memory — Amnesia-free O(1) hash-based memory module.

Three-tier storage:
  L1: hot ring  (deque, cap 50)  — last-accessed / promoted items
  L2: warm ring (deque, cap 1000) — recently stored items
  L3: cold dict (unbounded)       — persistent baseline store

Hashing uses multiplicative XOR with Fibonacci prime 0x9e3779b9, XOR-folded
to a 32-bit key for compact dict addressing.
"""

from __future__ import annotations

import re
import time
from collections import deque
from typing import Any


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_FIB_PRIME: int = 0x9E3779B9  # 2^32 / φ  (Knuth multiplicative hashing)
_MASK32: int = 0xFFFF_FFFF


def _engram_hash(key: str) -> int:
    """
    Multiplicative XOR hash → 32-bit key.
    Each byte is XOR-folded with the running accumulator then multiplied by
    the Fibonacci prime, keeping results within 32 bits.
    """
    h: int = 0
    for byte in key.encode("utf-8"):
        h = ((h ^ byte) * _FIB_PRIME) & _MASK32
    # Final XOR-fold: upper 16 bits ⊕ lower 16 bits
    return (h ^ (h >> 16)) & _MASK32


def _token_set(text: str) -> set[str]:
    """Split text into lowercase alpha-numeric tokens (no stop-words)."""
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _cosine_approx(a: str, b: str) -> float:
    """
    Approximate cosine similarity via shared token count.
    sim = |A ∩ B| / sqrt(|A| * |B|)  — Jaccard-like but cosine-normalised.
    Returns 0.0 when either set is empty.
    """
    sa = _token_set(a)
    sb = _token_set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / (len(sa) * len(sb)) ** 0.5


# ---------------------------------------------------------------------------
# EngramMemory
# ---------------------------------------------------------------------------


class EngramMemory:
    """
    Amnesia-free three-tier engram store.

    Tier  Container       Capacity   Lookup cost
    ----  ---------       --------   -----------
    L1    deque           50         O(n) scan (hot, tiny)
    L2    deque           1000       O(n) scan (warm, bounded)
    L3    dict (keyed)    unlimited  O(1) hash lookup (persistent)
    """

    L1_CAP: int = 50
    L2_CAP: int = 1000

    def __init__(self) -> None:
        self._l1: deque[dict] = deque(maxlen=self.L1_CAP)
        self._l2: deque[dict] = deque(maxlen=self.L2_CAP)
        self._l3: dict[int, dict] = {}          # hash-key → engram record
        self._key_index: dict[str, int] = {}    # raw key  → hash-key (for named lookup)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def store(self, key: str, value: dict, tier: int = 1) -> None:
        """
        Store *value* under *key* in the requested tier (1=L1, 2=L2, 3=L3).
        Every record is also written to L3 for persistence regardless of tier.

        Automatically injects:
          - timestamp      (float, Unix epoch)
          - confidence     (float, default 1.0 if absent)
          - usdt_price_anchor (float, default 0.0 — required for trade facts)
        """
        hk = _engram_hash(key)
        record: dict[str, Any] = {
            **value,
            "_key": key,
            "_hash": hk,
            "timestamp": value.get("timestamp", time.time()),
            "confidence": float(value.get("confidence", 1.0)),
            "usdt_price_anchor": float(value.get("usdt_price_anchor", 0.0)),
        }

        # Persist to L3 always
        self._l3[hk] = record
        self._key_index[key] = hk

        # Place in requested tier's hot ring
        if tier == 1:
            self._l1.append(record)
        elif tier == 2:
            self._l2.append(record)
        # tier==3 stays only in L3

    def lookup(self, key: str) -> dict | None:
        """
        O(1) primary lookup via L3 hash, with L2→L1 fallback scan.
        Returns the matching engram record or None.
        """
        hk = self._key_index.get(key)
        if hk is not None:
            record = self._l3.get(hk)
            if record is not None:
                return record

        # Fallback: linear scan of warm then hot tiers
        for record in self._l2:
            if record.get("_key") == key:
                return record
        for record in self._l1:
            if record.get("_key") == key:
                return record

        return None

    def gate(self, context: str, threshold: float = 0.7) -> list[dict]:
        """
        Context-aware memory gating.

        Scores every engram in L3 by approximate cosine similarity between
        *context* and the engram's stored key + serialised value tokens.
        Returns engrams with relevance >= threshold, sorted by relevance desc.
        """
        results: list[tuple[float, dict]] = []
        for record in self._l3.values():
            candidate_text = record.get("_key", "") + " " + " ".join(
                str(v) for v in record.values() if isinstance(v, str)
            )
            score = _cosine_approx(context, candidate_text)
            # Multiply by confidence to weight high-quality memories
            weighted = score * record.get("confidence", 1.0)
            if weighted >= threshold:
                results.append((weighted, record))

        results.sort(key=lambda t: t[0], reverse=True)
        return [r for _, r in results]

    def promote(self, key: str) -> bool:
        """
        Heat-based promotion: L3 → L2 → L1.
        Calling promote() repeatedly pushes a memory toward the hottest tier.
        Returns True if the key was found and promoted.
        """
        record = self.lookup(key)
        if record is None:
            return False

        # Determine current hottest tier the record lives in
        in_l1 = any(r.get("_key") == key for r in self._l1)
        in_l2 = any(r.get("_key") == key for r in self._l2)

        if in_l1:
            # Already hottest — refresh position by moving to end
            self._l1.remove(record)
            self._l1.append(record)
        elif in_l2:
            # Promote: L2 → L1
            self._l2.remove(record)
            self._l1.append(record)
        else:
            # Promote: L3 → L2
            self._l2.append(record)

        return True

    def to_context_block(self) -> str:
        """
        Format the top-10 most recently stored (L3) engrams as a compact
        string suitable for injection into an agent's context window.

        Format (one line per engram):
          [<key>] conf=<0.00> usdt=<0.00> | <value summary>
        """
        # Sort L3 by timestamp descending, take top 10
        sorted_records = sorted(
            self._l3.values(),
            key=lambda r: r.get("timestamp", 0.0),
            reverse=True,
        )[:10]

        lines: list[str] = ["=== ENGRAM CONTEXT BLOCK ==="]
        for rec in sorted_records:
            key = rec.get("_key", "?")
            conf = rec.get("confidence", 0.0)
            usdt = rec.get("usdt_price_anchor", 0.0)
            # Build a short value summary excluding internal fields
            summary_parts = [
                f"{k}={v}"
                for k, v in rec.items()
                if not k.startswith("_")
                and k not in ("confidence", "usdt_price_anchor", "timestamp")
            ]
            summary = " ".join(summary_parts[:5])  # cap at 5 fields
            lines.append(f"[{key}] conf={conf:.2f} usdt={usdt:.2f} | {summary}")

        lines.append("=== END ENGRAM BLOCK ===")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Dunder helpers
    # ------------------------------------------------------------------

    def __len__(self) -> int:
        return len(self._l3)

    def __repr__(self) -> str:
        return (
            f"EngramMemory(l1={len(self._l1)}, l2={len(self._l2)}, "
            f"l3={len(self._l3)})"
        )
