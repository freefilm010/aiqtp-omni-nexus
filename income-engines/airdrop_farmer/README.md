# Airdrop Farmer

Tracks the most likely future airdrops in the Arbitrum / Base / zkSync / restaking / modular-rollup ecosystems and keeps the AIQTP wallet `0xf77Ebc11C2bEe9e3ecefC13CB58CA261f6694c4F` qualified for each one.

## Coverage

The hand-curated registry in `farmer.py:PROJECTS` covers:

| Cluster | Projects |
|---------|----------|
| Bridges / messaging | LayerZero, Wormhole |
| Rollups | zkSync Era, Scroll, Linea, Mode, Base, Berachain, Monad, MegaETH |
| Restaking | EigenLayer EigenDA, Symbiotic, Karak |
| Perp DEX | Hyperliquid points |

PRs are welcome — add `Project(name, chain, status, eligibility_url, estimated_usd, actions)`.

## What it does

1. Every 6 hours (configurable via `AIRDROP_REFRESH`) it polls the official eligibility endpoint for each project where one exists:
   - LayerZero foundation API (`/api/proof/{wallet}`)
   - zkNation (`/eligibility?address=`)
   - Scroll claim API
   - Mode airdrop checker
   - Hyperliquid leaderboard API
2. For projects with no public endpoint, it records "estimated" exposure based on the project's own announcements.
3. Writes `logs/airdrop_eligibility.json` for the AIQTP site to display.
4. Logs a single `eligibility_scan` event to the PnL ledger with the total estimated USD value.

## Automated interactions

`policies.json` controls which projects the bot may interact with autonomously. By default every project is set to `allow_execute: false`. To enable Hyperliquid points farming for example:

```json
"Hyperliquid points": {
  "allow_execute": true,
  "max_spend_usd_per_week": 50,
  "actions_allowed": ["trade_50_usd_volume"]
}
```

Action implementations live in `actions/` (currently a placeholder — wire them up to the AIQTP trading-service or a small per-action script). Each action must consume ≤ `max_spend_usd_per_week` and respect `DRY_RUN`.

## Configuration

| Var | Default | Notes |
|-----|---------|-------|
| `AIRDROP_REFRESH` | `21600` | Seconds between eligibility scans. |
| `ETH_WALLET` | platform default | Wallet to check eligibility for. |
| `DRY_RUN` | `true` | Required to actually broadcast farming tx. |

## Disclaimer

Sybil-detection by airdrop teams has improved dramatically — a single wallet farming aggressively can be filtered out. Treat the farmer as a "stay-qualified" tool, not as a multi-wallet sybil engine.
