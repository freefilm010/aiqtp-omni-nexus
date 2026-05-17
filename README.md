# AIQTP Omni-Nexus

**Status:** 🟡 Private beta. Building in public.

Multi-broker AI trading terminal with a post-quantum-crypto roadmap, built by a solo founder. Stack: React 19 + Vite 7 + TypeScript on the frontend; FastAPI / Python 3.11 on the trading + quantum services; Supabase (Postgres + Edge Functions) for auth, data, and serverless logic; Render for backend hosting; Vercel for frontend hosting.

## What's actually here

| Area | What exists |
|---|---|
| Frontend | 500+ TypeScript/React files. Modern Vite 7 stack, Tailwind, shadcn-ui, Sentry. |
| Backend services | `core-brain` (trading worker), `trading-service` (FastAPI broker aggregator), `rag-service` (Qdrant + Ollama RAG), `onramp-service`, `gasless-bot`, `income-engines`. |
| Edge functions | 48 Supabase Edge Functions (auth, payments, market data, ML predictions, agent orchestration). |
| Database | 194 SQL migrations. Postgres + RLS. |
| Broker integrations | Alpaca, Tradier, Binance, Kraken, IBKR, KuCoin, MEXC, Gate.io, Hyperliquid (perp DEX), Solana/Jupiter, 1inch. |
| Security CI | Semgrep, CodeQL, Trivy, OSV-Scanner, OSSF Scorecard, GitGuardian, Qodo Merge. |
| Quantum integration | IBM Qiskit Runtime via the `aiqtp-quantum-agent` Render service. |

## What this is NOT (yet)

- **Not** a chartered bank.
- **Not** a registered broker-dealer or investment adviser.
- **Not** a stablecoin issuer (no payment stablecoin has been issued).
- **Not** SOC 2 audited.
- **Not** accepting customer funds beyond Stripe test mode for the beta.

If you saw older copy on the site claiming a federal charter is pending, fabricated user counts, or specific ROI percentages — that copy is being systematically removed. See `AUDIT_2026-05-17.md` for the full cleanup pass.

## Live deployments

- Frontend: <https://www.aiqtp.com> · <https://aiqtp.vercel.app>
- Trading API: `https://aiqtp-trading-service.onrender.com`
- Quantum Agent: `https://aiqtp-quantum-agent.onrender.com`
- Supabase: `https://rueaxiyvseaxkysnoock.supabase.co`

## Repository layout

```
src/                      Frontend (React + TypeScript + Vite)
trading-service/          FastAPI broker aggregator (Alpaca, Tradier, etc.)
core-brain/               Background trading worker + quantum agent
rag-service/              Qdrant + Ollama RAG over indexed repos
gasless-bot/              ERC-4337 flash-loan arb bot (experimental)
onramp-service/           Fiat-to-crypto on-ramp module
income-engines/           Multi-engine revenue orchestrator
cognitum/                 CLI + compute-mining worker
supabase/
  functions/              48 Edge Functions
  migrations/             194 SQL migrations
docker/                   Self-hosted-stack Dockerfiles
docs/                     Specs, audits, internal docs
.github/workflows/        CI: deploy, security scan, keepalive, schema sync
```

## Architecture & deploy flow

Source of truth is **GitHub `main`**. On merge to main:

```
main → Vercel auto-deploys frontend
     → Render auto-deploys core-brain, trading-service, quantum-agent
     → GitHub Actions deploys Supabase edge functions (deploy-all.yml)
```

Full details in [`CLAUDE.md`](./CLAUDE.md). Operational runbook in [`RUNBOOK.md`](./RUNBOOK.md). Security reporting in [`.github/SECURITY.md`](./.github/SECURITY.md).

## Running locally

Requires Node.js 22+, Python 3.11+, Docker (for the full stack).

**Frontend only:**

```bash
npm install --legacy-peer-deps
cp .env.example .env             # fill in your local values
npm run dev                       # starts Vite at http://localhost:5173
```

**Full self-hosted stack (Supabase + RAG + trading + ollama, all local):**

```bash
cp .env.example .env             # fill in 5 required secrets
docker compose up -d              # ~2 min cold start
```

Access:
- QuantClaw UI (via Kong): http://localhost:8000
- Supabase Studio: http://localhost:3000
- RAG API: http://localhost:8001/docs
- Trading API: http://localhost:8002/docs
- Qdrant: http://localhost:6333/dashboard

## Roadmap

See [`docs/SIGNALS_PRO_SPEC.md`](./docs/SIGNALS_PRO_SPEC.md) for the next-product spec (subscription tiers, Stripe wiring, launch plan).

Big picture:

| Phase | Focus | Realistic horizon |
|---|---|---|
| **Phase 1 (now)** | Signals Pro SaaS, hardening, honest marketing | 6 months |
| **Phase 2** | Broker-dealer partnership (Alpaca BD rails) + state MTL portfolio | 12–24 months |
| **Phase 3** | Bank charter via acquisition (model: SoFi/Golden Pacific) | 5–7 years |
| **Phase 4** | Integrated financial services holding company | 7–15 years |

If older docs in this repo suggested a federal charter by mid-2026, that timeline came from an LLM hallucination and has been retired. The real GENIUS Act timeline (per OCC NPRM Feb 2026, Federal Register March 2026, final-rule statutory deadline July 18, 2026) makes any de novo charter approval realistically a 2027+ event.

## Security

Vulnerabilities → email `1drrey@gmail.com` with subject `[SECURITY] <description>`. Do NOT open a public issue. Full policy in [`.github/SECURITY.md`](./.github/SECURITY.md).

## Disclaimer

Trading involves substantial risk of loss. AIQTP provides software tools and general market commentary, not personalized investment advice. We are not a registered investment adviser, broker-dealer, bank, or stablecoin issuer. You are responsible for your own trades. Past performance — backtested, simulated, or actual — does not guarantee future results.

## License

Proprietary. © freefilm010. All rights reserved.
