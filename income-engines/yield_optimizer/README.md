# DeFi Yield Optimizer

Continuously ranks the best stablecoin yield opportunities across Pendle, Aave V3, GMX V2, Hyperliquid vaults, Curve, Convex, Balancer, Compound V3 and Ethena, using the live [DeFi Llama Yields API](https://yields.llama.fi/pools).

## What it does

1. Fetches every pool from DeFi Llama every `YIELD_REFRESH` seconds (default 15 min).
2. Filters by:
   - Protocol whitelist (`YIELD_PROTOCOLS`)
   - Chain whitelist (`YIELD_CHAINS`)
   - TVL ≥ `YIELD_MIN_TVL` (default $1 M)
   - APY ≥ `YIELD_MIN_APY` (default 5 %)
   - IL-risk = no / low
   - Stablecoin pair detection
3. Writes `logs/yield_recommendations.json` with the top-N pools sorted by APY.
4. Logs a daily uplift estimate to the shared PnL ledger.

## Files

| File | Purpose |
|------|---------|
| `optimizer.py` | API fetch, filtering, ranking, recommendation writer |
| `vaults.py` | Per-protocol deposit/withdraw/claim adapter scaffold |

## Configuration

| Variable | Default | Notes |
|----------|---------|-------|
| `YIELD_PROTOCOLS` | `pendle,aave-v3,gmx-v2,hyperliquid,...` | Comma-separated DeFi Llama project slugs. |
| `YIELD_CHAINS` | `arbitrum,ethereum,base,optimism,hyperliquid` | Comma-separated chain names. |
| `YIELD_MIN_TVL` | `1000000` | Skip thin pools. |
| `YIELD_MIN_APY` | `5.0` | Percent. |
| `YIELD_TOP_N` | `20` | How many pools to keep in the recs file. |
| `YIELD_REFRESH` | `900` | Refresh interval seconds. |
| `MAX_POSITION_USD` | `1000` | Used for uplift estimation. |

## Running

```bash
cd income-engines
python -m yield_optimizer.optimizer
```

## Going live (auto-deposit)

`vaults.py` contains adapter stubs for each protocol. To actually move capital:

1. Implement `deposit/withdraw/claim` for the protocols you care about using the official routers (Aave `Pool.supply`, Pendle `Router.swapExactTokenForPt`, Compound V3 `Comet.supply`, etc.).
2. Add a rebalance loop that compares the currently-held pool's APY to `top[0].apy` and rotates if `(new_apy - old_apy) * stake > rotation_gas_cost * 5`.
3. Run with `DRY_RUN=false`.
