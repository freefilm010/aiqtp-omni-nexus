#!/usr/bin/env python3
"""
gasless-bot/bot/bot.py
======================
Gasless Flash-Loan Arbitrage & Liquidation Bot for Arbitrum Mainnet.

Architecture
------------
* ERC-4337 Account Abstraction    – all transactions are UserOperations
* Self-hosted ERC-4337 Bundler    – submits UserOperations to the network
  (eth-infinitism/bundler — see gasless-bot/bundler/ for Docker setup)
* Self-hosted Verifying Paymaster – sponsors all gas (zero ETH required)
  (same bundler process exposes pm_sponsorUserOperation when configured)
* Aave V3 flash loans             – provide the capital for every trade
* Uniswap V3 / SushiSwap          – DEX pair for arbitrage
* Aave V3 subgraph (The Graph)    – source of liquidation candidates

Flow per opportunity
--------------------
1. Scanner finds a profitable arb or a liquidatable position.
2. Bot encodes the calldata for FlashLoanArbExecutor.
3. Bot builds an ERC-4337 UserOperation targeting the Smart Account.
4. Bot requests gas sponsorship from the paymaster via pm_sponsorUserOperation.
5. Bot signs the UserOperation with the owner private key.
6. Bot submits via eth_sendUserOperation to the self-hosted bundler.
7. Bundler submits an on-chain transaction; Aave executes the flash loan.
8. Profit is left in the executor contract; withdraw() sweeps it.

Self-hosted bundler quick-start
--------------------------------
  cd gasless-bot/bundler
  cp .env.example .env          # fill in ARBITRUM_RPC_URL, BUNDLER_BENEFICIARY
  cp workdir/mnemonic.txt.example workdir/mnemonic.txt  # fill in mnemonic
  docker compose up -d
  # Bundler now listening at http://localhost:3000/rpc

Environment variables
---------------------
  ARBITRUM_RPC_URL      Arbitrum JSON-RPC endpoint (required)
  BUNDLER_RPC_URL       Self-hosted bundler endpoint (default: http://localhost:3000/rpc)
  PAYMASTER_RPC_URL     Paymaster endpoint (default: same as BUNDLER_RPC_URL)
  PAYMASTER_ENABLED     Set to "false" to skip paymaster sponsorship (default: true)
  PRIVATE_KEY           EOA private key — signs UserOperations (required)
  SMART_ACCOUNT_ADDRESS ERC-4337 Smart Account address (required)
  EXECUTOR_ADDRESS      FlashLoanArbExecutor contract address (required)
"""

import os
import sys
import time
import json
import logging
import requests
from typing import Optional, Tuple

from web3 import Web3
from web3.types import HexStr
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_abi import encode as abi_encode
from dotenv import load_dotenv

# ─────────────────────────────────────────────────────────────
#  Configuration
# ─────────────────────────────────────────────────────────────

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("gasless-bot")

# ── Required env vars ─────────────────────────────────────────
RPC_URL       = os.environ["ARBITRUM_RPC_URL"]
PRIVATE_KEY   = os.environ["PRIVATE_KEY"]
SMART_ACCOUNT = Web3.to_checksum_address(os.environ["SMART_ACCOUNT_ADDRESS"])
EXECUTOR_ADDR = Web3.to_checksum_address(os.environ["EXECUTOR_ADDRESS"])

# ── Bundler / Paymaster configuration ────────────────────────
# BUNDLER_RPC_URL: URL of the self-hosted ERC-4337 bundler JSON-RPC endpoint.
# Default: http://localhost:3000/rpc  (eth-infinitism/bundler in gasless-bot/bundler/)
# To use a third-party bundler (e.g. Alchemy AA, Stackup), set this to their endpoint.
BUNDLER_RPC_URL   = os.environ.get("BUNDLER_RPC_URL",   "http://localhost:3000/rpc")

# PAYMASTER_RPC_URL: URL for paymaster sponsorship calls (pm_sponsorUserOperation).
# Defaults to the same endpoint as the bundler.
# When running the eth-infinitism bundler in --unsafe mode (no external paymaster),
# set PAYMASTER_ENABLED=false and the bot will submit UserOps without sponsorship
# (the Smart Account must hold ETH for gas in that case).
PAYMASTER_RPC_URL = os.environ.get("PAYMASTER_RPC_URL", BUNDLER_RPC_URL)
PAYMASTER_ENABLED = os.environ.get("PAYMASTER_ENABLED", "true").lower() == "true"

# ── Optional tuning ───────────────────────────────────────────
MIN_ARB_PROFIT_USD   = float(os.getenv("MIN_ARB_PROFIT_USD",   "10"))
MIN_LIQ_BONUS_USD    = float(os.getenv("MIN_LIQ_BONUS_USD",    "20"))
SCAN_INTERVAL_SEC    = int(os.getenv("SCAN_INTERVAL_SEC",       "12"))
MAX_FLASH_LOAN_USD   = float(os.getenv("MAX_FLASH_LOAN_USD",    "500000"))

# ─────────────────────────────────────────────────────────────
#  Arbitrum contract addresses
# ─────────────────────────────────────────────────────────────

CHAIN_ID         = 42161
ENTRYPOINT_V07   = Web3.to_checksum_address("0x0000000071727De22E5E9d8BAf0edAc6f37da032")
AAVE_POOL        = Web3.to_checksum_address("0x794a61358D6845594F94dc1DB02A252b5b4814aD")
UNI_ROUTER       = Web3.to_checksum_address("0xE592427A0AEce92De3Edee1F18E0157C05861564")
SUSHI_ROUTER     = Web3.to_checksum_address("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506")

# Uniswap V3 Quoter V2 on Arbitrum
UNI_QUOTER       = Web3.to_checksum_address("0x61fFE014bA17989E743c5F6cB21bF9697530B21e")

# Aave V3 Pool Data Provider on Arbitrum
AAVE_DATA_PROV   = Web3.to_checksum_address("0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654")

# Common tokens on Arbitrum
TOKENS = {
    "USDC":  Web3.to_checksum_address("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
    "USDT":  Web3.to_checksum_address("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"),
    "WETH":  Web3.to_checksum_address("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
    "WBTC":  Web3.to_checksum_address("0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"),
    "ARB":   Web3.to_checksum_address("0x912CE59144191C1204E64559FE8253a0e49E6548"),
    "DAI":   Web3.to_checksum_address("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"),
    "LINK":  Web3.to_checksum_address("0xf97f4df75117a78c1A5a0DBb814Af92458539FB4"),
    "UNI":   Web3.to_checksum_address("0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0"),
}

# Aave V3 Subgraph on Arbitrum (The Graph hosted service)
AAVE_SUBGRAPH_URL = (
    "https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum"
)

# ─────────────────────────────────────────────────────────────
#  Web3 + ABIs
# ─────────────────────────────────────────────────────────────

w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 30}))
account = Account.from_key(PRIVATE_KEY)
log.info("Owner EOA: %s", account.address)
log.info("Smart Account: %s", SMART_ACCOUNT)
log.info("Executor: %s", EXECUTOR_ADDR)
log.info("Bundler RPC: %s", BUNDLER_RPC_URL)
log.info("Paymaster enabled: %s", PAYMASTER_ENABLED)

# Minimal ABI fragments
EXECUTOR_ABI = json.loads(open(
    os.path.join(os.path.dirname(__file__), "../abis/FlashLoanArbExecutor.json")
).read())

QUOTER_ABI = [
    {
        "inputs": [
            {"name": "tokenIn",            "type": "address"},
            {"name": "tokenOut",           "type": "address"},
            {"name": "fee",                "type": "uint24"},
            {"name": "amountIn",           "type": "uint256"},
            {"name": "sqrtPriceLimitX96",  "type": "uint160"},
        ],
        "name": "quoteExactInputSingle",
        "outputs": [
            {"name": "amountOut",          "type": "uint256"},
            {"name": "sqrtPriceX96After",  "type": "uint160"},
            {"name": "initializedTicksCrossed", "type": "uint32"},
            {"name": "gasEstimate",        "type": "uint256"},
        ],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

AAVE_POOL_ABI = [
    {
        "inputs": [{"name": "asset", "type": "address"}],
        "name": "getReserveData",
        "outputs": [
            {
                "components": [
                    {"name": "configuration",       "type": "uint256"},
                    {"name": "liquidityIndex",      "type": "uint128"},
                    {"name": "currentLiquidityRate","type": "uint128"},
                    {"name": "variableBorrowIndex", "type": "uint128"},
                    {"name": "currentVariableBorrowRate","type": "uint128"},
                    {"name": "currentStableBorrowRate",  "type": "uint128"},
                    {"name": "lastUpdateTimestamp", "type": "uint40"},
                    {"name": "id",                  "type": "uint16"},
                    {"name": "aTokenAddress",       "type": "address"},
                    {"name": "stableDebtTokenAddress","type": "address"},
                    {"name": "variableDebtTokenAddress","type": "address"},
                    {"name": "interestRateStrategyAddress","type": "address"},
                    {"name": "accruedToTreasury",   "type": "uint128"},
                    {"name": "unbacked",            "type": "uint128"},
                    {"name": "isolationModeTotalDebt","type": "uint128"},
                ],
                "name": "",
                "type": "tuple",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    }
]

executor = w3.eth.contract(address=EXECUTOR_ADDR, abi=EXECUTOR_ABI)
quoter   = w3.eth.contract(address=UNI_QUOTER,    abi=QUOTER_ABI)
pool     = w3.eth.contract(address=AAVE_POOL,     abi=AAVE_POOL_ABI)

# ─────────────────────────────────────────────────────────────
#  Bundler / Paymaster JSON-RPC helpers
#  All calls go to the self-hosted eth-infinitism bundler by default.
#  Override BUNDLER_RPC_URL / PAYMASTER_RPC_URL in .env to use any
#  ERC-4337-compatible bundler or paymaster service.
# ─────────────────────────────────────────────────────────────


def _bundler_rpc(method: str, params: list) -> dict:
    """Send a JSON-RPC call to the bundler endpoint."""
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    r = requests.post(BUNDLER_RPC_URL, json=payload, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"Bundler RPC error [{method}]: {data['error']}")
    return data["result"]


def _paymaster_rpc(method: str, params: list) -> dict:
    """Send a JSON-RPC call to the paymaster endpoint."""
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    r = requests.post(PAYMASTER_RPC_URL, json=payload, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"Paymaster RPC error [{method}]: {data['error']}")
    return data["result"]


def get_nonce(sender: str) -> int:
    """Fetch the ERC-4337 nonce for the Smart Account from the EntryPoint."""
    ep_abi = [
        {
            "inputs": [
                {"name": "sender", "type": "address"},
                {"name": "key",    "type": "uint192"},
            ],
            "name": "getNonce",
            "outputs": [{"name": "nonce", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function",
        }
    ]
    ep = w3.eth.contract(address=ENTRYPOINT_V07, abi=ep_abi)
    return ep.functions.getNonce(sender, 0).call()


def get_gas_prices() -> Tuple[int, int]:
    """
    Return (maxFeePerGas, maxPriorityFeePerGas).
    First tries the bundler's pimlico_getUserOperationGasPrice extension.
    Falls back to eth_gasPrice from the Arbitrum RPC node if not supported.
    """
    try:
        result = _bundler_rpc("pimlico_getUserOperationGasPrice", [])
        fast = result["fast"]
        return int(fast["maxFeePerGas"], 16), int(fast["maxPriorityFeePerGas"], 16)
    except Exception:
        # Fallback: use eth_gasPrice from the Arbitrum node directly
        gas_price = w3.eth.gas_price
        # Arbitrum uses EIP-1559; set priority fee to 10% of base
        priority = max(gas_price // 10, 1_000_000)  # min 0.001 gwei
        return gas_price + priority, priority


# ─────────────────────────────────────────────────────────────
#  ERC-4337 UserOperation builder
# ─────────────────────────────────────────────────────────────

def build_userop(call_data: bytes) -> dict:
    """
    Construct a minimal UserOperation v0.7 for the Smart Account.
    The Smart Account is assumed to be a SimpleAccount-compatible
    contract that accepts `execute(address dest, uint256 value, bytes calldata data)`.
    """
    nonce = get_nonce(SMART_ACCOUNT)
    max_fee, max_priority = get_gas_prices()

    # encode execute(dest, value, data) call into the Smart Account
    execute_selector = Web3.keccak(text="execute(address,uint256,bytes)")[:4]
    inner_call = (
        execute_selector
        + abi_encode(
            ["address", "uint256", "bytes"],
            [EXECUTOR_ADDR, 0, call_data],
        )
    )

    userop = {
        "sender":               SMART_ACCOUNT,
        "nonce":                hex(nonce),
        "initCode":             "0x",
        "callData":             "0x" + inner_call.hex(),
        "callGasLimit":         hex(500_000),
        "verificationGasLimit": hex(200_000),
        "preVerificationGas":   hex(50_000),
        "maxFeePerGas":         hex(max_fee),
        "maxPriorityFeePerGas": hex(max_priority),
        "paymasterAndData":     "0x",
        "signature":            "0x" + "00" * 65,
    }
    return userop


def sponsor_userop(userop: dict) -> dict:
    """
    Ask the configured paymaster to sponsor the UserOperation.
    Returns the updated UserOperation with paymasterAndData filled in
    and gas limits adjusted.

    When PAYMASTER_ENABLED=false the UserOperation is returned unchanged
    (the Smart Account must hold ETH on Arbitrum to cover gas itself).
    """
    if not PAYMASTER_ENABLED:
        log.info("Paymaster disabled — UserOp will be self-funded (Smart Account needs ETH).")
        return userop
    result = _paymaster_rpc(
        "pm_sponsorUserOperation",
        [userop, ENTRYPOINT_V07],
    )
    userop["paymasterAndData"]     = result["paymasterAndData"]
    userop["preVerificationGas"]   = result["preVerificationGas"]
    userop["verificationGasLimit"] = result["verificationGasLimit"]
    userop["callGasLimit"]         = result["callGasLimit"]
    return userop


def sign_userop(userop: dict) -> dict:
    """
    Sign the UserOperation hash with the owner's private key.

    The UserOperation hash for EntryPoint v0.7 is:
        keccak256(abi.encode(
            keccak256(packed_userop),
            entryPoint,
            chainId
        ))
    where packed_userop is the ABI-encoding of all fields except signature.
    """
    packed = _pack_userop(userop)
    userop_hash = Web3.keccak(
        abi_encode(
            ["bytes32", "address", "uint256"],
            [Web3.keccak(packed), ENTRYPOINT_V07, CHAIN_ID],
        )
    )
    signed = account.sign_message(encode_defunct(userop_hash))
    userop["signature"] = "0x" + signed.signature.hex()
    return userop


def _pack_userop(op: dict) -> bytes:
    """Pack UserOperation fields for hashing (EntryPoint v0.7 spec)."""
    return abi_encode(
        [
            "address",  # sender
            "uint256",  # nonce
            "bytes32",  # keccak256(initCode)
            "bytes32",  # keccak256(callData)
            "uint256",  # callGasLimit
            "uint256",  # verificationGasLimit
            "uint256",  # preVerificationGas
            "uint256",  # maxFeePerGas
            "uint256",  # maxPriorityFeePerGas
            "bytes32",  # keccak256(paymasterAndData)
        ],
        [
            op["sender"],
            int(op["nonce"], 16),
            Web3.keccak(hexstr=op["initCode"]),
            Web3.keccak(hexstr=op["callData"]),
            int(op["callGasLimit"], 16),
            int(op["verificationGasLimit"], 16),
            int(op["preVerificationGas"], 16),
            int(op["maxFeePerGas"], 16),
            int(op["maxPriorityFeePerGas"], 16),
            Web3.keccak(hexstr=op["paymasterAndData"]),
        ],
    )


def submit_userop(userop: dict) -> str:
    """Submit the signed UserOperation to the self-hosted bundler."""
    op_hash = _bundler_rpc(
        "eth_sendUserOperation",
        [userop, ENTRYPOINT_V07],
    )
    return op_hash


def wait_for_userop(op_hash: str, timeout: int = 120) -> Optional[dict]:
    """Poll until the UserOperation is included in a block."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            receipt = _bundler_rpc(
                "eth_getUserOperationReceipt",
                [op_hash],
            )
            if receipt:
                return receipt
        except Exception:
            pass
        time.sleep(5)
    return None


# ─────────────────────────────────────────────────────────────
#  Opportunity scanner: DEX arbitrage
# ─────────────────────────────────────────────────────────────

# Pairs to scan: (base_token_key, mid_token_key, fee_tier)
ARB_PAIRS = [
    ("USDC", "WETH",  500),
    ("USDC", "WETH",  3000),
    ("USDC", "WBTC",  3000),
    ("USDC", "ARB",   3000),
    ("WETH", "WBTC",  3000),
    ("WETH", "ARB",   3000),
    ("USDC", "LINK",  3000),
    ("USDC", "UNI",   3000),
]

# Flash-loan amounts to test per pair (in USD equivalent, rough)
LOAN_AMOUNTS_USD = [10_000, 50_000, 100_000, 500_000]

# Approximate token prices in USD (updated periodically in the loop)
TOKEN_PRICES_USD: dict = {}


def _quote_uni(token_in: str, token_out: str, fee: int, amount_in: int) -> int:
    """Call Uniswap V3 QuoterV2.quoteExactInputSingle (static call)."""
    try:
        result = quoter.functions.quoteExactInputSingle(
            token_in, token_out, fee, amount_in, 0
        ).call()
        return result[0]  # amountOut
    except Exception:
        return 0


def _quote_sushi(token_in: str, token_out: str, amount_in: int) -> int:
    """
    Call SushiSwap V2 router getAmountsOut for a two-hop path.
    SushiSwap on Arbitrum uses the Uniswap V2 interface.
    """
    sushi_abi = [
        {
            "inputs": [
                {"name": "amountIn",  "type": "uint256"},
                {"name": "path",      "type": "address[]"},
            ],
            "name": "getAmountsOut",
            "outputs": [{"name": "amounts", "type": "uint256[]"}],
            "stateMutability": "view",
            "type": "function",
        }
    ]
    sushi = w3.eth.contract(address=SUSHI_ROUTER, abi=sushi_abi)
    try:
        amounts = sushi.functions.getAmountsOut(
            amount_in, [token_in, token_out]
        ).call()
        return amounts[-1]
    except Exception:
        return 0


def scan_arbitrage() -> Optional[dict]:
    """
    Scan Uniswap V3 and SushiSwap for price discrepancies.
    Returns the best arbitrage opportunity or None.
    """
    if not TOKEN_PRICES_USD:
        return None

    best = None
    best_profit_usd = MIN_ARB_PROFIT_USD

    for base_sym, mid_sym, fee in ARB_PAIRS:
        base_token = TOKENS.get(base_sym)
        mid_token  = TOKENS.get(mid_sym)
        if not base_token or not mid_token:
            continue

        base_price = TOKEN_PRICES_USD.get(base_sym, 0)
        mid_price  = TOKEN_PRICES_USD.get(mid_sym, 0)
        if not base_price or not mid_price:
            continue

        for loan_usd in LOAN_AMOUNTS_USD:
            if loan_usd > MAX_FLASH_LOAN_USD:
                continue

            # Determine token decimals (USDC=6, most others=18)
            base_dec = 6 if base_sym in ("USDC", "USDT") else 18
            mid_dec  = 8 if mid_sym == "WBTC" else 18

            amount_in = int(loan_usd / base_price * 10 ** base_dec)

            # Path A: buy mid on Uniswap, sell mid on SushiSwap
            uni_out   = _quote_uni(base_token, mid_token, fee, amount_in)
            sushi_out = _quote_sushi(mid_token, base_token, uni_out) if uni_out else 0

            if sushi_out > amount_in:
                profit_base = sushi_out - amount_in
                profit_usd  = (profit_base / 10 ** base_dec) * base_price
                # Subtract Aave flash-loan fee (0.05%)
                flash_fee_usd = loan_usd * 0.0005
                net_profit_usd = profit_usd - flash_fee_usd

                if net_profit_usd > best_profit_usd:
                    best_profit_usd = net_profit_usd
                    best = {
                        "type":             "arbitrage",
                        "asset":            base_token,
                        "amount":           amount_in,
                        "midToken":         mid_token,
                        "poolFee":          fee,
                        "startOnUniswap":   True,
                        "estimatedProfitUSD": net_profit_usd,
                    }

            # Path B: buy mid on SushiSwap, sell mid on Uniswap
            sushi_out2 = _quote_sushi(base_token, mid_token, amount_in)
            uni_out2   = _quote_uni(mid_token, base_token, fee, sushi_out2) if sushi_out2 else 0

            if uni_out2 > amount_in:
                profit_base = uni_out2 - amount_in
                profit_usd  = (profit_base / 10 ** base_dec) * base_price
                flash_fee_usd = loan_usd * 0.0005
                net_profit_usd = profit_usd - flash_fee_usd

                if net_profit_usd > best_profit_usd:
                    best_profit_usd = net_profit_usd
                    best = {
                        "type":             "arbitrage",
                        "asset":            base_token,
                        "amount":           amount_in,
                        "midToken":         mid_token,
                        "poolFee":          fee,
                        "startOnUniswap":   False,
                        "estimatedProfitUSD": net_profit_usd,
                    }

    if best:
        log.info(
            "ARB opportunity: %s→%s fee=%d loan=$%.0f profit=~$%.2f",
            best["asset"][:8],
            best["midToken"][:8],
            best["poolFee"],
            loan_usd,
            best["estimatedProfitUSD"],
        )
    return best


# ─────────────────────────────────────────────────────────────
#  Opportunity scanner: Aave V3 liquidations
# ─────────────────────────────────────────────────────────────

AAVE_LIQ_QUERY = """
{
  users(
    where: { healthFactor_lt: "1000000000000000000" }
    orderBy: healthFactor
    orderDirection: asc
    first: 50
  ) {
    id
    healthFactor
    borrowedReservesCount
    collateralReserve: reserves(where: { currentATokenBalance_gt: "0" }) {
      reserve { underlyingAsset symbol decimals }
      currentATokenBalance
    }
    borrowReserve: reserves(where: { currentTotalDebt_gt: "0" }) {
      reserve { underlyingAsset symbol decimals }
      currentTotalDebt
    }
  }
}
"""


def scan_liquidations() -> Optional[dict]:
    """
    Query the Aave V3 subgraph for positions with health factor < 1.
    Returns the best liquidation opportunity or None.
    """
    try:
        resp = requests.post(
            AAVE_SUBGRAPH_URL,
            json={"query": AAVE_LIQ_QUERY},
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        log.warning("Subgraph query failed: %s", e)
        return None

    users = data.get("data", {}).get("users", [])
    if not users:
        return None

    best = None
    best_bonus_usd = MIN_LIQ_BONUS_USD

    for user in users:
        hf = int(user["healthFactor"]) / 1e18
        if hf >= 1.0:
            continue

        # Pick the largest debt reserve
        debt_reserves = user.get("borrowReserve", [])
        if not debt_reserves:
            continue
        debt_res = max(
            debt_reserves,
            key=lambda r: int(r["currentTotalDebt"]),
        )
        debt_asset   = Web3.to_checksum_address(debt_res["reserve"]["underlyingAsset"])
        debt_dec     = int(debt_res["reserve"]["decimals"])
        total_debt   = int(debt_res["currentTotalDebt"])
        # Aave allows liquidating up to 50 % of the debt
        debt_to_cover = total_debt // 2

        # Pick the largest collateral reserve
        coll_reserves = user.get("collateralReserve", [])
        if not coll_reserves:
            continue
        coll_res = max(
            coll_reserves,
            key=lambda r: int(r["currentATokenBalance"]),
        )
        coll_asset = Web3.to_checksum_address(coll_res["reserve"]["underlyingAsset"])

        # Rough USD value of debt to cover
        debt_usd = (debt_to_cover / 10 ** debt_dec) * TOKEN_PRICES_USD.get(
            debt_res["reserve"]["symbol"], 1
        )

        # Typical liquidation bonus is 5–10 %; use 5 % as conservative estimate
        bonus_usd = debt_usd * 0.05

        if bonus_usd > best_bonus_usd and debt_usd <= MAX_FLASH_LOAN_USD:
            best_bonus_usd = bonus_usd
            best = {
                "type":            "liquidation",
                "user":            Web3.to_checksum_address(user["id"]),
                "healthFactor":    hf,
                "debtAsset":       debt_asset,
                "debtAmount":      debt_to_cover,
                "collateralAsset": coll_asset,
                "estimatedBonusUSD": bonus_usd,
            }

    if best:
        log.info(
            "LIQ opportunity: user=%s hf=%.4f debtAsset=%s amount=%d bonus=~$%.2f",
            best["user"],
            best["healthFactor"],
            best["debtAsset"],
            best["debtAmount"],
            best["estimatedBonusUSD"],
        )
    return best


# ─────────────────────────────────────────────────────────────
#  Execute opportunity via ERC-4337 UserOperation
# ─────────────────────────────────────────────────────────────

def execute_opportunity(opp: dict) -> bool:
    """
    Build, sponsor, sign, and submit a UserOperation for the given
    opportunity.  Returns True if the UserOp was accepted by the bundler.
    """
    try:
        if opp["type"] == "arbitrage":
            call_data = executor.encodeABI(
                fn_name="executeArbitrage",
                args=[
                    opp["asset"],
                    opp["amount"],
                    opp["midToken"],
                    opp["poolFee"],
                    opp["startOnUniswap"],
                ],
            )
        elif opp["type"] == "liquidation":
            call_data = executor.encodeABI(
                fn_name="executeLiquidation",
                args=[
                    opp["debtAsset"],
                    opp["debtAmount"],
                    opp["collateralAsset"],
                    opp["user"],
                ],
            )
        else:
            log.error("Unknown opportunity type: %s", opp["type"])
            return False

        log.info("Building UserOperation for %s …", opp["type"])
        userop = build_userop(bytes.fromhex(call_data[2:]))

        log.info("Requesting paymaster sponsorship …")
        userop = sponsor_userop(userop)

        log.info("Signing UserOperation …")
        userop = sign_userop(userop)

        log.info("Submitting to bundler (%s) …", BUNDLER_RPC_URL)
        op_hash = submit_userop(userop)
        log.info("UserOperation submitted: %s", op_hash)

        log.info("Waiting for on-chain inclusion …")
        receipt = wait_for_userop(op_hash)
        if receipt:
            success = receipt.get("success", False)
            tx_hash = receipt.get("receipt", {}).get("transactionHash", "unknown")
            log.info(
                "UserOperation %s | tx: %s",
                "SUCCEEDED" if success else "REVERTED",
                tx_hash,
            )
            return bool(success)
        else:
            log.warning("UserOperation not included within timeout.")
            return False

    except Exception as e:
        log.error("Error executing opportunity: %s", e, exc_info=True)
        return False


# ─────────────────────────────────────────────────────────────
#  Token price updater (CoinGecko free API)
# ─────────────────────────────────────────────────────────────

COINGECKO_IDS = {
    "USDC": "usd-coin",
    "USDT": "tether",
    "WETH": "weth",
    "WBTC": "wrapped-bitcoin",
    "ARB":  "arbitrum",
    "DAI":  "dai",
    "LINK": "chainlink",
    "UNI":  "uniswap",
}


def update_prices():
    """Fetch token prices from CoinGecko and update TOKEN_PRICES_USD."""
    ids = ",".join(COINGECKO_IDS.values())
    try:
        resp = requests.get(
            f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd",
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        for sym, cg_id in COINGECKO_IDS.items():
            price = data.get(cg_id, {}).get("usd")
            if price:
                TOKEN_PRICES_USD[sym] = float(price)
        log.info("Prices updated: %s", TOKEN_PRICES_USD)
    except Exception as e:
        log.warning("Price update failed: %s", e)


# ─────────────────────────────────────────────────────────────
#  Main loop
# ─────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("Gasless Flash-Loan Bot – Arbitrum Mainnet")
    log.info("Smart Account : %s", SMART_ACCOUNT)
    log.info("Executor      : %s", EXECUTOR_ADDR)
    log.info("EntryPoint    : %s", ENTRYPOINT_V07)
    log.info("Bundler RPC   : %s", BUNDLER_RPC_URL)
    log.info("Paymaster     : %s", "enabled" if PAYMASTER_ENABLED else "disabled (self-funded)")
    log.info("Min ARB profit: $%.2f", MIN_ARB_PROFIT_USD)
    log.info("Min LIQ bonus : $%.2f", MIN_LIQ_BONUS_USD)
    log.info("Scan interval : %ds", SCAN_INTERVAL_SEC)
    log.info("=" * 60)

    price_refresh_interval = 300  # seconds
    last_price_update = 0

    while True:
        try:
            # ── Refresh prices every 5 minutes ───────────────
            if time.time() - last_price_update > price_refresh_interval:
                update_prices()
                last_price_update = time.time()

            # ── Scan for arbitrage ────────────────────────────
            arb = scan_arbitrage()
            if arb:
                log.info(
                    "Executing arbitrage: profit ~$%.2f",
                    arb["estimatedProfitUSD"],
                )
                execute_opportunity(arb)

            # ── Scan for liquidations ─────────────────────────
            liq = scan_liquidations()
            if liq:
                log.info(
                    "Executing liquidation: bonus ~$%.2f",
                    liq["estimatedBonusUSD"],
                )
                execute_opportunity(liq)

            if not arb and not liq:
                log.info("No profitable opportunities found. Sleeping %ds …", SCAN_INTERVAL_SEC)

        except KeyboardInterrupt:
            log.info("Bot stopped by user.")
            break
        except Exception as e:
            log.error("Unexpected error in main loop: %s", e, exc_info=True)

        time.sleep(SCAN_INTERVAL_SEC)


if __name__ == "__main__":
    main()
