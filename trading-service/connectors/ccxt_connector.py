"""
Generic CCXT connector — focused on no-KYC exchanges (KuCoin, MEXC, Gate.io)
but works for any of CCXT's 100+ exchanges.

Public endpoints (ticker, OHLCV, order book) require no API key.
Private endpoints (balance, order) require per-exchange env vars:
  {EXCHANGE}_API_KEY, {EXCHANGE}_SECRET, optionally {EXCHANGE}_PASSWORD.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

log = logging.getLogger("ccxt-connector")

SUPPORTED_NO_KYC = {"kucoin", "mexc", "gateio", "bitget", "bingx", "phemex"}


class CCXTConnector:
    """Thin async wrapper around `ccxt.async_support`."""

    def __init__(self) -> None:
        self._clients: dict[str, Any] = {}
        self._import_error: Optional[str] = None
        try:
            import ccxt.async_support as ccxt  # type: ignore

            self._ccxt = ccxt
        except ImportError as exc:  # pragma: no cover
            self._ccxt = None
            self._import_error = str(exc)
            log.warning("ccxt not installed: %s", exc)

    def status(self) -> dict[str, Any]:
        if self._ccxt is None:
            return {"connector": "ccxt", "available": False, "error": self._import_error}
        return {
            "connector": "ccxt",
            "available": True,
            "version": getattr(self._ccxt, "__version__", "unknown"),
            "supported_no_kyc": sorted(SUPPORTED_NO_KYC),
            "all_exchanges": len(self._ccxt.exchanges),
        }

    def _client(self, exchange: str):
        if self._ccxt is None:
            raise RuntimeError(f"ccxt not installed: {self._import_error}")
        ex_id = exchange.lower().replace(".", "").replace("-", "")
        if ex_id == "gate":
            ex_id = "gateio"
        if ex_id not in self._ccxt.exchanges:
            raise ValueError(f"unsupported exchange: {exchange}")
        if ex_id in self._clients:
            return self._clients[ex_id]
        cls = getattr(self._ccxt, ex_id)
        cfg: dict[str, Any] = {"enableRateLimit": True, "timeout": 15000}
        upper = ex_id.upper()
        api_key = os.getenv(f"{upper}_API_KEY")
        secret = os.getenv(f"{upper}_SECRET") or os.getenv(f"{upper}_SECRET_KEY")
        password = os.getenv(f"{upper}_PASSWORD") or os.getenv(f"{upper}_PASSPHRASE")
        if api_key:
            cfg["apiKey"] = api_key
        if secret:
            cfg["secret"] = secret
        if password:
            cfg["password"] = password
        client = cls(cfg)
        self._clients[ex_id] = client
        return client

    async def ticker(self, exchange: str, symbol: str) -> dict[str, Any]:
        c = self._client(exchange)
        try:
            return await c.fetch_ticker(symbol)
        finally:
            await c.close()

    async def order_book(self, exchange: str, symbol: str, limit: int = 25) -> dict[str, Any]:
        c = self._client(exchange)
        try:
            return await c.fetch_order_book(symbol, limit=limit)
        finally:
            await c.close()

    async def ohlcv(
        self,
        exchange: str,
        symbol: str,
        timeframe: str = "1h",
        limit: int = 100,
    ) -> list[list[float]]:
        c = self._client(exchange)
        try:
            return await c.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
        finally:
            await c.close()

    async def markets(self, exchange: str) -> list[str]:
        c = self._client(exchange)
        try:
            await c.load_markets()
            return list(c.markets.keys())[:500]
        finally:
            await c.close()

    async def balance(self, exchange: str) -> dict[str, Any]:
        c = self._client(exchange)
        try:
            if not c.apiKey:
                raise RuntimeError(
                    f"{exchange.upper()}_API_KEY/SECRET not set for private call"
                )
            return await c.fetch_balance()
        finally:
            await c.close()

    async def create_order(
        self,
        exchange: str,
        symbol: str,
        order_type: str,
        side: str,
        amount: float,
        price: Optional[float] = None,
    ) -> dict[str, Any]:
        c = self._client(exchange)
        try:
            if not c.apiKey:
                raise RuntimeError(
                    f"{exchange.upper()}_API_KEY/SECRET not set for live order"
                )
            return await c.create_order(symbol, order_type, side, amount, price)
        finally:
            await c.close()
