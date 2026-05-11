"""
Jupiter (Solana DEX aggregator) connector.

Public quote API: https://quote-api.jup.ag/v6 (no key).
Token list:       https://token.jup.ag/all
Swap path requires a Solana wallet to sign and submit. Wallet env vars:
  - SOLANA_PRIVATE_KEY (base58-encoded 64-byte secret key)
  - SOLANA_RPC_URL (defaults to public mainnet RPC)
"""

from __future__ import annotations

import base64
import logging
import os
from typing import Any, Optional

import httpx

log = logging.getLogger("jupiter")

# Jupiter migrated to lite-api in 2025; the legacy quote-api.jup.ag host
# is no longer publicly resolvable. Override via JUPITER_BASE_URL if needed.
import os as _os
QUOTE_API = _os.getenv("JUPITER_BASE_URL", "https://lite-api.jup.ag/swap/v1")
TOKEN_API = "https://lite-api.jup.ag/tokens/v1/all"
PRICE_API = "https://lite-api.jup.ag/price/v2"
DEFAULT_RPC = "https://api.mainnet-beta.solana.com"


class JupiterConnector:
    def __init__(
        self,
        secret_key_b58: Optional[str] = None,
        rpc_url: Optional[str] = None,
    ) -> None:
        self.secret_key_b58 = secret_key_b58 or os.getenv("SOLANA_PRIVATE_KEY", "")
        self.rpc_url = rpc_url or os.getenv("SOLANA_RPC_URL", DEFAULT_RPC)

    # ── status ──────────────────────────────────────────────────────────
    def status(self) -> dict[str, Any]:
        return {
            "connector": "jupiter",
            "quote_api": QUOTE_API,
            "rpc_url": self.rpc_url,
            "wallet_configured": bool(self.secret_key_b58),
            "wallet_address": self._wallet_address(),
        }

    def _wallet_address(self) -> Optional[str]:
        if not self.secret_key_b58:
            return None
        try:
            from solders.keypair import Keypair  # type: ignore

            kp = Keypair.from_base58_string(self.secret_key_b58)
            return str(kp.pubkey())
        except Exception as exc:  # pragma: no cover
            log.warning("jupiter: cannot derive wallet address: %s", exc)
            return None

    # ── public REST ─────────────────────────────────────────────────────
    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50,
        only_direct_routes: bool = False,
    ) -> dict[str, Any]:
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": str(amount),
            "slippageBps": str(slippage_bps),
            "onlyDirectRoutes": "true" if only_direct_routes else "false",
        }
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{QUOTE_API}/quote", params=params)
            r.raise_for_status()
            return r.json()

    async def get_tokens(self, limit: int = 200) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=20) as client:
            try:
                r = await client.get(TOKEN_API)
                r.raise_for_status()
                data = r.json()
            except Exception:
                # Fallback: legacy verified-token endpoint
                r = await client.get("https://lite-api.jup.ag/tokens/v1/tagged/verified")
                r.raise_for_status()
                data = r.json()
        # Token list is huge — return a slice plus the major ones
        majors = {
            "So11111111111111111111111111111111111111112",  # wSOL
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  # USDC
            "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  # USDT
        }
        chosen = [t for t in data if t.get("address") in majors]
        chosen += [t for t in data if t.get("address") not in majors][: max(0, limit - len(chosen))]
        return chosen

    async def get_price(self, mints: list[str]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(PRICE_API, params={"ids": ",".join(mints)})
            r.raise_for_status()
            return r.json()

    # ── swap (signed) ───────────────────────────────────────────────────
    async def build_swap_tx(
        self,
        quote_response: dict[str, Any],
        user_pubkey: Optional[str] = None,
        wrap_unwrap_sol: bool = True,
    ) -> dict[str, Any]:
        pk = user_pubkey or self._wallet_address()
        if not pk:
            raise ValueError("user_pubkey required (no platform wallet configured)")
        body = {
            "quoteResponse": quote_response,
            "userPublicKey": pk,
            "wrapAndUnwrapSol": wrap_unwrap_sol,
            "dynamicComputeUnitLimit": True,
            "prioritizationFeeLamports": "auto",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(f"{QUOTE_API}/swap", json=body)
            r.raise_for_status()
            return r.json()

    async def execute_swap(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50,
    ) -> dict[str, Any]:
        """Quote + sign + submit. Requires SOLANA_PRIVATE_KEY env var."""
        if not self.secret_key_b58:
            raise RuntimeError("SOLANA_PRIVATE_KEY not configured")
        try:
            from solders.keypair import Keypair  # type: ignore
            from solders.transaction import VersionedTransaction  # type: ignore
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError("solders not installed; run `pip install solders`") from exc

        kp = Keypair.from_base58_string(self.secret_key_b58)
        quote = await self.get_quote(input_mint, output_mint, amount, slippage_bps)
        swap = await self.build_swap_tx(quote, str(kp.pubkey()))
        tx_bytes = base64.b64decode(swap["swapTransaction"])
        unsigned = VersionedTransaction.from_bytes(tx_bytes)
        signed = VersionedTransaction(unsigned.message, [kp])
        raw = bytes(signed)

        # Submit via JSON-RPC sendTransaction
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                self.rpc_url,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "sendTransaction",
                    "params": [
                        base64.b64encode(raw).decode(),
                        {"encoding": "base64", "skipPreflight": False, "maxRetries": 3},
                    ],
                },
            )
            r.raise_for_status()
            res = r.json()
        return {"quote": quote, "rpc_response": res}
