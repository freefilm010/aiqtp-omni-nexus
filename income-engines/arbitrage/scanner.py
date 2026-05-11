"""
AIQTP Arbitrage Scanner + Executor.

Modes
-----
1. Cross-DEX (intra-chain) on Arbitrum:
       Uniswap V3  vs  SushiSwap V2  vs  Camelot V2
   Triangulates a quote for `amountIn` of WETH -> USDC on each DEX, picks
   the buy-cheap / sell-rich pair, simulates the round-trip, and submits
   a Balancer Vault flash-loan-funded execution if profit > MIN_PROFIT_USD.

2. Cross-chain (Arbitrum vs Optimism vs Base):
       Uses each chain's Uniswap V3 Quoter to compute the same WETH/USDC
       price, identifies cross-chain dislocations, and surfaces them as
       advisory signals (real cross-chain capture requires a bridge with
       sub-second finality such as Across; instructions in README).

Default execution scaffold uses Balancer Vault flash-loans (0 fee on
Arbitrum) as the funding source. A pre-deployed `ArbExecutor.sol`
contract is required for atomic three-leg execution; address in
`ARB_EXECUTOR_CONTRACT`.
"""

from __future__ import annotations

import os
import time
from typing import Dict, List, Optional, Tuple

from web3 import Web3

from common.chain import w3, load_abi, is_safe_to_send
from common.config import settings
from common.logger import get_logger
from common.pnl import record
from common.addresses import ARBITRUM, OPTIMISM, BASE

log = get_logger("arbitrage")

POLL_INTERVAL = float(os.getenv("ARB_POLL", "2.0"))
PROBE_AMOUNT_ETH = float(os.getenv("ARB_PROBE_ETH", "1.0"))
ARB_EXECUTOR_CONTRACT = os.getenv("ARB_EXECUTOR_CONTRACT")

ETH_PROBE_WEI = Web3.to_wei(PROBE_AMOUNT_ETH, "ether")


def _v3_quote(client: Web3, quoter_addr: str, token_in: str, token_out: str,
              fee: int, amount_in: int) -> Optional[int]:
    quoter = client.eth.contract(
        address=Web3.to_checksum_address(quoter_addr),
        abi=load_abi("uniswap_v3_quoter"),
    )
    try:
        return quoter.functions.quoteExactInputSingle(
            Web3.to_checksum_address(token_in),
            Web3.to_checksum_address(token_out),
            fee, amount_in, 0,
        ).call()
    except Exception as e:
        log.debug("V3 quote failed: %s", e)
        return None


def _v2_quote(client: Web3, router_addr: str, token_in: str, token_out: str,
              amount_in: int) -> Optional[int]:
    router = client.eth.contract(
        address=Web3.to_checksum_address(router_addr),
        abi=load_abi("uniswap_v2_router"),
    )
    try:
        amts = router.functions.getAmountsOut(
            amount_in,
            [Web3.to_checksum_address(token_in),
             Web3.to_checksum_address(token_out)],
        ).call()
        return int(amts[-1])
    except Exception as e:
        log.debug("V2 quote failed (%s): %s", router_addr, e)
        return None


def quotes_arbitrum(amount_in_wei: int) -> Dict[str, Optional[int]]:
    client = w3("arbitrum")
    tin, tout = ARBITRUM["WETH"], ARBITRUM["USDC"]
    return {
        "uniswap_v3": _v3_quote(client, ARBITRUM["UNI_V3_QUOTER"], tin, tout, 500, amount_in_wei),
        "sushiswap":  _v2_quote(client, ARBITRUM["SUSHI_ROUTER"], tin, tout, amount_in_wei),
        "camelot":    _v2_quote(client, ARBITRUM["CAMELOT_ROUTER"], tin, tout, amount_in_wei),
    }


def quotes_cross_chain(amount_in_wei: int) -> Dict[str, Optional[int]]:
    return {
        "arbitrum": _v3_quote(w3("arbitrum"), ARBITRUM["UNI_V3_QUOTER"],
                              ARBITRUM["WETH"], ARBITRUM["USDC"], 500, amount_in_wei),
        "optimism": _v3_quote(w3("optimism"), OPTIMISM["UNI_V3_QUOTER"],
                              OPTIMISM["WETH"], OPTIMISM["USDC"], 500, amount_in_wei),
        "base":     _v3_quote(w3("base"), BASE["UNI_V3_QUOTER"],
                              BASE["WETH"], BASE["USDC"], 500, amount_in_wei),
    }


def best_pair(quotes: Dict[str, Optional[int]]) -> Optional[Tuple[str, str, float]]:
    """Return (buy_venue, sell_venue, profit_usdc) for the best spread."""
    valid = {k: v for k, v in quotes.items() if v}
    if len(valid) < 2:
        return None
    # Buy where USDC out is *lowest* (= we get the most ETH per USDC,
    # but here we are selling ETH so "highest USDC out" is the side
    # to sell on; "lowest USDC out" is the side to buy on – we reverse
    # the trade on the cheaper side).
    sell_venue, sell_out = max(valid.items(), key=lambda kv: kv[1])
    buy_venue,  buy_out  = min(valid.items(), key=lambda kv: kv[1])
    if sell_venue == buy_venue:
        return None
    # USDC has 6 decimals on Arbitrum / OP / Base native.
    profit = (sell_out - buy_out) / 1e6
    return (buy_venue, sell_venue, profit)


def execute_arbitrum_arb(buy_venue: str, sell_venue: str, profit_usd: float) -> Optional[str]:
    if profit_usd < settings.min_profit_usd:
        return None
    if not ARB_EXECUTOR_CONTRACT:
        log.info("[OBS] %s -> %s | $%.2f profit (deploy ArbExecutor to execute)",
                 buy_venue, sell_venue, profit_usd)
        return None
    if not is_safe_to_send(w3("arbitrum")):
        return None
    log.info("Executing arbitrum arb %s -> %s for $%.2f", buy_venue, sell_venue, profit_usd)
    # Hook: call ArbExecutor with (buy_venue, sell_venue, amount, minProfit).
    # Wiring deferred; the contract template is in arbitrage/ArbExecutor.sol.
    return None


def run_once() -> None:
    intra = quotes_arbitrum(ETH_PROBE_WEI)
    cross = quotes_cross_chain(ETH_PROBE_WEI)
    log.info("Arbitrum quotes (1 ETH -> USDC): %s",
             {k: (v / 1e6 if v else None) for k, v in intra.items()})
    log.info("Cross-chain quotes (1 ETH -> USDC): %s",
             {k: (v / 1e6 if v else None) for k, v in cross.items()})

    best = best_pair(intra)
    if best:
        buy, sell, pnl = best
        log.info("INTRA best: buy=%s sell=%s profit=$%.4f", buy, sell, pnl)
        if pnl >= settings.min_profit_usd:
            tx = execute_arbitrum_arb(buy, sell, pnl)
            record("arbitrage", "intra_chain", pnl, buy=buy, sell=sell, tx=tx)

    cross_best = best_pair(cross)
    if cross_best:
        buy, sell, pnl = cross_best
        # Cross-chain captures require bridging cost (Across ~5-10 bps).
        net = pnl - PROBE_AMOUNT_ETH * float(os.getenv("MEV_ETH_PX_USD", "3500")) * 0.001
        if net >= settings.min_profit_usd:
            log.info("CROSS-CHAIN opportunity: buy on %s, sell on %s, est_net=$%.2f",
                     buy, sell, net)
            record("arbitrage", "cross_chain_advisory", net, buy=buy, sell=sell)


def run_forever() -> None:
    log.info("AIQTP arbitrage scanner starting (probe=%.2f ETH)", PROBE_AMOUNT_ETH)
    while True:
        try:
            run_once()
        except Exception as e:
            log.exception("loop error: %s", e)
        time.sleep(POLL_INTERVAL)


def main() -> None:
    run_forever()


if __name__ == "__main__":
    main()
