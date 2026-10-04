# Roadmap

## Active
- [ ] **System-wide issue resolution** — repair strategy training, missing trade close timestamps, role/subscription access checks, managed social sign-in, and verify current runtime/database health end to end.
- [ ] **H20 IRS gift terminology rewrite** — public and administrator wording is rewritten and verified without donation/deductibility jargon. The forward-only gift classification migration remains blocked because the Test database is still restarting/unreachable; active forms temporarily use only legacy-safe neutral classifications and do not offer `GIFT` until that migration lands.
- [ ] **H20 Truthful Terminology Standard** — isolated category, public disclosure, admin governance, append-only evidence/ledger schema, sole-admin approval, sanitized public functions, and server-side 90/5/5 allocation are built. Test migration applied; direct database verification is blocked by the connection pooler timeout. Live rollout still requires the GitHub PR/merge deployment path and jurisdictional professional review before activation.
- [ ] **Hummingbot execution** — private-network adapter, fail-closed live gate, sole-admin control, service configuration, status UI, and regression tests added. Launch remains blocked until a private Hummingbot API deployment exists and its URL/credentials are stored securely; live mode stays off.
- [ ] **HollaEx API keys** — secure form opened for HOLLAEX_API_KEY / HOLLAEX_API_SECRET (user to submit; two interruptions so far). Unlocks platform-venue execution + treasury deployment.
- [ ] **Stripe live activation** — provider reports claim acct_1UAYTFIX09yy4lkP still "in progress" (user says completed; verification email never received; Stripe Support is fastest path). Unlocks live $100 deposit path.
- [ ] Per-venue execution keys (Binance/Kraken/Coinbase) — optional; user connects per account. Platform stays HollaEx-only until then.
- [ ] **Production release** — code and local checks are ready, but GitHub `main` is the production source of truth. A reviewed feature branch must merge before Vercel/Render/database automation can deploy; this workspace must not bypass that rule.

## Completed
- [x] Venue unban + pipeline repoint (2026-09-27): multi-venue public market data layer (`_shared/exchange_public.ts`), ccxt-trading routed to hollaex/binance/kraken/coinbase, UnifiedOrderBook rewritten from synthetic to real venue books, execution paths verified (trade-execute already venue-agnostic per user account; Alpaca stays banned).
- [x] Test hardening milestone: clean build/dependency/backend scans, wallet + withdrawal fail-closed paths.
- [x] Live publish + DB sync (www.aiqtp.com 200, live DB synced same day, 0 error-level security findings).
- [x] Royalty fee tiers (1.90/0.10 pricing; 5/3/1/0.10% tiers; hourly treasury reinvest job).
- [x] Withdrawal queue fix (idempotent migration, allowed destination types, RPC grants, /admin/withdrawals).
- [x] Auto-pipeline real-market replay (40 strategies trained, standardized graduation criteria).
- [x] $100 deployed 50/50 to two graduated strategies (validation-only until venue keys land).
