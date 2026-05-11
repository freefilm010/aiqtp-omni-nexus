"""
Hyperliquid connector — perpetual futures DEX with wallet-based auth.

Auth: Ethereum private key in env var HYPERLIQUID_PRIVATE_KEY (no API key needed).
Network: mainnet by default; set HYPERLIQUID_TESTNET=true for testnet.

Read paths use the public REST `/info` endpoint and never require a key.
Trade paths require the wallet env var and use the official SDK.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

import httpx

log = logging.getLogger("hyperliquid")

MAINNET_URL = "https://api.hyperliquid.xyz"
TESTNET_URL = "https://api.hyperliquid-testnet.xyz"


class HyperliquidConnector:
    """Lightweight, dependency-tolerant Hyperliquid client.

    Uses raw REST for public info (always available) and lazy-imports
    `hyperliquid` SDK for signed actions so the service still boots when
    the SDK is not yet installed.
    """

    def __init__(
        self,
        private_key: Optional[str] = None,
        testnet: Optional[bool] = None,
    ) -> None:
        self.private_key = private_key or os.getenv("HYPERLIQUID_PRIVATE_KEY", "")
        if testnet is None:
            testnet = os.getenv("HYPERLIQUID_TESTNET", "false").lower() == "true"
        self.testnet = testnet
        self.base_url = TESTNET_URL if testnet else MAINNET_URL
        self._exchange = None  # lazy SDK Exchange
        self._info = None      # lazy SDK Info

    # ── status ──────────────────────────────────────────────────────────
    def status(self) -> dict[str, Any]:
        return {
            "connector": "hyperliquid",
            "network": "testnet" if self.testnet else "mainnet",
            "base_url": self.base_url,
            "wallet_configured": bool(self.private_key),
            "wallet_address": self._wallet_address() if self.private_key else None,
        }

    def _wallet_address(self) -> Optional[str]:
        try:
            from eth_account import Account  # type: ignore

            return Account.from_key(self.private_key).address
        except Exception as exc:  # pragma: no cover
            log.warning("hyperliquid: cannot derive wallet address: %s", exc)
            return None

    # ── public REST helpers (no key) ────────────────────────────────────
    async def _post_info(self, body: dict[str, Any]) -> Any:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(f"{self.base_url}/info", json=body)
            r.raise_for_status()
            return r.json()

    async def get_markets(self) -> list[dict[str, Any]]:
        """Return universe + current mark prices for all perpetual markets."""
        meta = await self._post_info({"type": "metaAndAssetCtxs"})
        # meta = [universe, ctx_array_in_same_order]
        if not isinstance(meta, list) or len(meta) < 2:
            return []
        universe = meta[0].get("universe", [])
        ctxs = meta[1]
        markets: list[dict[str, Any]] = []
        for asset, ctx in zip(universe, ctxs):
            markets.append(
                {
                    "name": asset.get("name"),
                    "sz_decimals": asset.get("szDecimals"),
                    "max_leverage": asset.get("maxLeverage"),
                    "mark_price": _to_float(ctx.get("markPx")),
                    "oracle_price": _to_float(ctx.get("oraclePx")),
                    "mid_price": _to_float(ctx.get("midPx")),
                    "open_interest": _to_float(ctx.get("openInterest")),
                    "funding": _to_float(ctx.get("funding")),
                    "day_volume": _to_float(ctx.get("dayNtlVlm")),
                }
            )
        return markets

    async def get_l2_book(self, coin: str) -> dict[str, Any]:
        return await self._post_info({"type": "l2Book", "coin": coin.upper()})

    async def get_all_mids(self) -> dict[str, str]:
        return await self._post_info({"type": "allMids"})

    async def get_user_state(self, address: Optional[str] = None) -> dict[str, Any]:
        addr = address or self._wallet_address()
        if not addr:
            raise ValueError("address required (no platform wallet configured)")
        return await self._post_info({"type": "clearinghouseState", "user": addr})

    async def get_positions(self, address: Optional[str] = None) -> list[dict[str, Any]]:
        state = await self.get_user_state(address)
        positions: list[dict[str, Any]] = []
        for p in state.get("assetPositions", []):
            pos = p.get("position", {})
            positions.append(
                {
                    "coin": pos.get("coin"),
                    "size": _to_float(pos.get("szi")),
                    "entry_price": _to_float(pos.get("entryPx")),
                    "unrealized_pnl": _to_float(pos.get("unrealizedPnl")),
                    "leverage": pos.get("leverage", {}).get("value"),
                    "liquidation_price": _to_float(pos.get("liquidationPx")),
                    "margin_used": _to_float(pos.get("marginUsed")),
                }
            )
        return positions

    # ── signed trade path (lazy SDK) ────────────────────────────────────
    def _sdk(self):
        if self._exchange is not None:
            return self._exchange
        if not self.private_key:
            raise RuntimeError("HYPERLIQUID_PRIVATE_KEY not configured")
        try:
            from eth_account import Account  # type: ignore
            from hyperliquid.exchange import Exchange  # type: ignore
            from hyperliquid.utils import constants  # type: ignore
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "hyperliquid-python-sdk not installed; "
                "run `pip install hyperliquid-python-sdk eth-account`"
            ) from exc
        wallet = Account.from_key(self.private_key)
        url = constants.TESTNET_API_URL if self.testnet else constants.MAINNET_API_URL
        self._exchange = Exchange(wallet, url)
        return self._exchange

    def place_order(
        self,
        coin: str,
        is_buy: bool,
        sz: float,
        limit_px: Optional[float] = None,
        reduce_only: bool = False,
        order_type: str = "market",
    ) -> dict[str, Any]:
        """Place an order on Hyperliquid.

        Market orders are emulated as IoC limit orders 1% past the mid
        (per Hyperliquid SDK convention). Limit orders use `Gtc`.
        """
        ex = self._sdk()
        if order_type == "market":
            # SDK helper accepts None price for market_open style
            return ex.market_open(coin.upper(), is_buy, sz)  # type: ignore[no-any-return]
        if limit_px is None:
            raise ValueError("limit order requires limit_px")
        return ex.order(  # type: ignore[no-any-return]
            coin.upper(),
            is_buy,
            sz,
            float(limit_px),
            {"limit": {"tif": "Gtc"}},
            reduce_only=reduce_only,
        )

    def cancel_order(self, coin: str, oid: int) -> dict[str, Any]:
        return self._sdk().cancel(coin.upper(), oid)  # type: ignore[no-any-return]


def _to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
