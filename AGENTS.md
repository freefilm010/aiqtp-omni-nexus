# Architecture Rules

- H20 uses append-only, separately classified ledger accounts and evidence-gated public views because promotional labels or pooled balances can misrepresent legal and financial status.
- H20 production authorization is enforced by a server-verified administrator role plus the sole approved account identity; browser-supplied identity is never trusted.
- H20 terminology is centralized in `src/lib/h20/terminology.ts` so interfaces, exports, and server workflows use the same neutral classifications.
- Hummingbot remains private-network only and is accessed through the authenticated trading service; live controls require both the global kill switch and `HUMMINGBOT_LIVE_ENABLED`.
