"""
$NXVR tokenomics and compute reward distribution for the AIQTP Cognitum swarm.

All monetary amounts are denominated in NXVR unless noted otherwise.
DEX price references use USDT/USDC as the universal price unit.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Any

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tokenomics constants
# ---------------------------------------------------------------------------

NXVR_STAKING_MINIMUM: float = 100.0   # $NXVR required to activate a node
BASE_EPOCH_REWARD: float = 1000.0      # $NXVR minted per epoch across all nodes

# Staking tier boundaries (inclusive lower, exclusive upper)
TIER_1_MIN: float = 100.0
TIER_2_MIN: float = 1_000.0
TIER_3_MIN: float = 10_000.0

TIER_MULTIPLIERS: dict[int, float] = {1: 1.0, 2: 1.5, 3: 2.5}

# Slashing percentages per offense count
SLASH_PERCENTAGES: dict[int, float] = {1: 0.05, 2: 0.25}  # 3rd offense → full exit

# Thresholds that trigger slashing
SLASH_OFFLINE_SECONDS: float = 4 * 3600          # 4 hours offline
SLASH_MIN_VALIDATION_ACCURACY: float = 0.80       # below 80 % accuracy
SLASH_MAX_MEMPOOL_LAG_SECONDS: float = 30.0       # staleness threshold


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class InsufficientStakeError(Exception):
    """Raised when a wallet has not staked enough NXVR to operate a node."""

    def __init__(self, wallet: str, staked: float, required: float) -> None:
        super().__init__(
            f"Wallet {wallet} has {staked:.2f} NXVR staked; "
            f"minimum required is {required:.2f} NXVR."
        )
        self.wallet = wallet
        self.staked = staked
        self.required = required


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

class NodeTier(IntEnum):
    ONE = 1
    TWO = 2
    THREE = 3


def _derive_tier(amount_nxvr: float) -> NodeTier:
    if amount_nxvr >= TIER_3_MIN:
        return NodeTier.THREE
    if amount_nxvr >= TIER_2_MIN:
        return NodeTier.TWO
    return NodeTier.ONE


@dataclass
class NXVRStake:
    """
    Represents a single staking position.

    Tier assignment is derived automatically from *amount_nxvr*:
        Tier 1 — 100–999 NXVR     → 1.0x multiplier
        Tier 2 — 1 000–9 999 NXVR → 1.5x multiplier
        Tier 3 — 10 000+ NXVR     → 2.5x multiplier
    """

    wallet_address: str
    amount_nxvr: float
    staked_at: float = field(default_factory=time.time)
    node_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tier: NodeTier = field(init=False)

    def __post_init__(self) -> None:
        self.tier = _derive_tier(self.amount_nxvr)

    @property
    def tier_multiplier(self) -> float:
        return TIER_MULTIPLIERS[int(self.tier)]


@dataclass
class ComputeRecord:
    """Accumulated compute statistics for a single node within the current epoch."""

    node_id: str
    wallet_address: str
    events_processed: int = 0
    mev_validated: int = 0
    uptime_seconds: float = 0.0
    epoch_start: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    mempool_lag_seconds: float = 0.0
    validation_correct: int = 0
    validation_total: int = 0
    offense_count: int = 0          # cumulative slash offenses
    slashed_nxvr: float = 0.0       # total amount slashed so far

    @property
    def uptime_ratio(self) -> float:
        elapsed = time.time() - self.epoch_start
        if elapsed <= 0:
            return 1.0
        return min(self.uptime_seconds / elapsed, 1.0)

    @property
    def validation_accuracy(self) -> float:
        if self.validation_total == 0:
            return 1.0
        return self.validation_correct / self.validation_total

    @property
    def latency_percentile(self) -> float:
        """Normalised latency score in (0, 1]. Lower lag → higher score."""
        lag = max(self.mempool_lag_seconds, 0.001)
        # Score approaches 1 when lag ≈ 0; degrades logarithmically
        score = 1.0 / (1.0 + lag / 5.0)
        return max(score, 0.001)

    @property
    def quality_score(self) -> float:
        return self.uptime_ratio * self.validation_accuracy * (1.0 / self.latency_percentile)


@dataclass
class SlashEvent:
    """Describes a slashing penalty applied to a node."""

    node_id: str
    wallet_address: str
    offense_count: int
    slash_amount_nxvr: float
    reason: str
    slashed_at: float = field(default_factory=time.time)
    receipt_id: str = field(default_factory=lambda: str(uuid.uuid4()))


# ---------------------------------------------------------------------------
# SlashingEngine
# ---------------------------------------------------------------------------

class SlashingEngine:
    """
    Evaluates slash conditions for a node and emits a SlashEvent when triggered.

    Slash schedule:
        1st offense  →  5 % of staked NXVR
        2nd offense  → 25 % of staked NXVR
        3rd+ offense → full exit (100 % slash, node deregistered)
    """

    def __init__(
        self,
        stakes: dict[str, NXVRStake],
        compute_ledger: dict[str, ComputeRecord],
    ) -> None:
        self._stakes = stakes
        self._ledger = compute_ledger

    def check_slash_conditions(self, node_id: str) -> SlashEvent | None:
        """
        Inspect the node's compute record and return a SlashEvent if any
        slashable condition is met, otherwise return None.
        """
        record = self._ledger.get(node_id)
        if record is None:
            return None

        stake = self._stakes.get(record.wallet_address)
        if stake is None:
            return None

        now = time.time()
        reasons: list[str] = []

        # Condition 1: offline for more than SLASH_OFFLINE_SECONDS
        offline_duration = now - record.last_seen
        if offline_duration > SLASH_OFFLINE_SECONDS:
            reasons.append(
                f"offline for {offline_duration / 3600:.1f}h "
                f"(threshold {SLASH_OFFLINE_SECONDS / 3600:.1f}h)"
            )

        # Condition 2: validation accuracy below minimum
        if (
            record.validation_total > 0
            and record.validation_accuracy < SLASH_MIN_VALIDATION_ACCURACY
        ):
            reasons.append(
                f"validation accuracy {record.validation_accuracy:.2%} "
                f"< {SLASH_MIN_VALIDATION_ACCURACY:.0%}"
            )

        # Condition 3: stale mempool (lag exceeds threshold)
        if record.mempool_lag_seconds > SLASH_MAX_MEMPOOL_LAG_SECONDS:
            reasons.append(
                f"mempool lag {record.mempool_lag_seconds:.1f}s "
                f"> {SLASH_MAX_MEMPOOL_LAG_SECONDS:.1f}s"
            )

        if not reasons:
            return None

        record.offense_count += 1
        offense = record.offense_count

        if offense >= 3:
            slash_amount = stake.amount_nxvr  # full exit
            reason_str = "3rd+ offense — full stake exit. Reasons: " + "; ".join(reasons)
        else:
            pct = SLASH_PERCENTAGES[offense]
            slash_amount = stake.amount_nxvr * pct
            reason_str = (
                f"Offense #{offense} ({pct:.0%} slash). Reasons: " + "; ".join(reasons)
            )

        # Apply slash to stake record
        stake.amount_nxvr = max(stake.amount_nxvr - slash_amount, 0.0)
        stake.tier = _derive_tier(stake.amount_nxvr)
        record.slashed_nxvr += slash_amount

        logger.warning(
            "SlashingEngine: node %s slashed %.2f NXVR — %s",
            node_id,
            slash_amount,
            reason_str,
        )

        return SlashEvent(
            node_id=node_id,
            wallet_address=record.wallet_address,
            offense_count=offense,
            slash_amount_nxvr=slash_amount,
            reason=reason_str,
        )


# ---------------------------------------------------------------------------
# ComputeMiningWorker
# ---------------------------------------------------------------------------

class ComputeMiningWorker:
    """
    Manages node staking, compute contribution accounting, reward calculation,
    and reward distribution for the AIQTP Cognitum swarm.

    In production the stake verification would query an on-chain contract;
    here it operates against an in-memory dict for portability.
    """

    def __init__(self) -> None:
        # wallet_address → NXVRStake
        self.stakes: dict[str, NXVRStake] = {}
        # node_id → ComputeRecord
        self.compute_ledger: dict[str, ComputeRecord] = {}
        self.total_network_compute: int = 0

        # Ed25519 signing key for reward receipts
        self._signing_key: Ed25519PrivateKey = Ed25519PrivateKey.generate()
        self._verify_key: Ed25519PublicKey = self._signing_key.public_key()

        self.slashing_engine = SlashingEngine(self.stakes, self.compute_ledger)

        logger.info(
            "ComputeMiningWorker initialised. Platform public key: %s",
            self._verify_key.public_bytes(Encoding.Raw, PublicFormat.Raw).hex(),
        )

    # ------------------------------------------------------------------
    # Staking
    # ------------------------------------------------------------------

    async def register_stake(self, wallet: str, amount: float, node_id: str | None = None) -> NXVRStake:
        """
        Register (or update) a stake for *wallet*.

        Raises InsufficientStakeError if *amount* < NXVR_STAKING_MINIMUM.
        """
        if amount < NXVR_STAKING_MINIMUM:
            raise InsufficientStakeError(wallet, amount, NXVR_STAKING_MINIMUM)

        stake = NXVRStake(
            wallet_address=wallet,
            amount_nxvr=amount,
            node_id=node_id or str(uuid.uuid4()),
        )
        self.stakes[wallet] = stake
        logger.info(
            "Stake registered: wallet=%s amount=%.2f NXVR tier=%s node_id=%s",
            wallet,
            amount,
            stake.tier.name,
            stake.node_id,
        )
        return stake

    async def verify_stake(self, wallet: str, amount: float) -> bool:
        """
        Verify that *wallet* has at least *amount* NXVR staked.

        Raises InsufficientStakeError when the stake is absent or below *amount*.
        Returns True on success.
        """
        stake = self.stakes.get(wallet)
        staked = stake.amount_nxvr if stake else 0.0

        if staked < amount:
            raise InsufficientStakeError(wallet, staked, amount)

        return True

    # ------------------------------------------------------------------
    # Compute contribution
    # ------------------------------------------------------------------

    async def record_compute_contribution(
        self,
        node_id: str,
        events_processed: int,
        mev_validated: int,
        uptime_delta_seconds: float = 60.0,
        mempool_lag_seconds: float = 0.0,
        validation_correct: int = 0,
        validation_total: int = 0,
    ) -> ComputeRecord:
        """
        Append compute contribution stats for *node_id*.

        Also increments the global total_network_compute counter.
        """
        # Look up wallet from stakes by node_id
        wallet = next(
            (s.wallet_address for s in self.stakes.values() if s.node_id == node_id),
            "",
        )

        if node_id not in self.compute_ledger:
            self.compute_ledger[node_id] = ComputeRecord(
                node_id=node_id,
                wallet_address=wallet,
            )

        record = self.compute_ledger[node_id]
        record.events_processed += events_processed
        record.mev_validated += mev_validated
        record.uptime_seconds += uptime_delta_seconds
        record.last_seen = time.time()
        record.mempool_lag_seconds = mempool_lag_seconds
        record.validation_correct += validation_correct
        record.validation_total += validation_total

        self.total_network_compute += events_processed

        logger.debug(
            "Compute recorded: node=%s events_processed=%d mev_validated=%d",
            node_id,
            record.events_processed,
            record.mev_validated,
        )
        return record

    # ------------------------------------------------------------------
    # Reward calculation
    # ------------------------------------------------------------------

    async def calculate_rewards(
        self, epoch_duration_seconds: int = 3600
    ) -> dict[str, float]:
        """
        Calculate per-wallet NXVR rewards for the current epoch.

        Formula:
            reward = BASE_EPOCH_REWARD
                     * (node_compute / total_compute)
                     * tier_multiplier
                     * quality_score

        Returns a dict mapping wallet_address → nxvr_reward.
        """
        if self.total_network_compute == 0:
            logger.warning("calculate_rewards: total_network_compute is 0 — no rewards.")
            return {}

        # Weighted sum denominator accounts for tier multipliers
        weighted_total = sum(
            record.events_processed * self._tier_multiplier_for_node(record.node_id)
            for record in self.compute_ledger.values()
            if record.events_processed > 0
        )

        if weighted_total == 0:
            return {}

        rewards: dict[str, float] = {}

        for record in self.compute_ledger.values():
            if record.events_processed == 0:
                continue

            multiplier = self._tier_multiplier_for_node(record.node_id)
            node_compute = record.events_processed * multiplier
            share = node_compute / weighted_total

            raw_reward = BASE_EPOCH_REWARD * share * record.quality_score

            wallet = record.wallet_address
            rewards[wallet] = rewards.get(wallet, 0.0) + raw_reward

        logger.info(
            "Epoch rewards calculated for %d wallets; total NXVR distributed: %.4f",
            len(rewards),
            sum(rewards.values()),
        )
        return rewards

    def _tier_multiplier_for_node(self, node_id: str) -> float:
        record = self.compute_ledger.get(node_id)
        if record is None:
            return 1.0
        stake = self.stakes.get(record.wallet_address)
        if stake is None:
            return 1.0
        return stake.tier_multiplier

    # ------------------------------------------------------------------
    # Reward distribution
    # ------------------------------------------------------------------

    async def distribute_rewards(self, rewards: dict[str, float]) -> list[dict[str, Any]]:
        """
        Create signed reward receipts for each wallet in *rewards*.

        Each receipt contains:
            wallet, amount_nxvr, epoch, distributed_at, receipt_id, signature

        The signature is an Ed25519 signature over the canonical JSON payload.
        """
        epoch_ts = int(time.time())
        receipts: list[dict[str, Any]] = []

        for wallet, amount_nxvr in rewards.items():
            receipt_id = str(uuid.uuid4())
            payload: dict[str, Any] = {
                "wallet": wallet,
                "amount_nxvr": round(amount_nxvr, 8),
                "epoch": epoch_ts,
                "distributed_at": time.time(),
                "receipt_id": receipt_id,
            }

            # Deterministic canonical form for signing
            canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
            signature_bytes = self._signing_key.sign(canonical.encode())
            payload["signature"] = signature_bytes.hex()

            receipts.append(payload)
            logger.debug(
                "Reward receipt created: wallet=%s amount_nxvr=%.4f receipt_id=%s",
                wallet,
                amount_nxvr,
                receipt_id,
            )

        logger.info("distribute_rewards: issued %d receipts.", len(receipts))
        return receipts

    # ------------------------------------------------------------------
    # Slash helpers
    # ------------------------------------------------------------------

    async def run_slash_check(self, node_id: str) -> SlashEvent | None:
        """Delegate slash evaluation to the SlashingEngine."""
        return self.slashing_engine.check_slash_conditions(node_id)

    async def run_epoch_slash_sweep(self) -> list[SlashEvent]:
        """Check all registered nodes for slash conditions."""
        events: list[SlashEvent] = []
        for node_id in list(self.compute_ledger.keys()):
            event = await self.run_slash_check(node_id)
            if event is not None:
                events.append(event)
        return events

    # ------------------------------------------------------------------
    # Convenience: full epoch cycle
    # ------------------------------------------------------------------

    async def run_epoch(self, epoch_duration_seconds: int = 3600) -> list[dict[str, Any]]:
        """
        Execute a complete epoch cycle:
            1. Run slash sweep
            2. Calculate rewards
            3. Distribute rewards
            4. Return receipts

        Slashed nodes receive reduced or zero rewards automatically because
        their stake (and therefore tier multiplier) is reduced in-place.
        """
        await self.run_epoch_slash_sweep()
        rewards = await self.calculate_rewards(epoch_duration_seconds)
        receipts = await self.distribute_rewards(rewards)
        # Reset epoch counters
        for record in self.compute_ledger.values():
            record.events_processed = 0
            record.mev_validated = 0
            record.uptime_seconds = 0.0
            record.validation_correct = 0
            record.validation_total = 0
            record.epoch_start = time.time()
        self.total_network_compute = 0
        return receipts
