"""
MEV WebSocket data streams for the AIQTP Cognitum swarm.

All price/amount values are denominated in USDT or USDC.
BTC-base pairs are filtered out at ingestion time.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from collections.abc import Callable, Awaitable
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

FLASHBOTS_WS_URL = "wss://relay.flashbots.net"
BITQUERY_WS_URL = "wss://streaming.bitquery.io/graphql"

# Pairs must be denominated in USDT or USDC — BTC-base pairs are excluded.
ALLOWED_QUOTE_CURRENCIES: frozenset[str] = frozenset({"USDT", "USDC"})
EXCLUDED_BASE_CURRENCIES: frozenset[str] = frozenset({"BTC", "WBTC", "BTCB"})

BACKOFF_BASE_SECONDS: float = 1.0
BACKOFF_MAX_SECONDS: float = 30.0
MEV_DEDUP_CACHE_SIZE: int = 10_000

# ---------------------------------------------------------------------------
# Shared data model
# ---------------------------------------------------------------------------

BITQUERY_SUBSCRIPTION = """
subscription {
  EVM {
    mempool {
      Transaction {
        Hash
        From
        To
        Value
        Gas
        GasPrice
        Input
      }
    }
    DEXTrades {
      Trade {
        Dex {
          SmartContract
          ProtocolName
        }
        Buy {
          Currency {
            Symbol
          }
          Amount
          PriceInUSD
        }
        Sell {
          Currency {
            Symbol
          }
          Amount
          PriceInUSD
        }
      }
      Transaction {
        Hash
      }
    }
    Liquidations {
      Transaction {
        Hash
      }
      Liquidation {
        Collateral {
          Currency {
            Symbol
          }
          Amount
        }
        Debt {
          Currency {
            Symbol
          }
          Amount
        }
        DebtInUSD
      }
    }
  }
}
"""


@dataclass
class MempoolEvent:
    """Normalised event emitted by MEVDataHub."""

    tx_hash: str
    from_address: str
    to_address: str
    value_eth: float
    gas_price_gwei: float
    input_data: str
    detected_at_ms: int
    source: str                          # "flashbots" | "bitquery" | "private_rpc"
    token_pair: str | None = None        # e.g. "ETH/USDT"
    amount_usdt: float | None = None     # USDT/USDC denominated
    dex_name: str | None = None
    event_type: str = "pending_tx"       # "pending_tx" | "dex_trade" | "liquidation"

    # ------------------------------------------------------------------
    # Filtering helpers
    # ------------------------------------------------------------------

    def is_stablecoin_denominated(self) -> bool:
        """Return True when token_pair is USDT/USDC quoted and not BTC-based."""
        if self.token_pair is None:
            return False
        parts = self.token_pair.upper().replace("-", "/").split("/")
        if len(parts) != 2:
            return False
        base, quote = parts
        if base in EXCLUDED_BASE_CURRENCIES:
            return False
        return quote in ALLOWED_QUOTE_CURRENCIES


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _exponential_backoff(attempt: int) -> float:
    """Return wait seconds with exponential backoff capped at BACKOFF_MAX_SECONDS."""
    return min(BACKOFF_BASE_SECONDS * (2 ** attempt), BACKOFF_MAX_SECONDS)


def _now_ms() -> int:
    return int(time.time() * 1000)


def _filter_stablecoin_pair(pair: str | None) -> bool:
    """Return True when pair should be included (USDT/USDC quote, no BTC base)."""
    if pair is None:
        return True  # non-DEX events are always included
    parts = pair.upper().replace("-", "/").split("/")
    if len(parts) != 2:
        return False
    base, quote = parts
    if base in EXCLUDED_BASE_CURRENCIES:
        return False
    return quote in ALLOWED_QUOTE_CURRENCIES


# ---------------------------------------------------------------------------
# FlashbotsWebSocket
# ---------------------------------------------------------------------------

class FlashbotsWebSocket:
    """
    Connects to the Flashbots relay WebSocket endpoint and streams parsed
    pending-transaction events.

    Subscription: eth_subscribe → newPendingTransactions
    Reconnect strategy: exponential backoff (1 s → 2 s → 4 s … max 30 s)
    """

    def __init__(self, url: str = FLASHBOTS_WS_URL) -> None:
        self.url = url
        self._sub_id: str | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def stream(self, callback: Callable[[dict[str, Any]], Awaitable[None]]) -> None:
        """Connect and yield parsed pending-tx dicts to *callback* indefinitely."""
        attempt = 0
        while True:
            try:
                await self._connect_and_stream(callback)
                attempt = 0  # reset on clean disconnect
            except (ConnectionClosed, WebSocketException, OSError) as exc:
                wait = _exponential_backoff(attempt)
                logger.warning(
                    "FlashbotsWebSocket disconnected (%s). Reconnecting in %.1fs …",
                    exc,
                    wait,
                )
                await asyncio.sleep(wait)
                attempt += 1
            except asyncio.CancelledError:
                logger.info("FlashbotsWebSocket stream cancelled.")
                raise

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _connect_and_stream(
        self, callback: Callable[[dict[str, Any]], Awaitable[None]]
    ) -> None:
        async with websockets.connect(self.url) as ws:
            logger.info("FlashbotsWebSocket connected to %s", self.url)
            await self._subscribe(ws)
            async for raw in ws:
                parsed = self._parse_message(raw)
                if parsed is not None:
                    await callback(parsed)

    async def _subscribe(self, ws: Any) -> None:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_subscribe",
            "params": ["newPendingTransactions"],
        }
        await ws.send(json.dumps(payload))
        # Read the subscription-confirmation frame
        response = json.loads(await ws.recv())
        self._sub_id = response.get("result")
        logger.debug("Flashbots subscription id: %s", self._sub_id)

    def _parse_message(self, raw: str | bytes) -> dict[str, Any] | None:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            return None

        # Subscription acknowledgement — skip
        if "result" in msg and "params" not in msg:
            return None

        params = msg.get("params", {})
        result = params.get("result", {})
        if not result:
            return None

        # result may be just a tx hash string (light mode) or a full tx object
        if isinstance(result, str):
            return {
                "tx_hash": result,
                "from": None,
                "to": None,
                "value_eth": 0.0,
                "gas_price_gwei": 0.0,
                "input_data": "",
                "detected_at_ms": _now_ms(),
            }

        gas_price_raw = result.get("gasPrice", "0x0")
        try:
            gas_price_gwei = int(gas_price_raw, 16) / 1e9
        except (ValueError, TypeError):
            gas_price_gwei = 0.0

        value_raw = result.get("value", "0x0")
        try:
            value_eth = int(value_raw, 16) / 1e18
        except (ValueError, TypeError):
            value_eth = 0.0

        return {
            "tx_hash": result.get("hash", ""),
            "from": result.get("from", ""),
            "to": result.get("to", ""),
            "value_eth": value_eth,
            "gas_price_gwei": gas_price_gwei,
            "input_data": result.get("input", ""),
            "detected_at_ms": _now_ms(),
        }


# ---------------------------------------------------------------------------
# BitqueryWebSocket
# ---------------------------------------------------------------------------

class BitqueryWebSocket:
    """
    GraphQL subscription to the Bitquery streaming API.

    Targets EVM mempool, DEX trades, and liquidation events.
    All token-pair amounts are expressed in USDT/USDC; BTC-base pairs are dropped.
    """

    def __init__(
        self,
        url: str = BITQUERY_WS_URL,
        api_key: str | None = None,
    ) -> None:
        self.url = url
        self.api_key = api_key or os.environ.get("BITQUERY_API_KEY", "")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def stream(self, callback: Callable[[dict[str, Any]], Awaitable[None]]) -> None:
        """Connect and yield normalised Bitquery events to *callback* indefinitely."""
        attempt = 0
        while True:
            try:
                await self._connect_and_stream(callback)
                attempt = 0
            except (ConnectionClosed, WebSocketException, OSError) as exc:
                wait = _exponential_backoff(attempt)
                logger.warning(
                    "BitqueryWebSocket disconnected (%s). Reconnecting in %.1fs …",
                    exc,
                    wait,
                )
                await asyncio.sleep(wait)
                attempt += 1
            except asyncio.CancelledError:
                logger.info("BitqueryWebSocket stream cancelled.")
                raise

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _connect_and_stream(
        self, callback: Callable[[dict[str, Any]], Awaitable[None]]
    ) -> None:
        headers = {"X-API-KEY": self.api_key} if self.api_key else {}
        async with websockets.connect(
            self.url,
            subprotocols=["graphql-ws"],
            additional_headers=headers,
        ) as ws:
            logger.info("BitqueryWebSocket connected to %s", self.url)
            # GraphQL-WS handshake
            await ws.send(json.dumps({"type": "connection_init", "payload": {}}))
            await ws.send(
                json.dumps(
                    {
                        "id": "1",
                        "type": "subscribe",
                        "payload": {"query": BITQUERY_SUBSCRIPTION},
                    }
                )
            )
            async for raw in ws:
                parsed = self._parse_message(raw)
                for event in parsed:
                    if _filter_stablecoin_pair(event.get("token_pair")):
                        await callback(event)

    def _parse_message(self, raw: str | bytes) -> list[dict[str, Any]]:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            return []

        if msg.get("type") not in ("data", "next"):
            return []

        events: list[dict[str, Any]] = []
        data = msg.get("payload", {}).get("data", {})
        evm = data.get("EVM", {})

        # Mempool transactions
        for item in evm.get("mempool", []):
            tx = item.get("Transaction", {})
            events.append(
                {
                    "tx_hash": tx.get("Hash", ""),
                    "from": tx.get("From", ""),
                    "to": tx.get("To", ""),
                    "value_eth": float(tx.get("Value", 0)),
                    "gas_price_gwei": float(tx.get("GasPrice", 0)) / 1e9,
                    "input_data": tx.get("Input", ""),
                    "detected_at_ms": _now_ms(),
                    "token_pair": None,
                    "amount_usdt": None,
                    "dex_name": None,
                    "type": "pending_tx",
                }
            )

        # DEX trades
        for item in evm.get("DEXTrades", []):
            trade = item.get("Trade", {})
            tx = item.get("Transaction", {})
            buy = trade.get("Buy", {})
            sell = trade.get("Sell", {})
            buy_sym = buy.get("Currency", {}).get("Symbol", "")
            sell_sym = sell.get("Currency", {}).get("Symbol", "")

            # Determine pair with stablecoin as quote where possible
            if sell_sym.upper() in ALLOWED_QUOTE_CURRENCIES:
                pair = f"{buy_sym}/{sell_sym}".upper()
                amount_usdt = float(sell.get("Amount", 0))
            elif buy_sym.upper() in ALLOWED_QUOTE_CURRENCIES:
                pair = f"{sell_sym}/{buy_sym}".upper()
                amount_usdt = float(buy.get("Amount", 0))
            else:
                # Use USD price as proxy for USDT denomination
                pair = f"{buy_sym}/{sell_sym}".upper()
                amount_usdt = float(buy.get("PriceInUSD", 0)) * float(buy.get("Amount", 0))

            dex = trade.get("Dex", {}).get("ProtocolName", "unknown")
            events.append(
                {
                    "tx_hash": tx.get("Hash", ""),
                    "from": "",
                    "to": trade.get("Dex", {}).get("SmartContract", ""),
                    "value_eth": 0.0,
                    "gas_price_gwei": 0.0,
                    "input_data": "",
                    "detected_at_ms": _now_ms(),
                    "token_pair": pair,
                    "amount_usdt": amount_usdt,
                    "dex_name": dex,
                    "type": "dex_trade",
                }
            )

        # Liquidation events
        for item in evm.get("Liquidations", []):
            tx = item.get("Transaction", {})
            liq = item.get("Liquidation", {})
            collateral = liq.get("Collateral", {})
            debt = liq.get("Debt", {})
            coll_sym = collateral.get("Currency", {}).get("Symbol", "")
            debt_sym = debt.get("Currency", {}).get("Symbol", "")
            pair = f"{coll_sym}/{debt_sym}".upper() if coll_sym and debt_sym else None
            events.append(
                {
                    "tx_hash": tx.get("Hash", ""),
                    "from": "",
                    "to": "",
                    "value_eth": 0.0,
                    "gas_price_gwei": 0.0,
                    "input_data": "",
                    "detected_at_ms": _now_ms(),
                    "token_pair": pair,
                    "amount_usdt": float(liq.get("DebtInUSD", 0)),
                    "dex_name": None,
                    "type": "liquidation",
                }
            )

        return events


# ---------------------------------------------------------------------------
# PrivateRPCStream
# ---------------------------------------------------------------------------

class PrivateRPCStream:
    """
    Generic WebSocket client for private RPC endpoints (Alchemy / Infura premium).

    Env vars consulted (first non-empty wins):
        ALCHEMY_WS_URL
        INFURA_WS_URL

    Subscribes to both newPendingTransactions and logs for well-known DEX routers.
    """

    UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    SUSHISWAP_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"

    def __init__(self, url: str | None = None) -> None:
        self.url = (
            url
            or os.environ.get("ALCHEMY_WS_URL")
            or os.environ.get("INFURA_WS_URL")
            or ""
        )
        if not self.url:
            logger.warning(
                "PrivateRPCStream: no URL configured. "
                "Set ALCHEMY_WS_URL or INFURA_WS_URL."
            )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def stream(self, callback: Callable[[dict[str, Any]], Awaitable[None]]) -> None:
        """Connect and stream pending-tx and DEX log events to *callback*."""
        if not self.url:
            logger.error("PrivateRPCStream has no URL — stream disabled.")
            return

        attempt = 0
        while True:
            try:
                await self._connect_and_stream(callback)
                attempt = 0
            except (ConnectionClosed, WebSocketException, OSError) as exc:
                wait = _exponential_backoff(attempt)
                logger.warning(
                    "PrivateRPCStream disconnected (%s). Reconnecting in %.1fs …",
                    exc,
                    wait,
                )
                await asyncio.sleep(wait)
                attempt += 1
            except asyncio.CancelledError:
                logger.info("PrivateRPCStream cancelled.")
                raise

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _connect_and_stream(
        self, callback: Callable[[dict[str, Any]], Awaitable[None]]
    ) -> None:
        async with websockets.connect(self.url) as ws:
            logger.info("PrivateRPCStream connected to %s", self.url)
            await self._subscribe_pending(ws)
            await self._subscribe_logs(ws)
            async for raw in ws:
                parsed = self._parse_message(raw)
                if parsed is not None:
                    await callback(parsed)

    async def _subscribe_pending(self, ws: Any) -> None:
        await ws.send(
            json.dumps(
                {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "eth_subscribe",
                    "params": ["newPendingTransactions"],
                }
            )
        )

    async def _subscribe_logs(self, ws: Any) -> None:
        await ws.send(
            json.dumps(
                {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "eth_subscribe",
                    "params": [
                        "logs",
                        {
                            "address": [
                                self.UNISWAP_V3_ROUTER,
                                self.SUSHISWAP_ROUTER,
                            ]
                        },
                    ],
                }
            )
        )

    def _parse_message(self, raw: str | bytes) -> dict[str, Any] | None:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            return None

        if "result" in msg and "params" not in msg:
            return None  # subscription confirmation

        params = msg.get("params", {})
        result = params.get("result", {})
        if not result:
            return None

        if isinstance(result, str):
            return {
                "tx_hash": result,
                "from": None,
                "to": None,
                "value_eth": 0.0,
                "gas_price_gwei": 0.0,
                "input_data": "",
                "detected_at_ms": _now_ms(),
                "type": "pending_tx",
            }

        # Log event
        if "topics" in result:
            return {
                "tx_hash": result.get("transactionHash", ""),
                "from": None,
                "to": result.get("address", ""),
                "value_eth": 0.0,
                "gas_price_gwei": 0.0,
                "input_data": result.get("data", ""),
                "detected_at_ms": _now_ms(),
                "type": "dex_log",
            }

        return None


# ---------------------------------------------------------------------------
# MEVDataHub
# ---------------------------------------------------------------------------

class MEVDataHub:
    """
    Aggregates FlashbotsWebSocket, BitqueryWebSocket, and PrivateRPCStream.

    - Runs all three streams in parallel via asyncio.gather.
    - Deduplicates events by tx_hash using an LRU cache (10 k entries).
    - Emits normalised MempoolEvent objects to the registered callback.
    """

    def __init__(
        self,
        flashbots_url: str = FLASHBOTS_WS_URL,
        bitquery_url: str = BITQUERY_WS_URL,
        private_rpc_url: str | None = None,
        bitquery_api_key: str | None = None,
    ) -> None:
        self._flashbots = FlashbotsWebSocket(url=flashbots_url)
        self._bitquery = BitqueryWebSocket(url=bitquery_url, api_key=bitquery_api_key)
        self._private_rpc = PrivateRPCStream(url=private_rpc_url)
        self._seen: dict[str, bool] = {}  # LRU managed manually below

    # ------------------------------------------------------------------
    # Deduplication (simple bounded dict acting as LRU)
    # ------------------------------------------------------------------

    def _is_duplicate(self, tx_hash: str) -> bool:
        if not tx_hash:
            return False
        if tx_hash in self._seen:
            return True
        if len(self._seen) >= MEV_DEDUP_CACHE_SIZE:
            # Evict oldest entry (insertion-order dict in Python 3.7+)
            oldest = next(iter(self._seen))
            del self._seen[oldest]
        self._seen[tx_hash] = True
        return False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def start_all(
        self, callback: Callable[[MempoolEvent], Awaitable[None]]
    ) -> None:
        """Start all three WebSocket streams in parallel; call callback for each new event."""

        async def _wrap_flashbots(raw: dict[str, Any]) -> None:
            tx_hash = raw.get("tx_hash", "")
            if self._is_duplicate(tx_hash):
                return
            event = MempoolEvent(
                tx_hash=tx_hash,
                from_address=raw.get("from") or "",
                to_address=raw.get("to") or "",
                value_eth=raw.get("value_eth", 0.0),
                gas_price_gwei=raw.get("gas_price_gwei", 0.0),
                input_data=raw.get("input_data", ""),
                detected_at_ms=raw.get("detected_at_ms", _now_ms()),
                source="flashbots",
            )
            await callback(event)

        async def _wrap_bitquery(raw: dict[str, Any]) -> None:
            tx_hash = raw.get("tx_hash", "")
            if self._is_duplicate(tx_hash):
                return
            event = MempoolEvent(
                tx_hash=tx_hash,
                from_address=raw.get("from") or "",
                to_address=raw.get("to") or "",
                value_eth=raw.get("value_eth", 0.0),
                gas_price_gwei=raw.get("gas_price_gwei", 0.0),
                input_data=raw.get("input_data", ""),
                detected_at_ms=raw.get("detected_at_ms", _now_ms()),
                source="bitquery",
                token_pair=raw.get("token_pair"),
                amount_usdt=raw.get("amount_usdt"),
                dex_name=raw.get("dex_name"),
                event_type=raw.get("type", "pending_tx"),
            )
            await callback(event)

        async def _wrap_private_rpc(raw: dict[str, Any]) -> None:
            tx_hash = raw.get("tx_hash", "")
            if self._is_duplicate(tx_hash):
                return
            event = MempoolEvent(
                tx_hash=tx_hash,
                from_address=raw.get("from") or "",
                to_address=raw.get("to") or "",
                value_eth=raw.get("value_eth", 0.0),
                gas_price_gwei=raw.get("gas_price_gwei", 0.0),
                input_data=raw.get("input_data", ""),
                detected_at_ms=raw.get("detected_at_ms", _now_ms()),
                source="private_rpc",
                event_type=raw.get("type", "pending_tx"),
            )
            await callback(event)

        logger.info("MEVDataHub: starting all streams …")
        await asyncio.gather(
            self._flashbots.stream(_wrap_flashbots),
            self._bitquery.stream(_wrap_bitquery),
            self._private_rpc.stream(_wrap_private_rpc),
            return_exceptions=False,
        )
