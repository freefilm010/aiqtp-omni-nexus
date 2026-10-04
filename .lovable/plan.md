# H20 Global Drinking Water Protection — IRS-Aware Neutral Terminology

## Objective
Rename and rewrite the H20 experience as **H20 Global Drinking Water Protection**, eliminate donation jargon, and avoid representing any H20 payment or transfer as a charitable contribution, tax-deductible payment, or IRS-qualified gift.

## User-facing changes
- Replace the H20 title and public copy with factual drinking-water-protection terminology.
- Keep the 90% / 5% / 5% allocation tied only to confirmed net primary-sale receipts.
- Add a clear tax statement: H20 purchases and Water-Impact Program transfers are not represented as charitable contributions, tax-deductible payments, or IRS-qualified gifts; tax treatment remains undetermined and requires a qualified tax adviser.
- Keep evidence-backed public claims and show no unsupported status, amount, recipient, or outcome.

## Operational terminology
- Remove `DONATION` and `CHARITABLE_ORGANIZATION` from active H20 choices.
- Use neutral classifications such as `WATER_PROTECTION_FUNDING`, `PROJECT_PAYMENT`, `SERVICE_PAYMENT`, and `WATER_IMPACT_RECIPIENT`.
- Keep legacy migration history immutable; add a forward-only database migration that retires old classifications and prevents new H20 records from using them.
- Extend the terminology guard so donation, donor/donee, charity, charitable contribution, deductible, and gift language cannot re-enter active H20 interfaces, except inside the exact cautionary disclosure.

## Verification
- Inspect the test database schema and apply the forward-only terminology migration.
- Run H20 terminology checks, type checks, build checks, dependency and backend security scans.
- Verify the public H20 page and administrator workflow at desktop and 344px mobile width.
- Do not claim IRS approval or legal/tax compliance; production activation remains subject to qualified jurisdiction-specific review.
