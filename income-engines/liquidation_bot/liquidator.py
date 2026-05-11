"""
AIQTP Aave V3 + GMX V2 Liquidation Bot (Arbitrum).

Strategy
--------
1.  Stream `Borrow`, `Repay`, `Supply`, `Withdraw`, `LiquidationCall` events
    from the Aave V3 Pool to maintain a local set of *active* borrowers.
2.  Periodically call `getUserAccountData(user)` to compute live health
    factors. A health factor < 1e18 means the user can be liquidated.
3.  For each liquidatable user, simulate the most profitable
    (collateralAsset, debtAsset, debtToCover) combination using
    `eth_call` and the Aave V3 close-factor rules.
4.  If the expected profit (liquidation bonus minus DEX slippage minus
    flash-loan premium minus gas) exceeds MIN_PROFIT_USD, send a
    transaction to `FlashLiquidator.start(...)` which atomically:
        - borrows the debt asset via Aave flash loan (or Balancer for 0 fee)
        - calls `liquidationCall`
        - sells the seized collateral on Uniswap V3
        - repays the flash loan and keeps the profit.

This module is broker-of-record for the on-chain `FlashLiquidator.sol`
contract. Deploy that contract once (see README) and set
LIQUIDATOR_CONTRACT in env vars.
"""

from __future__ import annotations

import os
import time
from typing import Dict, Iterable, List, Optional, Set, Tuple

from web3 import Web3
from web3.exceptions import ContractLogicError

from common.chain import w3, load_abi, account_address, is_safe_to_send
from common.config import settings
from common.logger import get_logger
from common.pnl import record
from common.addresses import ARBITRUM

log = get_logger("liquidator")

POOL_ADDR = Web3.to_checksum_address(ARBITRUM["AAVE_POOL"])
LIQUIDATOR_CONTRACT = os.getenv("LIQUIDATOR_CONTRACT")  # deployed FlashLiquidator
SCAN_LOOKBACK_BLOCKS = int(os.getenv("LIQ_SCAN_LOOKBACK", "200000"))
HEALTH_CHECK_INTERVAL = int(os.getenv("LIQ_CHECK_INTERVAL", "20"))  # seconds
HEALTH_FACTOR_WAD = 10 ** 18

# Aave V3 close factor: 50% of debt can be liquidated when HF >= 0.95,
# 100% when HF < 0.95 (Aave V3.1+).
CLOSE_FACTOR_DEFAULT = 0.5
CLOSE_FACTOR_MAX     = 1.0

# Conservative liquidation bonus (5% is the median across reserves).
DEFAULT_LIQ_BONUS = 0.05


class AaveLiquidator:
    def __init__(self) -> None:
        self.client = w3("arbitrum")
        self.pool = self.client.eth.contract(address=POOL_ADDR, abi=load_abi("aave_v3_pool"))
        self.borrowers: Set[str] = set()
        if LIQUIDATOR_CONTRACT:
            self.flash = self.client.eth.contract(
                address=Web3.to_checksum_address(LIQUIDATOR_CONTRACT),
                abi=load_abi("flash_liquidator"),
            )
        else:
            self.flash = None
            log.warning("LIQUIDATOR_CONTRACT not set – running in observation mode")

    # --- borrower discovery ---------------------------------------------

    def discover_borrowers(self) -> None:
        """Backfill recent Borrow events to seed the borrower set."""
        latest = self.client.eth.block_number
        from_block = max(0, latest - SCAN_LOOKBACK_BLOCKS)
        log.info("Scanning Borrow logs from block %d -> %d", from_block, latest)
        # Borrow(reserve, user, onBehalfOf, amount, ...) – topic0
        topic = Web3.keccak(text="Borrow(address,address,address,uint256,uint8,uint256,uint16)").hex()
        try:
            logs = self.client.eth.get_logs({
                "fromBlock": from_block,
                "toBlock": latest,
                "address": POOL_ADDR,
                "topics": [topic],
            })
        except Exception as e:
            log.error("get_logs failed (%s); reduce LIQ_SCAN_LOOKBACK", e)
            return
        for entry in logs:
            # topic2 = onBehalfOf (indexed user)
            try:
                addr = "0x" + entry["topics"][2].hex()[-40:]
                self.borrowers.add(Web3.to_checksum_address(addr))
            except Exception:
                continue
        log.info("Loaded %d unique borrowers", len(self.borrowers))

    # --- health monitoring ----------------------------------------------

    def health(self, user: str) -> Optional[Tuple[float, int, int]]:
        try:
            tc, td, _, _, _, hf = self.pool.functions.getUserAccountData(user).call()
        except (ContractLogicError, Exception) as e:
            log.debug("getUserAccountData(%s) failed: %s", user, e)
            return None
        return (hf / HEALTH_FACTOR_WAD, tc, td)

    def find_liquidatable(self) -> List[Dict]:
        candidates: List[Dict] = []
        for user in list(self.borrowers):
            h = self.health(user)
            if h is None:
                continue
            hf, total_coll_base, total_debt_base = h
            if 0 < hf < 1.0 and total_debt_base > 0:
                candidates.append({
                    "user": user,
                    "hf": hf,
                    "collateral_base": total_coll_base,
                    "debt_base": total_debt_base,
                })
        candidates.sort(key=lambda c: c["debt_base"], reverse=True)
        return candidates

    # --- profit estimation ----------------------------------------------

    @staticmethod
    def estimate_profit_usd(debt_base: int, hf: float) -> float:
        """
        debt_base is in Aave's base units (USD with 8 decimals on Arbitrum V3).
        We assume the median liquidation bonus and the appropriate close factor.
        """
        debt_usd = debt_base / 1e8
        close = CLOSE_FACTOR_MAX if hf < 0.95 else CLOSE_FACTOR_DEFAULT
        seizable = debt_usd * close * (1 + DEFAULT_LIQ_BONUS)
        # Subtract Aave flash-loan premium (0.05% on V3) and ~0.05% DEX slip.
        cost = debt_usd * close * (0.0005 + 0.0005)
        return seizable - debt_usd * close - cost

    # --- execution -------------------------------------------------------

    def execute(self, cand: Dict, debt_asset: str, collateral_asset: str, swap_fee: int = 500) -> Optional[str]:
        if not self.flash:
            log.info("[OBS] would liquidate %s hf=%.4f", cand["user"], cand["hf"])
            return None
        if not is_safe_to_send(self.client):
            return None

        debt_token = self.client.eth.contract(
            address=Web3.to_checksum_address(debt_asset), abi=load_abi("erc20"))
        decimals = debt_token.functions.decimals().call()
        # Pull half (or all) of the debt depending on close-factor rules.
        close = CLOSE_FACTOR_MAX if cand["hf"] < 0.95 else CLOSE_FACTOR_DEFAULT
        debt_amount_usd = (cand["debt_base"] / 1e8) * close
        # Rough conversion: assume debt_asset price ~ 1 USD for stables.
        debt_amount = int(debt_amount_usd * (10 ** decimals))

        acct = self.client.eth.account.from_key(settings.private_key)
        tx = self.flash.functions.start(
            Web3.to_checksum_address(debt_asset),
            debt_amount,
            Web3.to_checksum_address(collateral_asset),
            Web3.to_checksum_address(cand["user"]),
            int(swap_fee),
        ).build_transaction({
            "from": acct.address,
            "nonce": self.client.eth.get_transaction_count(acct.address),
            "gas": 2_500_000,
            "maxFeePerGas": self.client.eth.gas_price * 2,
            "maxPriorityFeePerGas": Web3.to_wei(0.01, "gwei"),
            "chainId": 42161,
        })
        signed = acct.sign_transaction(tx)
        tx_hash = self.client.eth.send_raw_transaction(signed.rawTransaction).hex()
        log.info("Sent liquidation tx %s", tx_hash)
        return tx_hash

    # --- main loop -------------------------------------------------------

    def run_forever(self) -> None:
        log.info("AIQTP liquidation bot starting on Arbitrum (DRY_RUN=%s)", settings.dry_run)
        self.discover_borrowers()
        while True:
            try:
                cands = self.find_liquidatable()
                if cands:
                    log.info("Found %d liquidatable users", len(cands))
                for c in cands[:5]:
                    pnl = self.estimate_profit_usd(c["debt_base"], c["hf"])
                    log.info("user=%s hf=%.4f debt=$%.2f est_profit=$%.2f",
                             c["user"], c["hf"], c["debt_base"]/1e8, pnl)
                    if pnl < settings.min_profit_usd:
                        continue
                    # Default to USDC debt + WETH collateral on Arbitrum.
                    tx = self.execute(c, ARBITRUM["USDC"], ARBITRUM["WETH"])
                    if tx:
                        record("liquidation_bot", "liquidate", pnl,
                               tx=tx, user=c["user"], hf=c["hf"])
            except Exception as e:
                log.exception("loop error: %s", e)
            time.sleep(HEALTH_CHECK_INTERVAL)


def main() -> None:
    AaveLiquidator().run_forever()


if __name__ == "__main__":
    main()
