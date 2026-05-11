"""
1inch (multi-chain DEX aggregator) connector.

Endpoints used:
  GET https://api.1inch.dev/swap/v6.0/{chainId}/quote
  GET https://api.1inch.dev/swap/v6.0/{chainId}/swap

The 1inch Dev Portal requires a free API key. We support both the
authenticated `api.1inch.dev` host (when ONEINCH_API_KEY is set) and a
fallback to the public `api.1inch.io` legacy host for read-only quote
attempts.

Common chain IDs:
  1   = Ethereum
  10  = Optimism
  56  = BSC
  137 = Polygon
  42161 = Arbitrum
  8453  = Base
"""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

import httpx

log = logging.getLogger("oneinch")

DEV_BASE = "https://api.1inch.dev/swap/v6.0"
PUBLIC_BASE = "https://api.1inch.io/v5.0"

CHAIN_IDS = {
    "ethereum": 1,
    "optimism": 10,
    "bsc": 56,
    "polygon": 137,
    "arbitrum": 42161,
    "base": 8453,
    "avalanche": 43114,
}


class OneInchConnector:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("ONEINCH_API_KEY", "")

    def status(self) -> dict[str, Any]:
        return {
            "connector": "1inch",
            "api_key_configured": bool(self.api_key),
            "base_url": DEV_BASE if self.api_key else PUBLIC_BASE,
            "chains": list(CHAIN_IDS.keys()),
        }

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

    def _resolve_chain(self, chain: str | int) -> int:
        if isinstance(chain, int):
            return chain
        c = str(chain).lower()
        if c in CHAIN_IDS:
            return CHAIN_IDS[c]
        try:
            return int(c)
        except ValueError as exc:
            raise ValueError(f"unknown chain: {chain}") from exc

    async def get_quote(
        self,
        chain: str | int,
        src: str,
        dst: str,
        amount: int,
    ) -> dict[str, Any]:
        chain_id = self._resolve_chain(chain)
        params = {"src": src, "dst": dst, "amount": str(amount)}
        if self.api_key:
            url = f"{DEV_BASE}/{chain_id}/quote"
        else:
            # Legacy public host: parameter names differ slightly
            url = f"{PUBLIC_BASE}/{chain_id}/quote"
            params = {
                "fromTokenAddress": src,
                "toTokenAddress": dst,
                "amount": str(amount),
            }
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, params=params, headers=self._headers())
            if r.status_code != 200:
                raise RuntimeError(f"1inch quote {r.status_code}: {r.text}")
            return r.json()

    async def build_swap(
        self,
        chain: str | int,
        src: str,
        dst: str,
        amount: int,
        from_address: str,
        slippage: float = 1.0,
    ) -> dict[str, Any]:
        if not self.api_key:
            raise RuntimeError(
                "1inch /swap requires ONEINCH_API_KEY (free key at portal.1inch.dev)"
            )
        chain_id = self._resolve_chain(chain)
        params = {
            "src": src,
            "dst": dst,
            "amount": str(amount),
            "from": from_address,
            "slippage": str(slippage),
        }
        url = f"{DEV_BASE}/{chain_id}/swap"
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, params=params, headers=self._headers())
            if r.status_code != 200:
                raise RuntimeError(f"1inch swap {r.status_code}: {r.text}")
            return r.json()

    async def get_tokens(self, chain: str | int) -> dict[str, Any]:
        chain_id = self._resolve_chain(chain)
        if self.api_key:
            url = f"https://api.1inch.dev/swap/v6.0/{chain_id}/tokens"
        else:
            url = f"{PUBLIC_BASE}/{chain_id}/tokens"
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, headers=self._headers())
            if r.status_code != 200:
                raise RuntimeError(f"1inch tokens {r.status_code}: {r.text}")
            return r.json()
