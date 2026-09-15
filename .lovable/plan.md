# AIQTP Production Completion and Monetization Plan

## Objective
Turn the current mixed live/partial/demo surfaces into an auditable production system: real deposits, real withdrawals, HollaEx-only market data and execution, continuously running self-hosted agents, truthful asset valuation, and no misleading controls.

## Verified baseline
- Stripe checkout and signed deposit-crediting exist, but Stripe reports live activation incomplete. Sandbox is connected; live keys are not provisioned.
- Plaid Link backend exists, but the button is unwired and the “transfer” currently records a pending row without moving money.
- Lightning/ZBD is the strongest completed wallet path, including fail-closed webhook verification.
- HollaEx is now the only permitted market-data and execution venue. Public venue data works; private trading is blocked until HollaEx credentials are securely supplied.
- Live has $100 USD available, 471 strategies, zero real venue replay tests, zero graduated strategies, and no scheduler jobs. Test has 258,800 HollaEx replay tests and active schedules.
- QAQI and the Ollama swarm are request-driven, not continuously autonomous. Some QAQI responses are placeholders and must be removed or backed by real operations.
- The hosted production site still uses Vercel, Render, and Lovable Cloud. A VPS/self-hosted stack exists in the repository, but migration has not occurred and several services are missing from that stack.

## Phase 1 — Truth and safety corrections
- Remove banned exchange names and credential forms from the wallet screen; show HollaEx Platform Venue only.
- Remove or disable fake-success controls: transfer router, manual “saved card” entry, unsupported wire claims, inactive payout methods, and unbacked revenue/profitability labels.
- Replace every fabricated QAQI/IBM result with real data, an explicit unavailable state, or a clearly labeled validation result.
- Remove remaining Alpaca/Binance/Kraken/Coinbase execution and data configuration from active deployment manifests and workers.

## Phase 2 — Payments, bank links, and wallets
- Keep Stripe’s implemented checkout/webhook path and surface its actual activation state. Complete production verification immediately after the provider enables live keys; this account-identity step cannot be bypassed in code.
- Wire Plaid Link in the frontend, but do not claim ACH funding until Plaid Transfer or a real ACH processor is configured. Add settlement webhooks, idempotent crediting, ownership checks, and reconciliation before enabling transfers.
- Wire the existing PayPal checkout backend to the UI only after verifying provider credentials and callback behavior.
- Consolidate withdrawals onto the working database-backed request path; remove the divergent Render call and unsupported payout choices. Add real provider payout execution and reconciliation before labeling payouts automatic.
- Keep Lightning live only when ZBD credentials exist and provider verification succeeds.
- Replace the external onramp redirect with the owned onramp flow only after its worker and provider callback are deployed and verified.

## Phase 3 — Asset pairing and admin valuation
- Inventory QTC, AIQ, NXS/AIQTP, QAQI, data tokens, quantum assets, and every balance table.
- Make USDT the explicit quote currency for supported in-house pairs on HollaEx.
- Value only assets with a fresh venue/oracle price; QTC is Quantum Time Crystal, and AIQ/NXS remain $0 until a real oracle/listing exists.
- Add one authoritative portfolio valuation query/view and use it everywhere. Never include stale, validation, testnet, or unpriced assets in net worth.
- Recompute the 1drrey@gmail.com total from live balances and fresh prices, then verify the portfolio screen matches the database result.

## Phase 4 — Strategy pipeline and the $100
- Publish the HollaEx candle ingestion, calibrated real-market replay criteria, and scheduler jobs to Live.
- Run HollaEx replay training on Live, verify every test’s source and timestamp, and graduate only strategies that meet the stored thresholds.
- Rank eligible strategies from Live evidence only. Create two $50 allocations with 100% reinvestment and validation status.
- Do not place real orders until HollaEx credentials are present, live execution is explicitly enabled, and balance/order/fill reconciliation tests pass.
- Once those gates pass, execute limited orders through HollaEx only, persist provider order IDs/fills/fees, and reconcile wallet balances. No profit guarantee will be stated.

## Phase 5 — Continuous QAQI and free swarms
- Make Ollama pull the actual Hermes, OpenClaw, and reviewer models rather than only llama3.
- Deploy the Ollama/Qdrant/RAG stack on the sovereign VPS and route in-house agents there first, with paid providers disabled by default.
- Add durable scheduled jobs for QAQI research, strategy review, risk checks, and health monitoring; each run records input source, output, duration, and failure state.
- Keep trading actions behind the risk gate and HollaEx execution service; agents cannot bypass order limits, admin authorization, or the kill switch.
- Mark IBM Quantum work as hardware-backed only when a provider job ID and backend result are stored. Never silently substitute fabricated simulator fidelity.

## Phase 6 — Remaining deployables and sovereign hosting
- Containerize and add the onramp service, income engines, gasless-bot modules, and Cognitum modules only after removing simulation, exploit, banned-venue, and unsafe-key behavior.
- Treat the 88 catalogued repositories as source/reference inputs, not “launched products.” Promote a repository only when it has a maintained entrypoint, license/security review, tests, health checks, persistence, UI exposure, and production evidence.
- Migrate database/auth/storage/functions, frontend, workers, Ollama, Qdrant, and monitoring to the VPS using export/import row-count verification and rollback checkpoints.
- Change DNS only after parallel-run verification. Until then, Vercel, Render, and Lovable Cloud remain the production runtime.

## Phase 7 — Security and performance closure
- Run database linter, dependency scan, application security scan, function log review, and UI/network checks after each financial/auth change.
- Optimize the observed slow graduation-test and faucet/auto-invest reads with measured query plans and targeted indexes/query changes.
- Require fail-closed webhooks, idempotency, amount/owner verification, append-only financial audit records, provider reconciliation, and no browser-held secrets.
- Verify desktop and 344px mobile flows: Google sign-in, card deposit, bank linking, Lightning, HollaEx status/order refusal/success, withdrawals, portfolio valuation, strategy training, and agent status.
- Report completion only with Live evidence; leave external-account gates explicitly blocked rather than calling them complete.

## External actions that cannot be fabricated or bypassed
- Stripe: finish the currently incomplete live-account connection and provider onboarding so live keys can be provisioned.
- HollaEx: securely supply the account API key/secret and explicitly enable live orders.
- Plaid/PayPal/ZBD: supply their production credentials only if those rails will be offered.
- VPS: provide a reachable host, DNS control, and deployment access before the sovereign cutover.

## Direct answer about the VPS
Yes—the intended architecture is to move aiqtp.com away from Vercel, Render, and the managed backend onto your own VPS. That migration is designed but has not happened; today the production site still depends on those services.
