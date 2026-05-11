# Liquidation Bot — Aave V3 (Arbitrum)

A zero-capital liquidator that monitors every borrower on **Aave V3 Arbitrum**, computes live health factors, and atomically liquidates undercollateralized positions using a **flash loan** so no inventory is required.

## How it works

1. **Borrower discovery** — backfills `Borrow` event logs from the Aave V3 Pool (`0x794a61358D6845594F94dc1DB02A252b5b4814aD`) over the last `LIQ_SCAN_LOOKBACK` blocks (default 200 000 ≈ 11 days on Arbitrum).
2. **Health monitoring** — every `LIQ_CHECK_INTERVAL` seconds calls `getUserAccountData(user)` for every tracked borrower and keeps the ones with `healthFactor < 1e18`.
3. **Profit estimation** — applies Aave V3 close-factor rules (50 % normally, 100 % when HF < 0.95) plus the median 5 % liquidation bonus, subtracts the 0.05 % flash-loan premium and an estimated DEX slippage.
4. **Atomic execution** — broadcasts a call to a deployed `FlashLiquidator.sol` contract. That contract:
   1. flash-borrows the debt asset from Aave (or Balancer for 0 fee — see notes),
   2. calls `liquidationCall(...)` on the Pool,
   3. swaps the seized collateral back to the debt asset on Uniswap V3,
   4. repays the flash loan and forwards the spread to the bot owner.

## Files

| File | Purpose |
|------|---------|
| `liquidator.py` | Python daemon: discovery, health scan, profit calc, tx send |
| `FlashLiquidator.sol` | On-chain receiver that performs the flash-loan liquidation |

## Deployment

1. **Compile and deploy** `FlashLiquidator.sol` once on Arbitrum One. Constructor arguments:

   - `_pool = 0x794a61358D6845594F94dc1DB02A252b5b4814aD` (Aave V3 Pool)
   - `_router = 0xE592427A0AEce92De3Edee1F18E0157C05861564` (Uniswap V3 SwapRouter)

   You can use Foundry:

   ```bash
   forge create FlashLiquidator.sol:FlashLiquidator \
     --rpc-url $ARBITRUM_RPC --private-key $PRIVATE_KEY \
     --constructor-args 0x794a61358D6845594F94dc1DB02A252b5b4814aD \
                        0xE592427A0AEce92De3Edee1F18E0157C05861564
   ```

2. Export the resulting address as `LIQUIDATOR_CONTRACT`.

3. Run the bot:

   ```bash
   cd income-engines
   pip install -r requirements.txt
   DRY_RUN=true python -m liquidation_bot.liquidator
   ```

4. Once you have observed sane logs, flip `DRY_RUN=false` to enable live transactions.

## Environment variables

| Var | Default | Notes |
|-----|---------|-------|
| `ARBITRUM_RPC` | `https://arb1.arbitrum.io/rpc` | Use a paid endpoint (Alchemy, QuickNode, Chainstack) for production – the public RPC will rate-limit. |
| `PRIVATE_KEY` | — | EOA that owns `FlashLiquidator` and pays gas. Hold ~0.05 ETH on Arbitrum. |
| `LIQUIDATOR_CONTRACT` | — | Address of your deployed `FlashLiquidator`. If unset the bot runs in observation mode. |
| `DRY_RUN` | `true` | When `true`, never broadcasts. |
| `MIN_PROFIT_USD` | `5` | Trades below this estimated profit are ignored. |
| `LIQ_SCAN_LOOKBACK` | `200000` | Block range for initial borrower discovery. |
| `LIQ_CHECK_INTERVAL` | `20` | Seconds between health-factor sweeps. |

## Realistic expectations

Aave liquidations on Arbitrum are highly competitive; firms run dedicated nodes co-located with the sequencer. You will compete on:

- **Latency** — using a paid RPC with mempool access (Alchemy "subscribed" tier, Chainstack debug) lifts catch rates dramatically.
- **Gas pricing** — Arbitrum priority fees are tiny (sub-gwei) but you must always be the first inclusion.
- **Coverage breadth** — extend `find_liquidatable` to support every collateral/debt pair, not just USDC↔WETH.

For users with no infra advantage, expect occasional small wins on long-tail collateral pairs that the major bots ignore.
