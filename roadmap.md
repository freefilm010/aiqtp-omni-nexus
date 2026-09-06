# AIQTP Completion Roadmap

- [x] Audit all cataloged repositories, deployables, monetization paths, and systemic controls.
- [x] Phase 0: contain critical financial/security paths and remove unsupported live claims.
- [x] Phase 1: enforce CI, deployment, RLS, auth-contract, backup, restore, and drift gates.
- [ ] Phase 2: close withdrawals, creator payouts, reconciliation, and compliance gates.
- [ ] Phase 3: replace simulated engines with reproducible Freqtrade/Hummingbot/CCXT execution.
- [ ] Phase 4: operationalize sovereign Ollama/OpenClaw/RAG and evidence-backed IBM jobs.
- [ ] Phase 5: activate reconciled monetization and enterprise evidence.
- [ ] Phase 6: disposition every cataloged repository and local module with live evidence.

## Live-vs-preview gap (verified 2026-09-06)
- Live scheduler has 0 cron jobs; preview has 3. Publishing pushes the schedules to Live and unfreezes prices (Live prices last updated 2026-07-30).
- Live totals: 471 strategies (0 live), 3 currencies (QTC/QAQI/AIQTP), $100 USD sitting in the platform wallet, 50,349 faucet claims, 27,027 active auto-invest allocations.
- Broker keys (Render) are still absent, so no order can reach a real exchange yet.
