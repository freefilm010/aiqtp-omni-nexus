"""
Cognitum MemPool Sniper Agent — MEV detection using Engram memory instead of RAG.

Architecture note:
  Traditional RAG pipelines add vector DB latency (typically 20–200 ms per query).
  The sniper replaces this with direct EngramMemory.lookup() — O(1) hash-based
  pattern recall — making it viable for mempool-speed (sub-block) MEV targeting.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from typing import ClassVar

from cognitum.cognitum_nodes import CognitumBaseNode


# ---------------------------------------------------------------------------
# MevOpportunity dataclass
# ---------------------------------------------------------------------------


@dataclass
class MevOpportunity:
    """
    Describes a scored MEV opportunity identified from a pending transaction.

    All monetary values are denominated in USDT/USDC.
    """

    tx_hash: str
    type: str                    # one of MEV_TARGETS
    token_pair: str              # e.g. "ETH/USDT"
    amount_usdt: float
    expected_profit_usdt: float
    gas_cost_usdt: float
    net_pnl_usdt: float
    confidence: float            # 0.0 – 1.0
    timestamp: float = field(default_factory=time.time)

    def as_dict(self) -> dict:
        return {
            "tx_hash": self.tx_hash,
            "type": self.type,
            "token_pair": self.token_pair,
            "amount_usdt": self.amount_usdt,
            "expected_profit_usdt": self.expected_profit_usdt,
            "gas_cost_usdt": self.gas_cost_usdt,
            "net_pnl_usdt": self.net_pnl_usdt,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
        }


# ---------------------------------------------------------------------------
# MemPoolSniperAgent
# ---------------------------------------------------------------------------


class MemPoolSniperAgent:
    """
    Mempool sniper that classifies pending transactions, scores MEV
    opportunities via Engram memory pattern recall, and delegates
    execution to an attached CognitumBaseNode.

    Usage::

        node = CognitumVirtualNode()
        await node.start()
        sniper = MemPoolSniperAgent(node)

        tx = {
            "tx_hash": "0xabc...",
            "method_id": "0x38ed1739",  # swapExactTokensForTokens
            "token_in": "WETH",
            "token_out": "USDC",
            "amount_usdt": 50_000.0,
            "gas_cost_usdt": 8.0,
        }
        opp = await sniper.analyze_pending_tx(tx)
        if opp:
            log = await sniper.execute(opp)
    """

    # MEV opportunity categories the sniper targets
    MEV_TARGETS: ClassVar[list[str]] = [
        "pending_swap",
        "sandwich_window",
        "liquidation_trigger",
        "arbitrage",
    ]

    # Minimum net profit to surface an opportunity
    MIN_PROFIT_USDT: float = 5.0

    # Confidence floor — discard low-confidence scores even if profitable
    MIN_CONFIDENCE: float = 0.1

    # Profit multiplier adjustments based on historical recall quality
    _RECALL_BOOST: float = 1.25   # historical pattern found → boost confidence
    _NO_RECALL_PENALTY: float = 0.80  # no pattern found → penalise confidence

    def __init__(self, node: CognitumBaseNode, min_profit_usdt: float | None = None) -> None:
        if not isinstance(node, CognitumBaseNode):
            raise TypeError(f"node must be a CognitumBaseNode, got {type(node).__name__}")
        self.node = node
        if min_profit_usdt is not None:
            self.MIN_PROFIT_USDT = float(min_profit_usdt)

    # ------------------------------------------------------------------
    # Transaction classification
    # ------------------------------------------------------------------

    @staticmethod
    def _classify_tx(tx: dict) -> str:
        """
        Classify a pending transaction into one of MEV_TARGETS.

        Classification uses a prioritised rule set:
          1. liquidation_trigger — any tx referencing liquidation or health factor
          2. sandwich_window     — large swaps with slippage field
          3. arbitrage           — tx involving multiple pools or "arb" keyword
          4. pending_swap        — default for any DEX swap
          5. unknown             — not a known MEV target
        """
        method_id: str = tx.get("method_id", "")
        # Include both keys and values so field names (e.g. "health_factor",
        # "liquidation_bonus_usdt") are matched as well as their values.
        raw = " ".join(
            f"{k} {v}" for k, v in tx.items()
        ).lower()

        # Liquidation check
        if any(kw in raw for kw in ("liquidat", "health_factor", "collateral_ratio")):
            return "liquidation_trigger"

        # Sandwich check — large swap with slippage tolerance exposed
        if tx.get("slippage_bps") and float(tx.get("amount_usdt", 0)) > 10_000:
            return "sandwich_window"

        # Arbitrage check
        if any(kw in raw for kw in ("arb", "arbitrage", "multi_pool", "flash_loan")):
            return "arbitrage"

        # DEX swap (covers the bulk of mempool traffic)
        # Common swap method IDs (Uniswap v2/v3 families)
        _SWAP_METHODS = {
            "0x38ed1739",  # swapExactTokensForTokens
            "0x7ff36ab5",  # swapExactETHForTokens
            "0x18cbafe5",  # swapExactTokensForETH
            "0x414bf389",  # exactInputSingle (v3)
            "0xc04b8d59",  # exactInput (v3)
        }
        if method_id in _SWAP_METHODS or "swap" in raw:
            return "pending_swap"

        return "unknown"

    # ------------------------------------------------------------------
    # Token pair extraction
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_token_pair(tx: dict) -> str:
        """
        Return a normalised token pair string like "ETH/USDT".
        Falls back to "UNKNOWN/USDT" when pair cannot be determined.
        """
        token_in = tx.get("token_in") or tx.get("tokenIn") or "UNKNOWN"
        token_out = tx.get("token_out") or tx.get("tokenOut") or "USDT"
        return f"{str(token_in).upper()}/{str(token_out).upper()}"

    # ------------------------------------------------------------------
    # MEV scoring
    # ------------------------------------------------------------------

    def _score_opportunity(
        self,
        tx: dict,
        tx_type: str,
        token_pair: str,
        historical: dict | None,
    ) -> tuple[float, float, float]:
        """
        Compute (expected_profit_usdt, gas_cost_usdt, confidence).

        Profit model:
          - Base profit = 0.3% of tx amount (conservative MEV capture estimate)
          - Liquidation and arbitrage events carry an additional fixed bonus
          - Historical pattern recall adjusts confidence (boost or penalty)
          - Gas cost is taken from tx field or defaults to 5.0 USDT
        """
        amount = float(tx.get("amount_usdt", 0.0))
        gas = float(tx.get("gas_cost_usdt", tx.get("gas_usdt", 5.0)))

        # Base profit: 0.3% of notional
        base_profit = amount * 0.003

        # Type-specific bonus
        bonus: float = 0.0
        if tx_type == "liquidation_trigger":
            bonus = float(tx.get("liquidation_bonus_usdt", 50.0))
        elif tx_type == "arbitrage":
            bonus = float(tx.get("arb_spread_usdt", 20.0))
        elif tx_type == "sandwich_window":
            # Sandwich profit is larger — both front-run and back-run legs
            base_profit = amount * 0.006

        expected_profit = base_profit + bonus

        # Confidence — start at 0.6 (moderate prior)
        confidence = 0.6

        # Historical pattern recall adjustment
        if historical is not None:
            # Trust the stored confidence of the matched pattern
            hist_conf = float(historical.get("confidence", 0.5))
            confidence = min(1.0, ((confidence + hist_conf) / 2.0) * self._RECALL_BOOST)
        else:
            confidence *= self._NO_RECALL_PENALTY

        return expected_profit, gas, round(confidence, 4)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze_pending_tx(self, tx: dict) -> MevOpportunity | None:
        """
        Analyse a pending transaction dict and return a scored
        MevOpportunity if it exceeds MIN_PROFIT_USDT, else None.

        The tx dict should contain at minimum:
          tx_hash       : str   — transaction hash
          amount_usdt   : float — notional size in USDT
          gas_cost_usdt : float — estimated gas cost in USDT

        Optional enrichment fields:
          method_id, token_in, token_out, slippage_bps,
          liquidation_bonus_usdt, arb_spread_usdt
        """
        tx_hash: str = tx.get("tx_hash") or uuid.uuid4().hex
        tx_type: str = self._classify_tx(tx)

        # Skip entirely unclassifiable transactions
        if tx_type == "unknown":
            return None

        token_pair: str = self._extract_token_pair(tx)

        # Engram recall — O(1) lookup for historical pattern on this pair+type
        pattern_key = f"mev_{tx_type}_{token_pair}"
        historical: dict | None = self.node.memory.lookup(pattern_key)

        # Score
        expected_profit, gas_cost, confidence = self._score_opportunity(
            tx, tx_type, token_pair, historical
        )
        net_pnl = expected_profit - gas_cost

        if net_pnl < self.MIN_PROFIT_USDT or confidence < self.MIN_CONFIDENCE:
            return None

        # Record this signal in Engram for future recall (reinforcement)
        self.node.memory.store(
            key=pattern_key,
            value={
                "tx_type": tx_type,
                "token_pair": token_pair,
                "last_net_pnl": net_pnl,
                "confidence": confidence,
                "usdt_price_anchor": float(tx.get("amount_usdt", 0.0)),
            },
            tier=2,  # warm tier — patterns are frequently reused
        )

        return MevOpportunity(
            tx_hash=tx_hash,
            type=tx_type,
            token_pair=token_pair,
            amount_usdt=float(tx.get("amount_usdt", 0.0)),
            expected_profit_usdt=round(expected_profit, 4),
            gas_cost_usdt=round(gas_cost, 4),
            net_pnl_usdt=round(net_pnl, 4),
            confidence=confidence,
            timestamp=time.time(),
        )

    async def execute(self, opportunity: MevOpportunity) -> dict:
        """
        Execute a scored MEV opportunity via the attached node.

        Converts the MevOpportunity into a mempool event dict, delegates
        to node.process_mempool_event(), and returns the signed execution
        log (or {} if node rejected the event).
        """
        event: dict = {
            "tx_hash": opportunity.tx_hash,
            "event_type": opportunity.type,
            "symbol": opportunity.token_pair,
            "side": "buy",              # MEV is always from the swarm's buy side
            "amount_usdt": opportunity.amount_usdt,
            "expected_profit_usdt": opportunity.expected_profit_usdt,
            "gas_cost_usdt": opportunity.gas_cost_usdt,
            "usdt_price_anchor": opportunity.amount_usdt,
            "confidence": opportunity.confidence,
            "timestamp": opportunity.timestamp,
        }
        return await self.node.process_mempool_event(event)

    # ------------------------------------------------------------------
    # Context export
    # ------------------------------------------------------------------

    def get_context_block(self) -> str:
        """Return the node's Engram memory formatted as a context block."""
        return self.node.memory.to_context_block()

    def __repr__(self) -> str:
        return (
            f"MemPoolSniperAgent("
            f"node={self.node.node_type}:{self.node.node_id[:8]}, "
            f"min_profit={self.MIN_PROFIT_USDT} USDT)"
        )
