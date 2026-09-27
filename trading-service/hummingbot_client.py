"""Private Hummingbot API adapter.

The Hummingbot API must stay on a private network. This adapter is the only
application path to it and never returns credentials to callers.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx


class HummingbotClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("HUMMINGBOT_API_URL", "").rstrip("/")
        self.username = os.getenv("HUMMINGBOT_API_USERNAME", "")
        self.password = os.getenv("HUMMINGBOT_API_PASSWORD", "")
        self.live_enabled = os.getenv("HUMMINGBOT_LIVE_ENABLED", "false").lower() == "true"

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.username and self.password)

    def public_status(self) -> dict[str, Any]:
        return {
            "engine": "hummingbot",
            "configured": self.configured,
            "live_enabled": self.live_enabled,
            "network": "private" if self.base_url else "not_configured",
        }

    async def request(
        self,
        method: str,
        path: str,
        *,
        json_body: Optional[dict[str, Any]] = None,
        params: Optional[dict[str, Any]] = None,
    ) -> Any:
        if not self.configured:
            raise RuntimeError("Hummingbot API is not configured")
        async with httpx.AsyncClient(
            base_url=self.base_url,
            auth=(self.username, self.password),
            timeout=20,
        ) as client:
            response = await client.request(method, path, json=json_body, params=params)
        if response.status_code >= 400:
            raise RuntimeError(f"Hummingbot API returned HTTP {response.status_code}")
        return response.json()

    async def health(self) -> dict[str, Any]:
        if not self.configured:
            return self.public_status()
        try:
            await self.request("GET", "/")
            return {**self.public_status(), "reachable": True}
        except Exception:
            return {**self.public_status(), "reachable": False}

    async def active_bots(self) -> Any:
        return await self.request("GET", "/docker/active-containers")

    async def start_bot(self, container_name: str) -> Any:
        if not self.live_enabled:
            raise RuntimeError("Hummingbot live control is disabled")
        return await self.request("POST", f"/docker/start-container/{container_name}")

    async def stop_bot(self, container_name: str) -> Any:
        return await self.request("POST", f"/docker/stop-container/{container_name}")
