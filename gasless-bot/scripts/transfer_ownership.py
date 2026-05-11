#!/usr/bin/env python3
"""
scripts/transfer_ownership.py
==============================
Transfers ownership of the FlashLoanArbExecutor contract to the
ERC-4337 Smart Account so the bot can call executeArbitrage /
executeLiquidation via gasless UserOperations.

This script uses a regular EOA transaction (the deployer pays gas
for this one-time setup step).

Usage
-----
    cd gasless-bot
    python scripts/transfer_ownership.py
"""

import os
import json
import logging
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("transfer-ownership")

RPC_URL          = os.environ["ARBITRUM_RPC_URL"]
PRIVATE_KEY      = os.environ["PRIVATE_KEY"]
EXECUTOR_ADDR    = Web3.to_checksum_address(os.environ["EXECUTOR_ADDRESS"])
SMART_ACCOUNT    = Web3.to_checksum_address(os.environ["SMART_ACCOUNT_ADDRESS"])

w3      = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 30}))
account = Account.from_key(PRIVATE_KEY)

EXECUTOR_ABI = json.loads(open(
    os.path.join(os.path.dirname(__file__), "../abis/FlashLoanArbExecutor.json")
).read())

executor = w3.eth.contract(address=EXECUTOR_ADDR, abi=EXECUTOR_ABI)


def main():
    current_owner = executor.functions.owner().call()
    log.info("Current executor owner : %s", current_owner)
    log.info("Transferring to        : %s", SMART_ACCOUNT)

    if current_owner.lower() == SMART_ACCOUNT.lower():
        log.info("Ownership already transferred. Nothing to do.")
        return

    if current_owner.lower() != account.address.lower():
        log.error(
            "Your EOA (%s) is not the current owner (%s). Cannot transfer.",
            account.address, current_owner,
        )
        return

    nonce     = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price

    tx = executor.functions.transferOwnership(SMART_ACCOUNT).build_transaction({
        "from":     account.address,
        "nonce":    nonce,
        "gasPrice": gas_price,
        "gas":      100_000,
        "chainId":  42161,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    log.info("Transaction sent: %s", tx_hash.hex())

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    if receipt["status"] == 1:
        log.info("Ownership transferred successfully!")
        log.info("New owner: %s", executor.functions.owner().call())
    else:
        log.error("Transaction reverted. Receipt: %s", receipt)


if __name__ == "__main__":
    main()
