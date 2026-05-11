"""
DeFi Llama connector — free public API, no key required.

Hosts:
  https://api.llama.fi      → TVL / protocols / chains
  https://yields.llama.fi   → yield pools
  https://coins.llama.fi    → token prices
  https://stablecoins.llama.fi → stablecoin metrics
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

log = logging.getLogger("defillama")

TVL_BASE = "https://api.llama.fi"
YIELDS_BASE = "https://yields.llama.fi"
COINS_BASE = "https://coins.llama.fi"


class DefiLlamaConnector:
    def status(self) -> dict[str, Any]:
        return {
            "connector": "defillama",
            "tvl_base": TVL_BASE,
            "yields_base": YIELDS_BASE,
            "coins_base": COINS_BASE,
        }

    async def _get(self, base: str, path: str, params: Optional[dict] = None) -> Any:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(f"{base}{path}", params=params)
            if r.status_code != 200:
                raise RuntimeError(f"defillama {path} {r.status_code}: {r.text[:200]}")
            return r.json()

    async def total_tvl(self) -> Any:
        return await self._get(TVL_BASE, "/v2/historicalChainTvl")

    async def chains_tvl(self) -> Any:
        return await self._get(TVL_BASE, "/v2/chains")

    async def protocol_tvl(self, protocol_slug: str) -> Any:
        return await self._get(TVL_BASE, f"/protocol/{protocol_slug}")

    async def protocols(self) -> Any:
        return await self._get(TVL_BASE, "/protocols")

    async def yield_pools(self) -> Any:
        return await self._get(YIELDS_BASE, "/pools")

    async def top_yields(
        self,
        chain: Optional[str] = None,
        min_tvl_usd: float = 1_000_000,
        limit: int = 25,
    ) -> list[dict[str, Any]]:
        data = await self.yield_pools()
        pools = data.get("data", []) if isinstance(data, dict) else []
        if chain:
            chain_l = chain.lower()
            pools = [p for p in pools if str(p.get("chain", "")).lower() == chain_l]
        pools = [p for p in pools if (p.get("tvlUsd") or 0) >= min_tvl_usd]
        pools.sort(key=lambda p: p.get("apy") or 0, reverse=True)
        return pools[:limit]

    async def token_prices(self, coins: list[str]) -> Any:
        # coins format: ["coingecko:bitcoin", "ethereum:0x...."]
        joined = ",".join(coins)
        return await self._get(COINS_BASE, f"/prices/current/{joined}")
