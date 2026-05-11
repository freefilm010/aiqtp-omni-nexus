#!/usr/bin/env python3
"""
onramp-service/main.py
======================
Self-hosted on-ramp worker.

Receives a swap request from the onramp-webhook Supabase Edge Function,
executes a Uniswap V3 swap on Arbitrum (ETH -> USDC or ETH -> WETH),
and delivers the output token to the specified destination wallet.

Architecture
------------
  Stripe Checkout (user pays USD)
        |
        v
  onramp-webhook (Supabase Edge Function)
        |  POST /execute-swap
        v
  onramp-service (this service, self-hosted Docker)
        |  web3.py + Uniswap V3 SwapRouter02
        v
  Arbitrum Mainnet
        |
        v
  Destination wallet receives USDC / ETH

Flow
----
1. Receive POST /execute-swap with { order_id, amount_usd, output_token, destination_wallet }
2. Verify the shared worker secret header.
3. Convert USD amount to ETH using the current ETH/USD price (Chainlink on-chain oracle).
4. Execute Uniswap V3 exactInputSingle:
     WETH -> USDC (fee 500)  if output_token == "USDC"
     wrap ETH -> WETH        if output_token == "ETH" (just wrap and send)
5. Return the transaction hash.

Prerequisites
-------------
The ONRAMP_EXECUTOR_PRIVATE_KEY wallet must hold enough ETH on Arbitrum to:
  - Cover the swap amount (ETH that will be swapped to USDC, or wrapped)
  - Cover gas fees (typically < $0.10 on Arbitrum)

This wallet is funded from the Stripe payout balance.  The operator is
responsible for maintaining sufficient ETH in this wallet.

Environment Variables
---------------------
  ARBITRUM_RPC_URL            Arbitrum JSON-RPC endpoint
  ONRAMP_EXECUTOR_PRIVATE_KEY Private key of the wallet that executes swaps
  ONRAMP_WORKER_SECRET        Shared secret to authenticate webhook calls
  PORT                        HTTP port to listen on (default: 8080)
"""

import os
import json
import logging
import sys
from decimal import Decimal
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException, Header, Request
from pydantic import BaseModel
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("onramp-service")

# ── Configuration ────────────────────────────────────────────────────────────
RPC_URL          = os.environ["ARBITRUM_RPC_URL"]
EXECUTOR_KEY     = os.environ["ONRAMP_EXECUTOR_PRIVATE_KEY"]
WORKER_SECRET    = os.environ.get("ONRAMP_WORKER_SECRET", "")
PORT             = int(os.environ.get("PORT", "8080"))

# ── Arbitrum contract addresses ──────────────────────────────────────────────
# Uniswap V3 SwapRouter02 on Arbitrum
SWAP_ROUTER      = Web3.to_checksum_address("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45")

# WETH on Arbitrum
WETH             = Web3.to_checksum_address("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1")

# USDC (native) on Arbitrum
USDC             = Web3.to_checksum_address("0xaf88d065e77c8cC2239327C5EDb3A432268e5831")

# Chainlink ETH/USD price feed on Arbitrum
CHAINLINK_ETH_USD = Web3.to_checksum_address("0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612")

# Uniswap V3 pool fee tier for WETH/USDC (0.05% = 500)
POOL_FEE_WETH_USDC = 500

# ── Web3 setup ───────────────────────────────────────────────────────────────
w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 30}))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)
executor = Account.from_key(EXECUTOR_KEY)
log.info("Executor wallet: %s", executor.address)

# ── ABIs ─────────────────────────────────────────────────────────────────────
SWAP_ROUTER_ABI = [
    {
        "inputs": [{
            "components": [
                {"name": "tokenIn",           "type": "address"},
                {"name": "tokenOut",          "type": "address"},
                {"name": "fee",               "type": "uint24"},
                {"name": "recipient",         "type": "address"},
                {"name": "amountIn",          "type": "uint256"},
                {"name": "amountOutMinimum",  "type": "uint256"},
                {"name": "sqrtPriceLimitX96", "type": "uint160"},
            ],
            "name": "params",
            "type": "tuple",
        }],
        "name": "exactInputSingle",
        "outputs": [{"name": "amountOut", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function",
    }
]

WETH_ABI = [
    {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "to",    "type": "address"},
            {"name": "value", "type": "uint256"},
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount",  "type": "uint256"},
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]

CHAINLINK_ABI = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {"name": "roundId",         "type": "uint80"},
            {"name": "answer",          "type": "int256"},
            {"name": "startedAt",       "type": "uint256"},
            {"name": "updatedAt",       "type": "uint256"},
            {"name": "answeredInRound", "type": "uint80"},
        ],
        "stateMutability": "view",
        "type": "function",
    }
]

swap_router = w3.eth.contract(address=SWAP_ROUTER, abi=SWAP_ROUTER_ABI)
weth_contract = w3.eth.contract(address=WETH, abi=WETH_ABI)
chainlink = w3.eth.contract(address=CHAINLINK_ETH_USD, abi=CHAINLINK_ABI)

# ── Helpers ──────────────────────────────────────────────────────────────────

def get_eth_usd_price() -> float:
    """Fetch the current ETH/USD price from Chainlink on Arbitrum."""
    try:
        _, answer, _, _, _ = chainlink.functions.latestRoundData().call()
        # Chainlink ETH/USD has 8 decimals
        return float(answer) / 1e8
    except Exception as e:
        log.warning("Chainlink price fetch failed: %s — falling back to CoinGecko", e)
        resp = requests.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
            timeout=10,
        )
        resp.raise_for_status()
        return float(resp.json()["ethereum"]["usd"])


def usd_to_wei(amount_usd: float) -> int:
    """Convert a USD amount to wei using the current ETH/USD price."""
    eth_price = get_eth_usd_price()
    eth_amount = amount_usd / eth_price
    # Apply a 0.5% slippage buffer (buy slightly less to account for price movement)
    eth_amount_with_buffer = eth_amount * 0.995
    return Web3.to_wei(eth_amount_with_buffer, "ether")


def get_gas_price() -> int:
    """Return a suitable gas price for Arbitrum."""
    return w3.eth.gas_price


def send_transaction(tx: dict) -> str:
    """Sign and send a transaction; return the tx hash."""
    signed = executor.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    log.info("Transaction sent: %s", tx_hash.hex())
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    if receipt["status"] != 1:
        raise RuntimeError(f"Transaction reverted: {tx_hash.hex()}")
    log.info("Transaction confirmed in block %d", receipt["blockNumber"])
    return "0x" + tx_hash.hex()


# ── Swap logic ───────────────────────────────────────────────────────────────

def execute_eth_to_usdc_swap(amount_usd: float, destination: str) -> str:
    """
    Swap ETH -> USDC on Uniswap V3 and send USDC to destination.
    Uses exactInputSingle with ETH as input (via the payable router).
    """
    amount_in_wei = usd_to_wei(amount_usd)
    eth_price = get_eth_usd_price()
    log.info(
        "Swapping %.6f ETH (~$%.2f) -> USDC for %s",
        amount_in_wei / 1e18, amount_usd, destination,
    )

    # amountOutMinimum: accept at most 1% slippage below expected USDC
    expected_usdc = amount_usd * 0.99  # 1% slippage tolerance
    amount_out_minimum = int(expected_usdc * 1e6)  # USDC has 6 decimals

    nonce = w3.eth.get_transaction_count(executor.address)
    gas_price = get_gas_price()

    tx = swap_router.functions.exactInputSingle({
        "tokenIn":           WETH,
        "tokenOut":          USDC,
        "fee":               POOL_FEE_WETH_USDC,
        "recipient":         Web3.to_checksum_address(destination),
        "amountIn":          amount_in_wei,
        "amountOutMinimum":  amount_out_minimum,
        "sqrtPriceLimitX96": 0,
    }).build_transaction({
        "from":     executor.address,
        "value":    amount_in_wei,  # ETH sent with the call
        "nonce":    nonce,
        "gas":      300_000,
        "gasPrice": gas_price,
        "chainId":  42161,
    })

    return send_transaction(tx)


def execute_eth_wrap_and_send(amount_usd: float, destination: str) -> str:
    """
    Wrap ETH -> WETH and transfer to destination.
    Used when output_token == "ETH" (delivers WETH which is 1:1 with ETH).
    """
    amount_in_wei = usd_to_wei(amount_usd)
    log.info(
        "Wrapping %.6f ETH (~$%.2f) -> WETH for %s",
        amount_in_wei / 1e18, amount_usd, destination,
    )

    nonce = w3.eth.get_transaction_count(executor.address)
    gas_price = get_gas_price()

    # Step 1: deposit ETH to get WETH
    wrap_tx = weth_contract.functions.deposit().build_transaction({
        "from":     executor.address,
        "value":    amount_in_wei,
        "nonce":    nonce,
        "gas":      60_000,
        "gasPrice": gas_price,
        "chainId":  42161,
    })
    send_transaction(wrap_tx)

    # Step 2: transfer WETH to destination
    nonce += 1
    transfer_tx = weth_contract.functions.transfer(
        Web3.to_checksum_address(destination),
        amount_in_wei,
    ).build_transaction({
        "from":     executor.address,
        "nonce":    nonce,
        "gas":      60_000,
        "gasPrice": gas_price,
        "chainId":  42161,
    })
    return send_transaction(transfer_tx)


# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(title="AIQTP On-Ramp Worker", version="1.0.0")


class SwapRequest(BaseModel):
    order_id: str
    amount_usd: float
    output_token: str  # "USDC" or "ETH"
    destination_wallet: str


@app.get("/health")
async def health():
    """Health check endpoint."""
    try:
        block = w3.eth.block_number
        eth_price = get_eth_usd_price()
        balance_wei = w3.eth.get_balance(executor.address)
        balance_eth = balance_wei / 1e18
        return {
            "status": "ok",
            "arbitrum_block": block,
            "eth_usd_price": eth_price,
            "executor_wallet": executor.address,
            "executor_balance_eth": round(balance_eth, 6),
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/execute-swap")
async def execute_swap(
    body: SwapRequest,
    x_worker_secret: Optional[str] = Header(None),
):
    """
    Execute a fiat-to-crypto swap on Arbitrum.
    Called by the onramp-webhook Supabase Edge Function after Stripe payment confirmation.
    """
    # Verify shared secret
    if WORKER_SECRET and x_worker_secret != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="Invalid worker secret")

    # Validate inputs
    if body.amount_usd < 10:
        raise HTTPException(status_code=400, detail="Minimum swap amount is $10")
    if body.output_token not in ("USDC", "ETH"):
        raise HTTPException(status_code=400, detail="output_token must be USDC or ETH")
    if not Web3.is_address(body.destination_wallet):
        raise HTTPException(status_code=400, detail="Invalid destination_wallet address")

    # Check executor balance
    balance_wei = w3.eth.get_balance(executor.address)
    required_wei = usd_to_wei(body.amount_usd)
    gas_buffer_wei = Web3.to_wei(0.002, "ether")  # 0.002 ETH for gas

    if balance_wei < required_wei + gas_buffer_wei:
        balance_eth = balance_wei / 1e18
        required_eth = (required_wei + gas_buffer_wei) / 1e18
        raise HTTPException(
            status_code=503,
            detail=f"Insufficient executor balance: have {balance_eth:.6f} ETH, need {required_eth:.6f} ETH",
        )

    log.info(
        "Executing swap: order=%s amount=$%.2f token=%s dest=%s",
        body.order_id, body.amount_usd, body.output_token, body.destination_wallet,
    )

    try:
        if body.output_token == "USDC":
            tx_hash = execute_eth_to_usdc_swap(body.amount_usd, body.destination_wallet)
        else:  # ETH
            tx_hash = execute_eth_wrap_and_send(body.amount_usd, body.destination_wallet)

        log.info("Swap completed: order=%s tx=%s", body.order_id, tx_hash)
        return {"success": True, "tx_hash": tx_hash, "order_id": body.order_id}

    except Exception as e:
        log.error("Swap failed: order=%s error=%s", body.order_id, e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
