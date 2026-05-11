"""
FastAPI router that exposes the new exchange/data connectors.

Mounted from `main.py` via `app.include_router(connectors_router)`.

All routes are deliberately lightweight: they validate input, call the
appropriate connector, and let exceptions propagate as HTTP 502 with a
detailed message so failures surface clearly in production.
"""

from __future__ import annotations

import functools
import inspect
import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .ccxt_connector import CCXTConnector
from .coingecko_connector import CoinGeckoConnector
from .defillama_connector import DefiLlamaConnector
from .hyperliquid_connector import HyperliquidConnector
from .jupiter_connector import JupiterConnector
from .oneinch_connector import OneInchConnector

log = logging.getLogger("connectors-routes")

router = APIRouter(prefix="/api", tags=["connectors"])

# Module-level singletons (cheap, share httpx clients per call)
hl = HyperliquidConnector()
jup = JupiterConnector()
oi = OneInchConnector()
cg = CoinGeckoConnector()
dl = DefiLlamaConnector()
cx = CCXTConnector()


def _wrap(label: str):
    """Decorator: convert connector exceptions into HTTPException(502).

    Preserves the wrapped function's signature so FastAPI can introspect
    parameter types/defaults correctly.
    """

    def deco(fn):
        if inspect.iscoroutinefunction(fn):
            @functools.wraps(fn)
            async def inner(*args, **kwargs):
                try:
                    return await fn(*args, **kwargs)
                except HTTPException:
                    raise
                except ValueError as exc:
                    raise HTTPException(400, f"{label}: {exc}") from exc
                except RuntimeError as exc:
                    raise HTTPException(503, f"{label}: {exc}") from exc
                except Exception as exc:  # pragma: no cover
                    log.exception("%s failed", label)
                    raise HTTPException(502, f"{label}: {exc}") from exc
            return inner

        @functools.wraps(fn)
        def sync_inner(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except HTTPException:
                raise
            except ValueError as exc:
                raise HTTPException(400, f"{label}: {exc}") from exc
            except RuntimeError as exc:
                raise HTTPException(503, f"{label}: {exc}") from exc
            except Exception as exc:  # pragma: no cover
                log.exception("%s failed", label)
                raise HTTPException(502, f"{label}: {exc}") from exc
        return sync_inner

    return deco


# ── Connectors status (advertised on /health too) ───────────────────────
@router.get("/connectors/status")
def connectors_status() -> dict[str, Any]:
    return {
        "hyperliquid": hl.status(),
        "jupiter": jup.status(),
        "oneinch": oi.status(),
        "coingecko": cg.status(),
        "defillama": dl.status(),
        "ccxt": cx.status(),
    }


# ── Hyperliquid ─────────────────────────────────────────────────────────
@router.get("/hyperliquid/markets")
@_wrap("hyperliquid.markets")
async def hyperliquid_markets() -> list[dict[str, Any]]:
    return await hl.get_markets()


@router.get("/hyperliquid/positions")
@_wrap("hyperliquid.positions")
async def hyperliquid_positions(address: Optional[str] = None) -> list[dict[str, Any]]:
    return await hl.get_positions(address)


@router.get("/hyperliquid/orderbook")
@_wrap("hyperliquid.orderbook")
async def hyperliquid_orderbook(coin: str = Query(..., min_length=1)) -> dict[str, Any]:
    return await hl.get_l2_book(coin)


class HyperliquidOrderIn(BaseModel):
    coin: str
    is_buy: bool
    sz: float = Field(..., gt=0)
    limit_px: Optional[float] = None
    reduce_only: bool = False
    order_type: str = Field("market", pattern="^(market|limit)$")


@router.post("/hyperliquid/order")
@_wrap("hyperliquid.order")
async def hyperliquid_order(body: HyperliquidOrderIn) -> dict[str, Any]:
    # SDK call is synchronous — wrap in a thread to avoid blocking the loop
    import asyncio

    return await asyncio.to_thread(
        hl.place_order,
        body.coin,
        body.is_buy,
        body.sz,
        body.limit_px,
        body.reduce_only,
        body.order_type,
    )


# ── Jupiter ─────────────────────────────────────────────────────────────
@router.get("/jupiter/quote")
@_wrap("jupiter.quote")
async def jupiter_quote(
    inputMint: str,
    outputMint: str,
    amount: int = Query(..., gt=0),
    slippageBps: int = 50,
) -> dict[str, Any]:
    return await jup.get_quote(inputMint, outputMint, amount, slippageBps)


@router.get("/jupiter/tokens")
@_wrap("jupiter.tokens")
async def jupiter_tokens(limit: int = 200) -> list[dict[str, Any]]:
    return await jup.get_tokens(limit)


class JupiterSwapIn(BaseModel):
    inputMint: str
    outputMint: str
    amount: int = Field(..., gt=0)
    slippageBps: int = 50


@router.post("/jupiter/swap")
@_wrap("jupiter.swap")
async def jupiter_swap(body: JupiterSwapIn) -> dict[str, Any]:
    return await jup.execute_swap(
        body.inputMint, body.outputMint, body.amount, body.slippageBps
    )


# ── 1inch ───────────────────────────────────────────────────────────────
@router.get("/1inch/quote")
@_wrap("1inch.quote")
async def oneinch_quote(
    chain: str = "ethereum",
    src: str = Query(..., min_length=1),
    dst: str = Query(..., min_length=1),
    amount: int = Query(..., gt=0),
) -> dict[str, Any]:
    return await oi.get_quote(chain, src, dst, amount)


class OneInchSwapIn(BaseModel):
    chain: str = "ethereum"
    src: str
    dst: str
    amount: int = Field(..., gt=0)
    from_address: str
    slippage: float = 1.0


@router.post("/1inch/swap")
@_wrap("1inch.swap")
async def oneinch_swap(body: OneInchSwapIn) -> dict[str, Any]:
    return await oi.build_swap(
        body.chain, body.src, body.dst, body.amount, body.from_address, body.slippage
    )


# ── CoinGecko ───────────────────────────────────────────────────────────
@router.get("/prices/live")
@_wrap("coingecko.live")
async def prices_live(ids: str = "bitcoin,ethereum,solana", vs: str = "usd") -> dict[str, Any]:
    return await cg.simple_price(ids.split(","), vs.split(","))


@router.get("/prices/history")
@_wrap("coingecko.history")
async def prices_history(coin: str = "bitcoin", days: int = 7, vs: str = "usd") -> dict[str, Any]:
    return await cg.market_chart(coin, vs, days)


@router.get("/prices/markets")
@_wrap("coingecko.markets")
async def prices_markets(per_page: int = 50, page: int = 1, vs: str = "usd") -> Any:
    return await cg.coins_markets(vs, per_page, page)


# ── DeFi Llama ──────────────────────────────────────────────────────────
@router.get("/defi/tvl")
@_wrap("defillama.tvl")
async def defi_tvl(by: str = Query("chains", pattern="^(chains|total|protocols)$")) -> Any:
    if by == "chains":
        return await dl.chains_tvl()
    if by == "total":
        return await dl.total_tvl()
    return await dl.protocols()


@router.get("/defi/yields")
@_wrap("defillama.yields")
async def defi_yields(
    chain: Optional[str] = None,
    min_tvl: float = 1_000_000,
    limit: int = 25,
) -> list[dict[str, Any]]:
    return await dl.top_yields(chain=chain, min_tvl_usd=min_tvl, limit=limit)


# ── CCXT generic ────────────────────────────────────────────────────────
@router.get("/ccxt/{exchange}/ticker")
@_wrap("ccxt.ticker")
async def ccxt_ticker(exchange: str, symbol: str = Query(..., min_length=1)) -> dict[str, Any]:
    return await cx.ticker(exchange, symbol)


@router.get("/ccxt/{exchange}/orderbook")
@_wrap("ccxt.orderbook")
async def ccxt_orderbook(
    exchange: str, symbol: str = Query(..., min_length=1), limit: int = 25
) -> dict[str, Any]:
    return await cx.order_book(exchange, symbol, limit)


@router.get("/ccxt/{exchange}/ohlcv")
@_wrap("ccxt.ohlcv")
async def ccxt_ohlcv(
    exchange: str,
    symbol: str = Query(..., min_length=1),
    timeframe: str = "1h",
    limit: int = 100,
) -> list[list[float]]:
    return await cx.ohlcv(exchange, symbol, timeframe, limit)


@router.get("/ccxt/{exchange}/markets")
@_wrap("ccxt.markets")
async def ccxt_markets(exchange: str) -> list[str]:
    return await cx.markets(exchange)
