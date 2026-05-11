"""
Generate platform wallets for AIQTP exchange connectivity.

Outputs:
  - Ethereum wallet (Hyperliquid signing)
  - Solana wallet (Jupiter signing)

Run once per environment. Store the printed values in Render env vars.
DO NOT commit the resulting keys.
"""

import json
import os
import sys

from eth_account import Account
from solders.keypair import Keypair


def gen_eth() -> dict:
    Account.enable_unaudited_hdwallet_features()
    acct, mnemonic = Account.create_with_mnemonic()
    return {
        "address": acct.address,
        "private_key": acct.key.hex(),
        "mnemonic": mnemonic,
    }


def gen_solana() -> dict:
    kp = Keypair()
    # Standard Solana keypair is 64 bytes: secret(32) + public(32)
    secret_bytes = bytes(kp)  # 64-byte array
    return {
        "address": str(kp.pubkey()),
        "secret_key_b58": _b58encode(secret_bytes),
        "secret_key_array": list(secret_bytes),
    }


def _b58encode(data: bytes) -> str:
    import base58
    return base58.b58encode(data).decode()


def main() -> int:
    eth = gen_eth()
    sol = gen_solana()
    out = {"ethereum_hyperliquid": eth, "solana_jupiter": sol}
    print(json.dumps(out, indent=2))

    out_path = os.environ.get("WALLET_OUT")
    if out_path:
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(out, fh, indent=2)
        os.chmod(out_path, 0o600)
        print(f"\n[written to {out_path}]", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
