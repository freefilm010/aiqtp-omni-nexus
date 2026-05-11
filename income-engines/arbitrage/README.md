# Arbitrage Scanner + Executor

Two-mode arbitrage system for AIQTP:

1. **Intra-chain (Arbitrum)** — compares quotes from Uniswap V3, SushiSwap V2, and Camelot V2 for the same `WETH -> USDC` route. If the spread between the cheap and rich venue covers gas + Balancer Vault flash-loan fee (0 % on Arbitrum) plus `MIN_PROFIT_USD`, the bot fires a flash-loan-backed round-trip through `ArbExecutor.sol`.
2. **Cross-chain (Arbitrum / Optimism / Base)** — runs the same `WETH -> USDC` quote on each chain's Uniswap V3 Quoter, flags dislocations, and writes them to the PnL ledger as advisory signals. Live capture requires a fast-settlement bridge (Across, Stargate v2, Bungee, Hop). See bridging adapter notes below.

## Files

| File | Purpose |
|------|---------|
| `scanner.py` | Continuous quote loop + execution dispatcher |
| `ArbExecutor.sol` | Atomic flash-loan executor using Balancer V2 Vault |

## Why Balancer Vault?

The Balancer V2 Vault on Arbitrum (`0xBA12222222228d8Ba445958a75a0704d566BF2C8`) provides **zero-fee** flash loans. Aave V3 charges 5 bps which is enough to erase most stable-pair arbitrage on L2.

## Deploy `ArbExecutor`

```bash
forge create ArbExecutor.sol:ArbExecutor \
  --rpc-url $ARBITRUM_RPC --private-key $PRIVATE_KEY \
  --constructor-args 0xBA12222222228d8Ba445958a75a0704d566BF2C8
```

Set `ARB_EXECUTOR_CONTRACT` to the resulting address.

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `ARB_POLL` | `2.0` | Quote refresh seconds. |
| `ARB_PROBE_ETH` | `1.0` | Notional size of each quote probe. |
| `MIN_PROFIT_USD` | `5.0` | Minimum spread to act on. |
| `ARB_EXECUTOR_CONTRACT` | — | Address of the deployed `ArbExecutor`. |

## Liquidity warnings (READ BEFORE GOING LIVE)

Camelot V2 on Arbitrum has extremely thin WETH/USDC liquidity (the bulk of Camelot's WETH stable liquidity is on V3 and against `USDC.e`). The scanner will *report* huge apparent spreads on Camelot V2 — these are **not** real arbs, they are stale or empty pools that revert when you try to fill them.

Before enabling execution:

1. Constrain the venue list in `quotes_arbitrum()` to pools with > $500k TVL.
2. Replace the bare `getAmountsOut` quote with a `quoteExactInputSingle` *plus* a slippage check, or call the venue's actual `swap` in `eth_call` mode against a forked state.
3. Add Camelot V3 (Algebra) and Maverick V2 quoters — that is where Arbitrum WETH/USDC arb actually lives in 2025/2026.

## Cross-chain capture (advanced)

To actually execute on the cross-chain advisory signal:

1. Add a bridge adapter using Across V3 (`SpokePool` on each chain) with deposit-and-relay-in-one-block guarantees.
2. Pre-stage USDC inventory on both chains so the trade is "buy-on-chain-A, sell-on-chain-B" in the same minute, settle the inventory imbalance asynchronously through the bridge.
3. Re-balance inventory daily.

This is intentionally **not** wrapped in flash loans because no L2 currently offers atomic cross-chain flash loans.
