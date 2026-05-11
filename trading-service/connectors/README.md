# AIQTP Trading Service — Exchange Connectors

This package adds **wallet-/keyless-first** exchange and market-data
connectivity to the FastAPI trading service. All connectors are exposed
through routes mounted under the `/api` prefix and are reported by the
service `/health` endpoint.

## Connectors

| Connector | Auth | Endpoints |
|-----------|------|-----------|
| **Hyperliquid** (perp DEX) | Ethereum private key (`HYPERLIQUID_PRIVATE_KEY`) | `/api/hyperliquid/markets`, `/api/hyperliquid/positions`, `/api/hyperliquid/orderbook`, `/api/hyperliquid/order` |
| **Jupiter** (Solana DEX agg.) | Solana keypair (`SOLANA_PRIVATE_KEY`) for swaps; quotes need no auth | `/api/jupiter/quote`, `/api/jupiter/tokens`, `/api/jupiter/swap` |
| **1inch** (multi-chain DEX agg.) | Free API key (`ONEINCH_API_KEY`) for swap; quotes attempt public host | `/api/1inch/quote`, `/api/1inch/swap` |
| **CoinGecko** (prices) | None for free tier | `/api/prices/live`, `/api/prices/history`, `/api/prices/markets` |
| **DeFi Llama** (TVL / yields) | None | `/api/defi/tvl`, `/api/defi/yields` |
| **CCXT** (KuCoin, MEXC, Gate.io, …) | Optional `{EXCHANGE}_API_KEY`/`_SECRET`/`_PASSWORD`; public ticker is keyless | `/api/ccxt/{exchange}/ticker`, `/orderbook`, `/ohlcv`, `/markets` |

## Generating platform wallets

A one-shot script generates an Ethereum wallet (for Hyperliquid) and a
Solana keypair (for Jupiter):

```bash
cd trading-service
python scripts/generate_wallets.py
```

Set the printed `HYPERLIQUID_PRIVATE_KEY` (Ethereum hex) and
`SOLANA_PRIVATE_KEY` (base58) as Render env vars.

## Strategies

Bundled algorithm modules (mounted under `/api/strategy`):

- `POST /api/strategy/grid` — arithmetic/geometric grid plan
- `POST /api/strategy/dca` — DCA schedule (fixed or value-averaging)
- `POST /api/strategy/dca/backtest` — DCA backtest against a price array
- `POST /api/strategy/momentum` — EMA crossover + RSI signal
- `POST /api/strategy/arbitrage/scan` — cross-exchange spread scanner

These are inspired by Hummingbot's PMM/grid bots, Freqtrade's
`SampleStrategy`, and Jesse's Donchian breakout reference.

## Smoke tests

Boot the service locally and run:

```bash
PORT=8002 uvicorn main:app --reload
curl localhost:8002/health
curl localhost:8002/api/hyperliquid/markets | jq '.[0]'
curl localhost:8002/api/jupiter/quote?inputMint=...&outputMint=...&amount=1000000000
curl 'localhost:8002/api/ccxt/kucoin/ticker?symbol=BTC/USDT'
```
