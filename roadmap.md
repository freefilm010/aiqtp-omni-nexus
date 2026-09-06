# AIQTP Completion Roadmap

- [x] Audit all cataloged repositories, deployables, monetization paths, and systemic controls.
- [x] Phase 0: contain critical financial/security paths and remove unsupported live claims.
- [x] Phase 1: enforce CI, deployment, RLS, auth-contract, backup, restore, and drift gates.
- [~] Phase 2: withdrawals repaired (missing live engine restored) + admin review/approve/reject-refund queue at /admin/withdrawals. Remaining: creator payouts, provider payout rail, KYC/AML gate.
- [~] Phase 3: engines now run a real round-the-clock cycle (`autonomous-invest-cycle-hourly` -> auto-invest `autonomous_cycle` + compound snapshot). Remaining: reproducible Freqtrade/Hummingbot/CCXT order execution (needs venue keys).
- [x] Agent cost/caps removed: AI calls route free self-hosted Ollama -> included gateway -> paid provider last; admins and self-hosted paths are never rate limited.

- [ ] Phase 4: operationalize sovereign Ollama/OpenClaw/RAG and evidence-backed IBM jobs.
- [ ] Phase 5: activate reconciled monetization and enterprise evidence.
- [ ] Phase 6: disposition every cataloged repository and local module with live evidence.

## Live-vs-preview gap (verified 2026-09-06)
- Live scheduler has 0 cron jobs; preview has 3. Publishing pushes the schedules to Live and unfreezes prices (Live prices last updated 2026-07-30).
- Live totals: 471 strategies (0 live), 3 currencies (QTC/QAQI/AIQTP), $100 USD sitting in the platform wallet, 50,349 faucet claims, 27,027 active auto-invest allocations.
- Broker keys (Render) are still absent, so no order can reach a real exchange yet.
