# AIQTP Omni-Nexus — Architecture & Sync Rules

## Source of Truth: GitHub `main` branch

**GitHub main is the boss. Every platform follows it. Nobody overwrites it directly.**

## Platform Map

| URL | Platform | Deploys From | Purpose |
|-----|----------|-------------|---------|
| www.aiqtp.com | Vercel | GitHub main (auto) | Production frontend |
| aiqtp.vercel.app | Vercel | GitHub main (auto) | Vercel preview |
| aiqtp-trading-service.onrender.com | Render | GitHub main (auto) | Trading API |
| aiqtp-quantum-agent.onrender.com | Render | GitHub main (auto) | Quantum AI API |
| rueaxiyvseaxkysnoock.supabase.co | Supabase | GitHub Actions deploy | Edge functions + Auth |

Note: Lovable (aiqtp.lovable.app) is being disconnected. Supabase edge functions now deploy
via GitHub Actions workflow (deploy-all.yml) — requires SUPABASE_ACCESS_TOKEN in GitHub secrets.

## Branch Strategy

```
main              ← protected, production, never push directly
claude/*          ← Claude Code feature work → PR to main
```

- **Claude Code** → always branches from main → PR to main
- **Nobody** pushes directly to main
- Lovable branch is deprecated — ignore it

## Deployment Flow

```
Code change
    ↓
Branch (claude/*)
    ↓
Pull Request to main
    ↓
Merge to main
    ↓
Auto-deploy: Vercel + Render (automatic)
Auto-deploy: Supabase edge functions via deploy-all.yml (needs SUPABASE_ACCESS_TOKEN secret)
```

## Services & API Keys

All secrets live in platform environment variables — never in code.

| Secret | Platform | Service |
|--------|----------|---------|
| ANTHROPIC_API_KEY | Render + Supabase | Claude AI |
| IBM_QUANTUM_API_KEY | Render | IBM Quantum |
| VITE_SUPABASE_URL | Vercel | Frontend → Supabase |
| VITE_SUPABASE_PUBLISHABLE_KEY | Vercel | Frontend → Supabase |
| VITE_RENDER_WORKER_URL | Vercel | Frontend → Trading API |
| VITE_QUANTUM_AGENT_URL | Vercel | Frontend → Quantum API |
| STRIPE_SECRET_KEY | Render | Payments |
| STRIPE_WEBHOOK_SECRET | Render | Stripe webhooks |
| ALPACA_API_KEY | Render (aiqtp-trading-service) | Alpaca equities/crypto |
| ALPACA_SECRET_KEY | Render (aiqtp-trading-service) | Alpaca equities/crypto |
| TRADIER_API_KEY | Render (aiqtp-trading-service) | Tradier equity broker |
| TRADIER_ACCOUNT_ID | Render (aiqtp-trading-service) | Tradier account |
| TRADIER_SANDBOX_MODE | Render | "true" = sandbox, "false" = live |
| BINANCE_API_KEY | Render (aiqtp-trading-service) | Binance crypto |
| BINANCE_SECRET_KEY | Render (aiqtp-trading-service) | Binance HMAC signing |
| BINANCE_LIVE_ENABLED | Render | "true" to enable live orders |
| KRAKEN_API_KEY | Render (aiqtp-trading-service) | Kraken crypto |
| KRAKEN_SECRET_KEY | Render (aiqtp-trading-service) | Kraken HMAC signing |
| KRAKEN_LIVE_ENABLED | Render | "true" to enable live orders |
| IBKR_CPG_URL | Render (aiqtp-trading-service) | IBKR Client Portal Gateway URL |
| IBKR_ACCOUNT_ID | Render (aiqtp-trading-service) | IBKR account ID |
| SUPABASE_ACCESS_TOKEN | GitHub Secrets | Supabase CLI deploy |
| SENTRY_DSN | Render | Error tracking |

## Stack

- **Frontend**: React 19 / Vite 7 / TypeScript / TailwindCSS
- **Trading API**: FastAPI (Python 3.11) on Render — `/brokers/*` for Tradier/Binance/Kraken/IBKR
- **Quantum AI**: FastAPI (Python 3.11) on Render
- **Database**: Render PostgreSQL (primary) + Supabase (auth + edge functions)
- **Edge Functions**: Deno/TypeScript on Supabase (deployed via GitHub Actions)

## Broker Endpoints (trading-service)

```
GET  /brokers                         — list configured brokers + live status
GET  /brokers/tradier/quotes          — real-time equity quotes
GET  /brokers/tradier/options-chain   — options chain with Greeks
POST /brokers/tradier/order           — equity order
GET  /brokers/binance/ticker          — spot price (public)
POST /brokers/binance/order           — spot order (BINANCE_LIVE_ENABLED=true required)
GET  /brokers/kraken/ticker           — spot price (public)
POST /brokers/kraken/order            — spot order (KRAKEN_LIVE_ENABLED=true required)
GET  /brokers/ibkr/accounts           — IBKR accounts via Client Portal Gateway
GET  /brokers/ibkr/portfolio          — IBKR positions
POST /brokers/ibkr/order?conid=<id>   — IBKR order (conid = contract ID)
```

## Rules for Claude Code

1. Always `git pull origin main` before starting new work
2. Never push directly to main
3. Never hardcode secrets — use env vars
4. After merging to main, Vercel and Render auto-deploy — no manual step needed
5. Supabase edge function changes deploy automatically via GitHub Actions after merge
6. Finish current task before pivoting to new user requests (complete then context-switch)
7. Write learnings and architectural decisions to CLAUDE.md during sessions
8. At session start, the SessionStart hook (`.claude/settings.json`) injects the path to the most recent prior transcript. Read its tail, identify any unfinished tasks (treat as this session's leading priorities), and refresh awareness of recent decisions / branch state / planned next steps before responding — avoid redundant questions and re-explanations

## Critical User Actions Still Needed

- [ ] Add SUPABASE_ACCESS_TOKEN to GitHub repository secrets
- [ ] Merge PR: claude/frontend-control-panel-refactor-WCPud → main
- [ ] Disconnect Lovable: Lovable Settings → GitHub → Disconnect
- [ ] Set GitHub branch protection on main (require PR + review)
- [ ] Add broker API keys to Render dashboard (TRADIER, BINANCE, KRAKEN, IBKR)
- [ ] Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to Render

## MCP Servers (Claude Code local, ~/.claude/mcp.json)

- **memory** — persistent knowledge graph across sessions (`@modelcontextprotocol/server-memory`)
- **stripe** — Stripe API tools (needs STRIPE_SECRET_KEY)
- **supabase** — Supabase DB/auth tools (needs service role key)

All installed at `/opt/node22/lib/node_modules/`. Restart Claude Code to load.

## Health Check URLs

```bash
curl https://aiqtp-trading-service.onrender.com/health
curl https://aiqtp-trading-service.onrender.com/brokers
curl https://aiqtp-quantum-agent.onrender.com/health
curl https://rueaxiyvseaxkysnoock.supabase.co/rest/v1/ -H "apikey: <anon_key>"
```
