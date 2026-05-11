#!/usr/bin/env python3
"""
scripts/deploy_smart_account.py
================================
Deploys an ERC-4337 SimpleAccount (Smart Contract Account) for the
owner EOA on Arbitrum Mainnet using the official SimpleAccountFactory.

The SimpleAccountFactory is a CREATE2 factory, so the resulting address
is deterministic and can be computed before deployment.  The account is
deployed via a UserOperation so that the Pimlico Paymaster sponsors the
gas – the owner EOA never needs any ETH.

Usage
-----
    cd gasless-bot
    pip install -r bot/requirements.txt
    cp .env.example .env   # fill in ARBITRUM_RPC_URL, PIMLICO_API_KEY, PRIVATE_KEY
    python scripts/deploy_smart_account.py

After running, the script prints the Smart Account address.
Set SMART_ACCOUNT_ADDRESS in your .env to that value.
"""

import os
import sys
import json
import time
import logging
import requests

from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_abi import encode as abi_encode
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("deploy-sca")

# ── Config ────────────────────────────────────────────────────
RPC_URL         = os.environ["ARBITRUM_RPC_URL"]
# Bundler / Paymaster endpoints (self-hosted by default)
BUNDLER_RPC_URL   = os.environ.get("BUNDLER_RPC_URL",   "http://localhost:3000/rpc")
PAYMASTER_RPC_URL = os.environ.get("PAYMASTER_RPC_URL", BUNDLER_RPC_URL)
PAYMASTER_ENABLED = os.environ.get("PAYMASTER_ENABLED", "true").lower() == "true"
PRIVATE_KEY     = os.environ["PRIVATE_KEY"]

CHAIN_ID        = 42161
ENTRYPOINT_V07  = Web3.to_checksum_address("0x0000000071727De22E5E9d8BAf0edAc6f37da032")


# SimpleAccountFactory on Arbitrum (official eth-infinitism deployment)
SIMPLE_ACCOUNT_FACTORY = Web3.to_checksum_address(
    "0x9406Cc6185a346906296840746125a0E44976454"
)

w3      = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 30}))
account = Account.from_key(PRIVATE_KEY)
log.info("Owner EOA: %s", account.address)

# ── Factory ABI ───────────────────────────────────────────────
FACTORY_ABI = [
    {
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "salt",  "type": "uint256"},
        ],
        "name": "createAccount",
        "outputs": [{"name": "ret", "type": "address"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "salt",  "type": "uint256"},
        ],
        "name": "getAddress",
        "outputs": [{"name": "ret", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
]

factory = w3.eth.contract(address=SIMPLE_ACCOUNT_FACTORY, abi=FACTORY_ABI)

# ── Helpers ───────────────────────────────────────────────────

def bundler_rpc(method, params):
    r = requests.post(BUNDLER_RPC_URL, json={"jsonrpc":"2.0","id":1,"method":method,"params":params}, timeout=30)
    r.raise_for_status()
    d = r.json()
    if "error" in d:
        raise RuntimeError(f"Bundler error [{method}]: {d['error']}")
    return d["result"]


def compute_smart_account_address(owner: str, salt: int = 0) -> str:
    return factory.functions.getAddress(owner, salt).call()


def is_deployed(addr: str) -> bool:
    return w3.eth.get_code(addr) != b""


def get_gas_prices():
    result = bundler_rpc("pimlico_getUserOperationGasPrice", [])
    fast = result["fast"]
    return int(fast["maxFeePerGas"], 16), int(fast["maxPriorityFeePerGas"], 16)


def build_init_code(owner: str, salt: int = 0) -> str:
    """
    initCode = factory_address + abi.encodeCall(factory.createAccount, (owner, salt))
    """
    create_selector = Web3.keccak(text="createAccount(address,uint256)")[:4]
    encoded_args    = abi_encode(["address", "uint256"], [owner, salt])
    init_code       = bytes.fromhex(SIMPLE_ACCOUNT_FACTORY[2:]) + create_selector + encoded_args
    return "0x" + init_code.hex()


def pack_userop(op: dict) -> bytes:
    return abi_encode(
        ["address","uint256","bytes32","bytes32","uint256","uint256","uint256","uint256","uint256","bytes32"],
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


def sign_userop(userop: dict) -> dict:
    packed    = pack_userop(userop)
    userop_hash = Web3.keccak(abi_encode(
        ["bytes32","address","uint256"],
        [Web3.keccak(packed), ENTRYPOINT_V07, CHAIN_ID],
    ))
    signed = account.sign_message(encode_defunct(userop_hash))
    userop["signature"] = "0x" + signed.signature.hex()
    return userop


def wait_for_userop(op_hash: str, timeout: int = 120) -> dict | None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = bundler_rpc("eth_getUserOperationReceipt", [op_hash])
            if r:
                return r
        except Exception:
            pass
        time.sleep(5)
    return None


# ── Main ──────────────────────────────────────────────────────

def main():
    salt = 0
    sca_address = compute_smart_account_address(account.address, salt)
    log.info("Computed Smart Account address: %s", sca_address)

    if is_deployed(sca_address):
        log.info("Smart Account already deployed at %s", sca_address)
        print(f"\nSMART_ACCOUNT_ADDRESS={sca_address}")
        return

    log.info("Smart Account not yet deployed. Deploying via UserOperation …")

    max_fee, max_priority = get_gas_prices()
    init_code = build_init_code(account.address, salt)

    userop = {
        "sender":               sca_address,
        "nonce":                "0x0",
        "initCode":             init_code,
        "callData":             "0x",
        "callGasLimit":         hex(300_000),
        "verificationGasLimit": hex(500_000),
        "preVerificationGas":   hex(50_000),
        "maxFeePerGas":         hex(max_fee),
        "maxPriorityFeePerGas": hex(max_priority),
        "paymasterAndData":     "0x",
        "signature":            "0x" + "00" * 65,
    }

    log.info("Requesting paymaster sponsorship …")
    result = bundler_rpc("pm_sponsorUserOperation", [userop, ENTRYPOINT_V07])
    userop["paymasterAndData"]     = result["paymasterAndData"]
    userop["preVerificationGas"]   = result["preVerificationGas"]
    userop["verificationGasLimit"] = result["verificationGasLimit"]
    userop["callGasLimit"]         = result["callGasLimit"]

    log.info("Signing UserOperation …")
    userop = sign_userop(userop)

    log.info("Submitting to bundler …")
    op_hash = bundler_rpc("eth_sendUserOperation", [userop, ENTRYPOINT_V07])
    log.info("UserOperation hash: %s", op_hash)

    log.info("Waiting for on-chain inclusion …")
    receipt = wait_for_userop(op_hash)
    if receipt and receipt.get("success"):
        tx = receipt["receipt"]["transactionHash"]
        log.info("Smart Account deployed! tx: %s", tx)
        log.info("Smart Account address: %s", sca_address)
        print(f"\nSMART_ACCOUNT_ADDRESS={sca_address}")
    else:
        log.error("Deployment failed or timed out. Receipt: %s", receipt)
        sys.exit(1)


if __name__ == "__main__":
    main()
