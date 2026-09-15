# AIQTP Completion Roadmap

- [x] Audit all cataloged repositories, deployables, monetization paths, and systemic controls.
- [x] Phase 0: contain critical financial/security paths and remove unsupported live claims.
- [x] Phase 1: enforce CI, deployment, RLS, auth-contract, backup, restore, and drift gates.
- [~] Phase 2: withdrawals repaired (missing live engine restored) + admin review/approve/reject-refund queue at /admin/withdrawals. Remaining: creator payouts, provider payout rail, KYC/AML gate.
- [~] Phase 3: engines now run a real round-the-clock cycle (`autonomous-invest-cycle-hourly` -> auto-invest `autonomous_cycle` + compound snapshot). Remaining: reproducible Freqtrade/Hummingbot/CCXT order execution (needs venue keys).
- [x] Agent cost/caps removed: AI calls route free self-hosted Ollama -> included gateway -> paid provider last; admins and self-hosted paths are never rate limited.

- [ ] Phase 4: operationalize sovereign Ollama/OpenClaw/RAG and evidence-backed IBM jobs; remove QAQI/IBM placeholder outputs.
- [ ] Phase 5: activate reconciled Stripe, Plaid/ACH, PayPal, Lightning, withdrawals/payouts, and HollaEx-only monetization.
- [ ] Phase 6: disposition every cataloged repository and deploy safe, complete onramp/income/gasless/Cognitum services with live evidence.

## Live-vs-preview gap (verified 2026-09-06)
- Live scheduler has 0 cron jobs; preview has 3. Publishing pushes the schedules to Live and unfreezes prices (Live prices last updated 2026-07-30).
- Live totals: 471 strategies (0 live), 3 currencies (QTC/QAQI/AIQTP), $100 USD sitting in the platform wallet, 50,349 faucet claims, 27,027 active auto-invest allocations.
- Broker keys (Render) are still absent, so no order can reach a real exchange yet.

## Current verified blockers (2026-09-15)
- Stripe live onboarding: claim-account step still in progress; live keys absent.
- HollaEx private execution credentials absent; public HollaEx market data is working.
- Plaid button is unwired and ACH transfer is record-only, not money movement.
- Live has 0 cron jobs and 0 real HollaEx replay tests; Test has active schedules and 258,800 replay tests.
- Hosted production remains on Vercel + Render + Lovable Cloud; VPS stack is not cut over.
- Wallet page still contains banned exchange names and several nonfunctional success controls.
