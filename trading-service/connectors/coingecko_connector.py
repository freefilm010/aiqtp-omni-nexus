"""
CoinGecko connector — free public REST API.

No key required for the basic public endpoints (rate-limited ~30/min).
Optionally pass COINGECKO_API_KEY to use the demo/pro host.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

import httpx

log = logging.getLogger("coingecko")

PUBLIC_BASE = "https://api.coingecko.com/api/v3"
PRO_BASE = "https://pro-api.coingecko.com/api/v3"


class CoinGeckoConnector:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("COINGECKO_API_KEY", "")
        self.base_url = PRO_BASE if self.api_key else PUBLIC_BASE

    def status(self) -> dict[str, Any]:
        return {
            "connector": "coingecko",
            "base_url": self.base_url,
            "api_key_configured": bool(self.api_key),
        }

    def _headers(self) -> dict[str, str]:
        return {"x-cg-pro-api-key": self.api_key} if self.api_key else {}

    async def _get(self, path: str, params: Optional[dict] = None) -> Any:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{self.base_url}{path}", params=params, headers=self._headers())
            if r.status_code != 200:
                raise RuntimeError(f"coingecko {path} {r.status_code}: {r.text[:200]}")
            return r.json()

    async def simple_price(
        self,
        ids: list[str],
        vs_currencies: list[str] = None,
        include_24hr_change: bool = True,
    ) -> dict[str, Any]:
        params = {
            "ids": ",".join(ids),
            "vs_currencies": ",".join(vs_currencies or ["usd"]),
            "include_24hr_change": "true" if include_24hr_change else "false",
            "include_market_cap": "true",
            "include_24hr_vol": "true",
        }
        return await self._get("/simple/price", params)

    async def market_chart(
        self,
        coin_id: str,
        vs_currency: str = "usd",
        days: int = 7,
    ) -> dict[str, Any]:
        params = {"vs_currency": vs_currency, "days": str(days)}
        return await self._get(f"/coins/{coin_id}/market_chart", params)

    async def trending(self) -> dict[str, Any]:
        return await self._get("/search/trending")

    async def coins_markets(
        self,
        vs_currency: str = "usd",
        per_page: int = 50,
        page: int = 1,
    ) -> Any:
        params = {
            "vs_currency": vs_currency,
            "order": "market_cap_desc",
            "per_page": str(per_page),
            "page": str(page),
            "sparkline": "false",
            "price_change_percentage": "24h",
        }
        return await self._get("/coins/markets", params)
