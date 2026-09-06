# Plan: AIQTP Production Completion and Revenue Activation

## Objective
Turn the existing AIQTP estate into a truthful, sovereign, revenue-capable institutional platform. Reuse every production-worthy asset, remove false-live claims, avoid Alpaca as the selected execution path, and never represent simulations or cataloged repositories as deployed systems.

## Current verified baseline
- 91 repositories are cataloged: 30 Tier 1, 16 Tier 2, and 45 Tier 3. The catalog is a knowledge corpus, not proof of deployment.
- Six Render services are declared: trading API, core worker, quantum API, momentum bot, flash bot, and yield scanner.
- The sovereign stack declares database/auth/storage, Ollama, Qdrant, RAG/OpenClaw, trading tools, worker, functions, web, and gateway services.
- CCXT has a gated live-order path. The Hummingbot-labeled grid feature is only a plan generator. Current Freqtrade backtest/hyperopt responses use deterministic random simulation.
- Stripe deposits are the only verified provider-backed money-in flow. Withdrawals, creator payouts, and revenue settlement do not move real money.
- The latest frontend build passes and dependency scanning reports no high/critical package vulnerabilities.
- Active security problems remain, including a forgeable Lightning-credit path, transaction-detail exposure, and recurring privileged-function warnings.
- CI security checks are advisory, deployment is not gated by tests, the named backup workflow does not create a real restorable backup, and no automated test script exists.

## Phase 0 — Truth, containment, and release freeze
1. Disable or fail closed on every money-moving path that lacks authentication, signature verification, idempotency, limits, reconciliation, or a verified provider response.
2. Fix the Lightning webhook and transaction-detail leak, then rerun application, database, and dependency scans.
3. Inventory every user-facing claim and classify it as Live, Provider Required, Validation, Research, or Unavailable. Remove fabricated performance, balances, partner status, and “live” labels.
4. Replace client-submitted exchange secrets with server-side encrypted credential custody; never accept private exchange keys in browser order requests.

**Exit gate:** no critical security finding, no unsupported live claim, and no unbounded/replayable financial operation.

## Phase 1 — Permanent delivery and disaster recovery controls
1. Add mandatory CI for lint, type checks, build, unit/integration tests, migration validation, RLS coverage, auth-contract tests, secret scans, and critical/high dependency checks.
2. Make production deployment fail closed when required credentials are absent; remove warning-and-skip deployment behavior.
3. Require protected-main PRs, successful checks, and production approval before migrations or functions deploy.
4. Replace the fake backup workflow with encrypted database/storage/source exports, retention tiers, checksums, and automated restore drills.
5. Add drift detection between source migrations and live schema plus rollback/runbook evidence.

**Exit gate:** a deliberately broken build, missing RLS policy, vulnerable dependency, absent secret, or failed restore blocks release.

## Phase 2 — Close the real-money loop
1. Implement an auditable withdrawal rail only after legal/payment-provider eligibility is confirmed; until then, expose an honest manual-review state and do not promise automated payout.
2. Add immutable idempotency and double-entry reconciliation for deposits, withdrawals, fees, orders, fills, refunds, and creator payouts.
3. Complete the strategy marketplace's creator share and platform share settlement.
4. Schedule reconciliation and alert on any provider-versus-ledger mismatch.
5. Enforce server-side KYC/AML, sanctions, account ownership, transaction limits, and approval status before live trade or withdrawal.

**Exit gate:** test transactions reconcile to the cent, duplicate requests produce one result, and money-in/money-out completes with an auditable provider reference.

## Phase 3 — Replace simulations with real open-source engines
1. Replace pseudo-random Freqtrade backtest/hyperopt output with actual historical-data execution, deterministic datasets, fees, slippage, walk-forward validation, and reproducible artifacts.
2. Integrate Hummingbot as an actual separately supervised service or label/remove Hummingbot references; connect execution only after risk gates pass.
3. Make CCXT the primary centralized-exchange abstraction and add exchange capability checks, order-state reconciliation, rate limits, kill switch, and per-user/per-day notional caps.
4. Keep Alpaca disabled and non-primary. Use free/public market data only where licensing and freshness permit; never confuse data access with brokerage execution.
5. Separate Validation from Live globally; validation capital has zero real valuation and cannot contaminate revenue, P&L, rankings, or net worth.

**Exit gate:** backtests replay identically, live orders are idempotent and reconciled, and all displayed performance is traceable to source data and fills.

## Phase 4 — Sovereign AI, QAQI, and research services
1. Package Ollama + Hermes + OpenClaw + Qdrant/RAG as health-checked self-hosted services with resource limits, persistent storage, model provenance, and no per-message paid dependency.
2. Add authenticated job queues, timeouts, audit logs, rate/resource budgets, and failover; never expose model control endpoints publicly.
3. Separate IBM hardware jobs from local simulation. Show backend, job ID, queue state, shot count, result timestamp, and provider receipt for every claimed hardware execution.
4. Integrate Qlib, FinRL, MindsDB, LangGraph/LangChain, Qiskit, and other research repositories as isolated reproducible jobs only where they add a distinct tested capability; otherwise retain them as indexed research references.
5. Convert useful Tier 2/3 assets into adapters/plugins instead of duplicating entire platforms.

**Exit gate:** every agent/quantum result declares its model/backend/data provenance; hardware claims have IBM evidence; services survive restart and backup restoration.

## Phase 5 — Monetization and enterprise-value products
1. Activate genuine strategy marketplace fees after two-sided settlement works.
2. Launch paid research/automation tiers only for measured capabilities with enforceable quotas and service levels.
3. Activate real affiliate links only after registration and server-side conversion reconciliation.
4. Keep custody, margin, insurance, and prime-service claims unavailable or waitlisted until contracted/licensed providers exist.
5. Build examiner/investor evidence from real recurring revenue, retained users, reconciled assets, uptime, security controls, and intellectual-property provenance—not self-assigned valuations.

**Exit gate:** each revenue line has at least one reconciled provider payment, customer entitlement, refund/payout path, and monthly control report.

## Phase 6 — Exhaustive capability disposition
For every one of the 91 cataloged repositories and every local module, maintain one evidence row:

`Asset → ownership/license → distinct capability → current implementation → dependencies → security risk → data source → deployment target → UI entry → monetization → tests → live evidence → disposition`

Allowed dispositions: **Production service, Internal service, Library/adapter, Research-only, Replaced/duplicate, Unsafe/blocked, or Archived.** “Listed in RAG” and “linked on a page” never count as launched.

## Verification protocol
- Verify Test and Live database state independently.
- Exercise public, signed-in, admin, financial, and failure paths end to end.
- Verify live provider health, order/deposit/payout references, database rows, UI state, logs, and reconciliation together.
- Test desktop and 344px mobile screens with no stale, overlapping, fabricated, or unauthorized data.
- Run security, dependency, performance, restore, replay, and deployment-gate tests before completion.
- Publish a signed release evidence report listing pass/fail/blocker status; no task is “complete” while any required check is blocked.

## Delivery order
Start with Phases 0–1 as one security/reliability work package. Then deliver Phase 2 money-loop integrity, Phase 3 execution engines, Phase 4 sovereign intelligence, and Phase 5 revenue products. Phase 6 remains the governing inventory throughout all phases.

## Technical constraints
- GitHub `main` remains the production source of truth; changes use a protected feature branch and PR.
- No direct push to `main`, no invented credentials, no mock financial data, no promised returns, and no credential exposure.
- Provider credentials and legal approvals remain external gates; code cannot fabricate or bypass them.
- Do not deploy exploit, sniper, sandwich, flash-loan, or similar assets to production merely because source code exists; require legal/security review and explicit approval.
