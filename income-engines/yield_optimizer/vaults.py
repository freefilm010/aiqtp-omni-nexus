"""
Per-protocol deposit/withdraw/claim adapters.

Each adapter must implement:
    deposit(amount_usd: float) -> str | None   # tx hash or None
    withdraw(amount_usd: float) -> str | None
    claim() -> str | None
    pending_rewards_usd() -> float

This module is intentionally a scaffold — real adapters require ABIs and
contract addresses for each pool. The optimizer can run advisory-only
without implementing these.
"""

from __future__ import annotations

from typing import Optional, Protocol

from common.logger import get_logger
from common.config import settings

log = get_logger("vaults")


class VaultAdapter(Protocol):
    name: str
    def deposit(self, amount_usd: float) -> Optional[str]: ...
    def withdraw(self, amount_usd: float) -> Optional[str]: ...
    def claim(self) -> Optional[str]: ...
    def pending_rewards_usd(self) -> float: ...


class _Base:
    name = "base"
    def _guard(self) -> bool:
        if settings.dry_run:
            log.info("[%s] DRY_RUN; suppressing tx", self.name)
            return False
        if not settings.private_key:
            log.error("[%s] PRIVATE_KEY missing", self.name)
            return False
        return True


class AaveV3USDC(_Base):
    """Supply USDC to Aave V3 Arbitrum and earn aArbUSDC."""
    name = "aave-v3-usdc"
    def deposit(self, amount_usd: float) -> Optional[str]:
        if not self._guard(): return None
        log.info("[aave] supply %.2f USDC – wire up Pool.supply()", amount_usd)
        return None
    def withdraw(self, amount_usd: float) -> Optional[str]:
        if not self._guard(): return None
        return None
    def claim(self) -> Optional[str]:
        return None
    def pending_rewards_usd(self) -> float:
        return 0.0


class PendlePT(_Base):
    """Buy Pendle PT for fixed-rate USDC yield."""
    name = "pendle-pt"
    def deposit(self, amount_usd: float) -> Optional[str]:
        if not self._guard(): return None
        log.info("[pendle] buy PT for %.2f USD – wire up PendleRouterV4", amount_usd)
        return None
    def withdraw(self, amount_usd: float) -> Optional[str]:
        if not self._guard(): return None
        return None
    def claim(self) -> Optional[str]:
        return None
    def pending_rewards_usd(self) -> float:
        return 0.0


REGISTRY = {
    "aave-v3-usdc": AaveV3USDC(),
    "pendle-pt": PendlePT(),
}
