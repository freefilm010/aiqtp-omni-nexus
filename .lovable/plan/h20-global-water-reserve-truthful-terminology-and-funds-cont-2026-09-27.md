# H20 Global Water Reserve — Truthful Terminology and Funds-Control Implementation

## Objective
Build H20 as a new, evidence-backed module. The repository currently contains no H20 pages, token records, APIs, functions, or database tables to rename. The supplied standard will govern all new H20 public content, internal accounting, administration, receipts, reports, metadata, and communications.

## Public H20 experience
- Add a dedicated H20 information page using the required core disclosure verbatim and neutral terms: H20 unit, purchaser, holder, primary sale, secondary-market sale, and potential gain or loss.
- Present the 90% / 5% / 5% structure only against **Confirmed Net Primary-Sale Receipts**:
  - 90% Water-Impact Program Allocation
  - 5% AIQTP.com Administrative Allocation
  - 5% Matching/Liquidity-Support Allocation
- Show the required liquidity-reserve limitation and `TAX_TREATMENT_NOT_DETERMINED` unless supported determinations exist.
- Never display a market price, distribution total, royalty receipt, verification badge, mainnet status, or water outcome unless a supporting record exists. Missing states will show `NOT_CONFIGURED`, `NOT_VERIFIED`, `PENDING_REVIEW`, `TESTNET`, `SIMULATED`, or `DEMO_DATA` as applicable.
- Add transparent ledgers for confirmed allocations and approved distributions, with no fabricated seed entries.

## Accounting and data model
- Create separate, append-only H20 ledger accounts for Water-Impact Treasury, Administrative Treasury, Matching/Liquidity-Support Reserve, Seller Settlement Account, Buyer Refund Payable, Royalty Treasury, and Unallocated Funds.
- Record every movement with source account, destination account, precise transaction type, amount, currency, external transaction reference, business purpose, approval reference, timestamp, and ledger status.
- Implement the complete classification vocabulary from the standard, including primary-sale receipts/costs/net receipts, allocations, seller proceeds, refunds, royalties, and water-impact distributions.
- Enforce the 90/5/5 allocation only after disclosed processing, blockchain, tax, and statutory costs produce confirmed net receipts. Use balanced ledger entries and reject incomplete or unbalanced postings.
- Keep purchase refunds, marketplace sales, seller withdrawals, payment reversals, royalty distributions, and water-impact distributions distinct.
- Track royalty lifecycle states separately; calculated, signaled, and receivable royalties never count as received funds.

## Recipient, distribution, and evidence controls
- Add Approved Water-Impact Recipient records with the permitted classifications and independent verification status, source, date, expiry, reviewer, and supporting document reference.
- Require each distribution to record type, recipient, purpose, amount, currency, approval, agreement/document reference, transaction identifier, date, and reporting period.
- Permit `CHARITABLE_ORGANIZATION` only when a current verification record supports it.
- Store high-risk claims as controlled records requiring source/document reference, approval status, effective date, optional expiration, administrator identity, and full change history.
- Prevent unsupported claims from being published; expired or corrected evidence automatically removes the public “verified” state without deleting history.

## Administration and authorization
- Add an H20 administration area for evidence review, recipient review, distributions, ledger reconciliation, public claims, corrections, and production authorization.
- Enforce sole application-level H20 final approval and production authorization for the existing server-verified administrator identity associated with `1drrey@gmail.com`; never trust an email supplied by the browser.
- Clearly distinguish `ADMIN_APPROVED`, `PROFESSIONAL_REVIEW_COMPLETED`, `EXTERNAL_CERTIFICATION_RECEIVED`, and `REGULATORY_STATUS_NOT_DETERMINED`.
- Label internal approval as **H20 Administrative Approval** or **H20 Production Authorization**, never legal, regulatory, tax, government, securities, or audit approval.
- Preserve original records for corrections; record corrected value, actor, timestamp, and reason without rewriting transaction history.

## Security and integrity
- Apply explicit grants and row-level access rules to every new table: public access only through sanitized approved views; authenticated users only see their own purchase/holding/receipt records; H20 administrators see operational records; trusted functions perform financial writes.
- Make financial and audit history append-only through restricted grants and trusted functions; block direct client updates/deletes.
- Validate enumerations, nonnegative amounts, currencies, required evidence, lifecycle transitions, balanced entries, idempotency references, and allocation totals in the database.
- Exclude sensitive evidence, personal information, and internal approval details from public views and real-time channels.
- Add automated security-contract tests covering authorization bypass, cross-user access, unsupported publication, false verification, duplicate processing, unbalanced postings, and immutable-history controls.

## System-wide terminology enforcement
- Centralize approved H20 labels, disclosures, statuses, and transaction types so the UI, functions, exports, and reports use identical wording.
- Add a repository check that flags prohibited H20 claims such as “guaranteed profit,” “tax deductible,” “water-backed,” “registered charity,” and “government approved,” while allowing controlled legal text that explicitly says those claims are not made.
- Add receipt and export formats that identify factual transaction history and state that tax treatment is not determined and exports are not tax advice.

## Verification and release
- Apply the migration to the test database and inspect the live schema, grants, policies, constraints, functions, and sanitized views directly.
- Run type checks, focused tests, build, dependency scan, and backend security scan; resolve new findings before release.
- Verify public H20 disclosures and administrator workflows end to end at desktop and 344px mobile width, including rejected unsupported claims and immutable correction history.
- Publish only after the test database and preview pass. Then verify the live database received the migration, the production page serves correctly, and no unsupported H20 claims or fabricated balances appear.

## Explicit boundaries
- This implementation does not declare H20 legally compliant, tax-deductible, charitable, regulated, audited, mainnet-ready, liquid, profitable, or backed by physical water.
- It does not create fake recipients, transactions, balances, hashes, prices, outcomes, credentials, certifications, or reviews.
- Token issuance, payment acceptance, blockchain deployment, and recipient disbursement remain disabled until each has real configuration, evidence, authorization, and independently required professional review.
