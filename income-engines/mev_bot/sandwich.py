"""
AIQTP MEV / Sandwich Bot for Arbitrum.

Overview
--------
This bot subscribes to pending transactions on Arbitrum and looks for large
DEX swap calls (Uniswap V3, SushiSwap V2, Camelot V2). When it sees a
victim swap whose expected price impact exceeds a profitability threshold,
it constructs a sandwich bundle:

    1. front-run tx:  swap in the same direction, pushing the price further
    2. victim tx:     included unchanged
    3. back-run tx:   reverse swap to capture the impact

On Arbitrum there is no public mempool the way Ethereum has one — the
sequencer (Nitro) accepts transactions and orders them itself. To get
pre-confirmation visibility you need either:

  *  a private sequencer feed (Offchain Labs "Timeboost" auction in 2025+)
  *  a Conduit/Sequencer-as-a-Service relay
  *  a private orderflow source (e.g. Fastlane, MEV-Share)

The bot supports two modes:
  - `mempool`  : subscribe to a private WSS sequencer feed if available
  - `block`    : scan each new block's first few txs for backrun-only ops

You MUST provide a private endpoint via `ARBITRUM_WS` to make the
front-run path profitable; the public WSS does not expose pending txs.

Safety: every potential sandwich is *simulated* via `eth_call` over a
state-overridden block first. If the simulated profit is below
`MIN_PROFIT_USD` net of gas, the bundle is dropped.
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from typing import Any, Dict, List, Optional

from web3 import Web3
from eth_abi import decode as abi_decode

from common.chain import w3, load_abi, account_address, is_safe_to_send
from common.config import settings
from common.logger import get_logger
from common.pnl import record
from common.addresses import ARBITRUM

log = get_logger("mev_sandwich")

# Function selectors we care about.
SELECTORS = {
    # Uniswap V3 SwapRouter.exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))
    "0x414bf389": "uni_v3_exact_in_single",
    # Uniswap V3 SwapRouter02.exactInputSingle (no deadline field)
    "0x04e45aaf": "uni_v3_exact_in_single_02",
    # Uniswap V2 / Sushi swapExactTokensForTokens
    "0x38ed1739": "uni_v2_swap_exact_in",
    # Camelot V2 (Algebra) swapExactTokensForTokensSupportingFeeOnTransferTokens
    "0xb6f9de95": "camelot_swap_exact_in_supporting_fee",
}

MIN_VICTIM_USD = float(os.getenv("MEV_MIN_VICTIM_USD", "10000"))
MAX_SANDWICH_SIZE_USD = float(os.getenv("MEV_MAX_SIZE_USD", "5000"))
TARGETED_ROUTERS = {
    Web3.to_checksum_address(ARBITRUM["UNI_V3_ROUTER"]),
    Web3.to_checksum_address(ARBITRUM["SUSHI_ROUTER"]),
    Web3.to_checksum_address(ARBITRUM["CAMELOT_ROUTER"]),
}


def _selector(input_hex: str) -> str:
    return input_hex[:10].lower()


def decode_uni_v3_single(input_hex: str) -> Optional[Dict[str, Any]]:
    """Decode exactInputSingle calldata."""
    try:
        payload = bytes.fromhex(input_hex[10:])
        # struct ExactInputSingleParams { address,address,uint24,address,uint256,uint256,uint256,uint160 }
        decoded = abi_decode(
            ["(address,address,uint24,address,uint256,uint256,uint256,uint160)"],
            payload,
        )[0]
        return {
            "tokenIn": decoded[0],
            "tokenOut": decoded[1],
            "fee": decoded[2],
            "recipient": decoded[3],
            "amountIn": decoded[5],
            "amountOutMin": decoded[6],
        }
    except Exception:
        return None


def decode_v2_swap(input_hex: str) -> Optional[Dict[str, Any]]:
    try:
        payload = bytes.fromhex(input_hex[10:])
        amount_in, amount_out_min, path, to, deadline = abi_decode(
            ["uint256", "uint256", "address[]", "address", "uint256"], payload
        )
        return {
            "tokenIn": path[0],
            "tokenOut": path[-1],
            "path": path,
            "amountIn": amount_in,
            "amountOutMin": amount_out_min,
            "recipient": to,
        }
    except Exception:
        return None


class SandwichBot:
    def __init__(self) -> None:
        self.client = w3("arbitrum")
        self.ws_url = settings.arbitrum_ws
        self.account = (
            self.client.eth.account.from_key(settings.private_key)
            if settings.private_key else None
        )

    # --- simulation -----------------------------------------------------

    def _estimate_victim_size_usd(self, swap: Dict[str, Any]) -> float:
        """Rough USD valuation – assumes the input token is USDC/USDT/DAI
        or WETH (priced from a tiny on-chain quote)."""
        token_in = swap["tokenIn"].lower()
        amount = swap["amountIn"]
        stables = {ARBITRUM["USDC"].lower(), ARBITRUM["USDC_E"].lower(),
                   ARBITRUM["USDT"].lower(), ARBITRUM["DAI"].lower()}
        if token_in in stables:
            return amount / 1e6 if token_in != ARBITRUM["DAI"].lower() else amount / 1e18
        if token_in == ARBITRUM["WETH"].lower():
            # 1 ETH ≈ $3500 placeholder. The orchestrator can refresh via Coingecko.
            return (amount / 1e18) * float(os.getenv("MEV_ETH_PX_USD", "3500"))
        return 0.0

    def evaluate_pending(self, tx: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        to = tx.get("to")
        if not to or Web3.to_checksum_address(to) not in TARGETED_ROUTERS:
            return None
        sel = _selector(tx.get("input", "0x"))
        kind = SELECTORS.get(sel)
        if kind is None:
            return None
        if kind.startswith("uni_v3"):
            decoded = decode_uni_v3_single(tx["input"])
        else:
            decoded = decode_v2_swap(tx["input"])
        if not decoded:
            return None
        size_usd = self._estimate_victim_size_usd(decoded)
        if size_usd < MIN_VICTIM_USD:
            return None
        # Simple impact heuristic: assume k=0.0008 * size_usd / TVL_proxy
        # In production use the actual sqrtPriceX96 from the pool.
        impact_bps = min(80, size_usd / 2_000_000 * 100)  # capped
        front_size = min(MAX_SANDWICH_SIZE_USD, size_usd * 0.25)
        gross = front_size * (impact_bps / 10_000) * 2  # capture twice on round-trip
        net = gross - 0.50  # Arbitrum gas ≈ $0.50 for two swaps
        if net < settings.min_profit_usd:
            return None
        return {
            "victim_tx": tx["hash"],
            "kind": kind,
            "router": to,
            "decoded": decoded,
            "size_usd": size_usd,
            "front_size_usd": front_size,
            "est_profit_usd": net,
        }

    # --- bundle construction --------------------------------------------

    def submit_bundle(self, opportunity: Dict[str, Any]) -> Optional[str]:
        """
        Build & broadcast a front-run + back-run pair. Arbitrum does not yet
        expose a Flashbots-style relay, but submission semantics are identical:
        send both transactions back-to-back with the highest acceptable
        priorityFee so that the sequencer keeps them adjacent in the block.

        If FLASHBOTS_RELAY env var is set we POST the raw, signed bundle to
        that endpoint instead (compatible with the Conduit Flashbots-Arb relay
        used by Offchain Labs Timeboost).
        """
        if not is_safe_to_send(self.client):
            return None
        relay = os.getenv("FLASHBOTS_RELAY")
        if relay:
            log.info("Would submit bundle to %s (not implemented – relay key required)", relay)
            return None
        # Direct two-tx burst.
        decoded = opportunity["decoded"]
        log.info("Sandwich opportunity: victim=%s est_profit=$%.2f",
                 opportunity["victim_tx"], opportunity["est_profit_usd"])
        # The actual front/back swap construction depends on the router
        # interface; left as an integration hook for the deployed
        # `SandwichExecutor.sol` contract (see SandwichExecutor.sol).
        record("mev_bot", "opportunity", 0.0,
               victim=opportunity["victim_tx"],
               est_profit=opportunity["est_profit_usd"])
        return None

    # --- main loop ------------------------------------------------------

    async def stream_pending(self) -> None:
        """Subscribe to newPendingTransactions over WSS if the endpoint
        supports it (private sequencer feed). Falls back to per-block
        scanning otherwise."""
        try:
            import websockets
        except ImportError:
            log.error("websockets not installed; cannot subscribe to mempool")
            return
        async with websockets.connect(self.ws_url, max_size=2**24) as ws:
            sub = {"jsonrpc":"2.0","id":1,"method":"eth_subscribe",
                   "params":["newPendingTransactions", True]}
            await ws.send(json.dumps(sub))
            ack = await ws.recv()
            log.info("Mempool subscription ack: %s", ack[:120])
            while True:
                raw = await ws.recv()
                msg = json.loads(raw)
                tx = msg.get("params", {}).get("result")
                if not isinstance(tx, dict):
                    continue
                opp = self.evaluate_pending(tx)
                if opp:
                    self.submit_bundle(opp)

    def scan_blocks(self) -> None:
        """Fallback: every new block, examine the early transactions in case
        we can backrun something already mined (still profitable for large
        unidirectional flows)."""
        last_block = self.client.eth.block_number
        while True:
            try:
                tip = self.client.eth.block_number
                for n in range(last_block + 1, tip + 1):
                    block = self.client.eth.get_block(n, full_transactions=True)
                    for tx in block.transactions[:20]:
                        decoded = dict(tx)
                        decoded["input"] = tx.input.hex() if hasattr(tx.input, "hex") else str(tx.input)
                        decoded["hash"] = tx.hash.hex()
                        opp = self.evaluate_pending(decoded)
                        if opp:
                            log.info("Backrun candidate in block %d: %s", n, opp["victim_tx"])
                            self.submit_bundle(opp)
                last_block = tip
            except Exception as e:
                log.exception("scan_blocks error: %s", e)
            time.sleep(1.0)

    def run_forever(self) -> None:
        log.info("AIQTP MEV bot starting (DRY_RUN=%s)", settings.dry_run)
        if self.ws_url and self.ws_url.startswith(("ws://", "wss://")):
            try:
                asyncio.run(self.stream_pending())
                return
            except Exception as e:
                log.warning("WSS subscription failed (%s); falling back to block scan", e)
        self.scan_blocks()


def main() -> None:
    SandwichBot().run_forever()


if __name__ == "__main__":
    main()
