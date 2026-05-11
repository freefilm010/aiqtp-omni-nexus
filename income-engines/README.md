# AIQTP Income Engines

A unified suite of automated revenue systems for the AIQTP platform
(`https://www.aiqtp.com`). Every engine is a standalone Python module
that can be run on its own or supervised together by the orchestrator.

| # | Engine | Capital required | Primary chain | Module |
|---|--------|------------------|---------------|--------|
| 1 | MEV / sandwich bot | inventory (≥ 0.1 ETH) | Arbitrum | `mev_bot.sandwich` |
| 2 | DeFi yield optimizer | rotated `MAX_POSITION_USD` | multi-chain | `yield_optimizer.optimizer` |
| 3 | Aave V3 liquidation bot | **0** (flash loan) | Arbitrum | `liquidation_bot.liquidator` |
| 4 | Arbitrage scanner + executor | **0** (flash loan) | Arbitrum / OP / Base | `arbitrage.scanner` |
| 5 | Signal subscription service | 0 | n/a | `signal_service.bot` |
| 6 | Airdrop farmer | ≤ `$25/week` | multi-chain | `airdrop_farmer.farmer` |
| 7 | Referral / affiliate automation | 0 | n/a | `referral_automation.affiliates` |

The orchestrator (`orchestrator.py`) runs them all, aggregates PnL, and
exposes a `/status` HTTP endpoint for dashboards.

## Quick start

```bash
cd income-engines
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # then edit secrets

# Try advisory mode for everything:
python orchestrator.py

# Or run just one engine:
python -m yield_optimizer.optimizer
python -m arbitrage.scanner
python -m signal_service.bot
```

By default `DRY_RUN=true`, so **no transaction will ever be broadcast**
even if `PRIVATE_KEY` is set. Flip it to `false` only after observing
sane simulation output for at least 24 hours.

## Architecture

```
income-engines/
├── orchestrator.py            # multi-threaded supervisor + /status HTTP
├── common/                    # shared config, logger, chain helpers, PnL ledger
├── abis/                      # JSON ABIs for ERC20, Uniswap V3, Aave V3, ...
├── mev_bot/                   # 1. Sandwich + back-run
│   ├── sandwich.py
│   └── SandwichExecutor.sol
├── yield_optimizer/           # 2. DeFi Llama-powered ranker + vault adapters
│   ├── optimizer.py
│   └── vaults.py
├── liquidation_bot/           # 3. Aave V3 flash-loan liquidator
│   ├── liquidator.py
│   └── FlashLiquidator.sol
├── arbitrage/                 # 4. Cross-DEX + cross-chain
│   ├── scanner.py
│   └── ArbExecutor.sol
├── signal_service/            # 5. Telegram + Stripe + X
│   ├── bot.py
│   ├── strategies.py
│   └── stripe_webhook.py
├── airdrop_farmer/            # 6. Eligibility tracker + policy engine
│   ├── farmer.py
│   └── policies.json
├── referral_automation/       # 7. Affiliate landing + commission ingest
│   ├── affiliates.py
│   └── landing.html (generated)
└── logs/                      # rotating logs + pnl_ledger.jsonl
```

Each engine writes events to `logs/pnl_ledger.jsonl` via the shared
`common.pnl.record()` helper. The orchestrator (and `--once`) reads the
ledger to print combined PnL.

## Wallets

| Network | Address |
|---------|---------|
| Ethereum / Arbitrum / Optimism / Base | `0xf77Ebc11C2bEe9e3ecefC13CB58CA261f6694c4F` |
| Solana | `4ic7WGkXYPQm5xkcuCDveDDRuKDBucMTKkk9b8TEZtuh` |

These are read from `ETH_WALLET` / `SOL_WALLET` and can be overridden in
`.env` for testing.

## Honest expectations

| Engine | Realistic monthly P&L from a cold start | Notes |
|--------|----------------------------------------|-------|
| MEV / sandwich | $0–$200 without a private sequencer feed | Competitive vs co-located searchers; profitability requires Timeboost/Conduit-style relay access. |
| Liquidation | $50–$500 | Long-tail collateral pairs are still under-served. Cluster around Arbitrum stables. |
| Arbitrage | $20–$300 | Stablecoin-only intra-chain. Cross-chain capture needs inventory + Across bridge integration. |
| Yield optimizer | 5–15 % APY uplift on rotated capital | Advisory works out-of-the-box, auto-deposit needs per-protocol adapters. |
| Signal service | $200–$5 000 / mo recurring | Depends entirely on marketing/funnel — the plumbing is here. |
| Airdrop farmer | $0–$1 000 / mo (lumpy) | Highly variable; sybil-resistant farms favour single, well-aged wallets. |
| Referral / affiliate | $50–$2 000 / mo | Depends on landing-page traffic. Built to integrate with the existing AIQTP site. |

The numbers compound — the orchestrator's PnL dashboard makes it
obvious which lever to push next.

## Production deployment

A `Dockerfile` and `systemd` unit are not included by default; add them
based on your deployment target (Vercel + Render is what AIQTP already
uses). Recommended layout:

- `signal_service` + `stripe_webhook` on Render or Fly.io (HTTPS).
- `yield_optimizer`, `airdrop_farmer`, `referral_automation` on a single
  small instance (these are I/O-bound and idle most of the time).
- `mev_bot`, `liquidation_bot`, `arbitrage` on a co-located node with
  paid RPC access (Alchemy/QuickNode/Chainstack debug tier).

## Safety

- `DRY_RUN=true` blocks every signing path.
- `MAX_GAS_GWEI` caps gas before sending.
- `MIN_PROFIT_USD` filters every opportunity.
- The PnL ledger is **append-only**; truncate it manually after audits.
- Private keys are never logged, never written to disk by this code.

Audit the Solidity executors (`FlashLiquidator.sol`, `SandwichExecutor.sol`,
`ArbExecutor.sol`) on testnet before mainnet deployment.
