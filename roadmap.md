# Roadmap

## Active
- [ ] **H20 Truthful Terminology Standard** — isolated in its own desktop/mobile/footer category with only a small linked mention at the bottom of the main page; public disclosure and admin governance screens are built. Blocked from completion because the Lovable Cloud database is unreachable after two unchanged migration attempts; schema, security scan for new tables, publish, and live verification remain pending.
- [ ] **HollaEx API keys** — secure form opened for HOLLAEX_API_KEY / HOLLAEX_API_SECRET (user to submit; two interruptions so far). Unlocks platform-venue execution + treasury deployment.
- [ ] **Stripe live activation** — provider reports claim acct_1UAYTFIX09yy4lkP still "in progress" (user says completed; verification email never received; Stripe Support is fastest path). Unlocks live $100 deposit path.
- [ ] Per-venue execution keys (Binance/Kraken/Coinbase) — optional; user connects per account. Platform stays HollaEx-only until then.

## Completed
- [x] Venue unban + pipeline repoint (2026-09-27): multi-venue public market data layer (`_shared/exchange_public.ts`), ccxt-trading routed to hollaex/binance/kraken/coinbase, UnifiedOrderBook rewritten from synthetic to real venue books, execution paths verified (trade-execute already venue-agnostic per user account; Alpaca stays banned).
- [x] Test hardening milestone: clean build/dependency/backend scans, wallet + withdrawal fail-closed paths.
- [x] Live publish + DB sync (www.aiqtp.com 200, live DB synced same day, 0 error-level security findings).
- [x] Royalty fee tiers (1.90/0.10 pricing; 5/3/1/0.10% tiers; hourly treasury reinvest job).
- [x] Withdrawal queue fix (idempotent migration, allowed destination types, RPC grants, /admin/withdrawals).
- [x] Auto-pipeline real-market replay (40 strategies trained, standardized graduation criteria).
- [x] $100 deployed 50/50 to two graduated strategies (validation-only until venue keys land).
