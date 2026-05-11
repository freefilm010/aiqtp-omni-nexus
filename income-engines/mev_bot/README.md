# MEV / Sandwich Bot — Arbitrum

Detects large DEX swap transactions on **Uniswap V3**, **SushiSwap**, and **Camelot** (Arbitrum One) and constructs front-run + back-run bundles around them.

## Realistic disclosure

Arbitrum does **not** have a public mempool the way Ethereum L1 does — transactions go straight to the sequencer (Nitro), which orders them. To profitably front-run on Arbitrum today you need one of:

- A **private sequencer feed** (Offchain Labs `Timeboost` auctioned by Conduit / Caldera).
- A **subsidised orderflow source** such as Fastlane or MEV-Share-Arbitrum.
- A **co-located searcher relay** like flashbots-arb (closed beta).

Without one of those, the bot will see transactions only after they land in a block. It will still capture *back-run* opportunities (CEX-DEX arb, oracle update arb, JIT liquidity), but full sandwiches require pending-tx visibility.

Set `ARBITRUM_WS` to a WSS URL that does support `eth_subscribe("newPendingTransactions", true)`. Both Alchemy "Enhanced" and QuickNode "Sequencer Add-on" plans do.

## How it works

`sandwich.py`:

1. Subscribes to `newPendingTransactions` with full-tx payload over WSS.
2. Decodes calls to the three routers using the function selectors and ABI shapes.
3. Estimates the victim's USD trade size and the price impact it will cause on the relevant pool.
4. If `front_size * impact_bps * 2 - gas > MIN_PROFIT_USD`, builds a two-tx burst:
   - Front-run: `SandwichExecutor.v2/v3(...)` swapping in the same direction with high priority fee.
   - Back-run: `SandwichExecutor.v2/v3(...)` reversing the position.
5. If `FLASHBOTS_RELAY` is set, posts the signed bundle to that relay (one-shot inclusion). Otherwise sends both txs back-to-back from the same nonce.

`SandwichExecutor.sol` is a minimal contract that performs both swaps so that funds never linger in an EOA between blocks.

## Environment

| Var | Description |
|-----|-------------|
| `ARBITRUM_RPC` / `ARBITRUM_WS` | HTTP + WSS endpoints. WSS **must** stream pending txs. |
| `PRIVATE_KEY` | Owner of `SandwichExecutor`. Hold WETH + USDC inventory. |
| `MEV_MIN_VICTIM_USD` | Minimum victim size to consider (default `10000`). |
| `MEV_MAX_SIZE_USD` | Cap on each front-run swap (default `5000`). |
| `MEV_ETH_PX_USD` | Fallback ETH price used in size estimation (default `3500`). |
| `FLASHBOTS_RELAY` | Optional Conduit/Flashbots-Arb relay URL. |
| `DRY_RUN` | Default `true` — set to `false` only after live observation. |

## Deployment

```bash
forge create SandwichExecutor.sol:SandwichExecutor \
  --rpc-url $ARBITRUM_RPC --private-key $PRIVATE_KEY
```

Send a small inventory (e.g. 0.1 WETH + 200 USDC) to the deployed address.

## Running

```bash
cd income-engines
DRY_RUN=true python -m mev_bot.sandwich
```
