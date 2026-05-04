# AIQTP Omni-Nexus — Architecture & Sync Rules

## Admin Credentials (DO NOT HARDCODE — reference only)

| Field | Value |
|-------|-------|
| Username | tokenmac1 |
| Primary email | 1drrey@gmail.com |
| Secondary email | 1drrey@duck.com |
| Info email | aiqtpinfo@gmail.com |
| Crypto email | aiquantcrypto@gmail.com |

Admin role auto-assigned via Supabase trigger `assign_admin_to_approved_emails()` on user creation.
Render admin gated via `ADMIN_USER_IDS` env var (set to admin's Supabase user UUID).

## Agent Army — Full Inventory

| Agent | Page | Backend | Status |
|-------|------|---------|--------|
| **QAQI** (Quantum AI) | /qaqi | qaqi-agent edge fn + multi-agent-orchestrator | 🟢 LIVE |
| **AIQTP Agent** (Classical AI) | /qaqi (tab) | qaqi-agent edge fn | 🟢 LIVE |
| **HiveMind** (Swarm consensus) | /hive-mind | Supabase RT, swarm_agents table | 🟢 LIVE |
| **TitanCodex** (Quantum+Energy) | /titan-codex | quantumSentinel lib, token_balances | 🟢 LIVE |
| **QuantClaw** (Dev/Research) | /quantclaw | agent_directives→Render worker, qaqi-agent | 🟢 LIVE |
| **Cognitum** (MEV swarm) | cognitum/ Python | Flashbots/Bitquery, Engram memory | 🟡 READY |
| **Core Brain Worker** | Render worker | trading_worker.py, strategy_registry | 🟢 LIVE |

### QAQI Army Mode
When Army toggle is ON, QAQI fans out to 11 AI models simultaneously:
Gemini 2.5 Flash Lite, Gemini 2.5 Flash, Gemini Pro 2.5, Gemini 3 Flash, Gemini 3.1 Pro,
GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-5.2, Claude Sonnet 4.5, Claude Haiku 4.
A judge model (Claude) synthesizes the best unified answer.

### QuantClaw Tools
- **Wired & working**: freqtrade_backtest, freqtrade_optimize, ccxt_sim_order, ccxt_live_order, factor_generation
- **Needs fix**: search_trading_code, search_quant_research, search_onchain (calls qaqi-agent but QAQI doesn't do RAG)
- **UI only (no worker)**: social_media_post, marketing_campaign, content_generator, campaign_scheduler → call quantclaw-marketing edge fn directly

### Known Bugs (tracked)
- `qaqi-agent` returned `model` not `model_used` → **FIXED** (added both fields)
- Token creator launch() was a stub → **FIXED** (writes to dex_tokens)
- Consistency graduation threshold was 85% → **CHANGED TO 70%**
- Profit split was 25/75 → **CHANGED TO 50/50**

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

## Bootstrap / Setup — Going from Zero to Live

This documents the exact steps to stand up a fresh Supabase connection after the Lovable
handoff. The Supabase project ref is `rueaxiyvseaxkysnoock`.

### Prerequisites

- A Supabase personal access token (get one at https://supabase.com/dashboard/account/tokens)
- A GitHub personal access token with `workflow` scope (only needed to trigger deploy via API)
- All broker/payment API keys at hand

### Step 1 — Apply the two new SQL migrations

The database schema already exists from Lovable-era migrations. Two new migrations
(revenue infrastructure + staking) must be applied manually via the SQL editor:

1. Open: https://supabase.com/dashboard/project/rueaxiyvseaxkysnoock/sql
2. Paste the contents of `scripts/apply-new-migrations.sql` and click **Run**
3. The script is idempotent — safe to run multiple times (uses `IF NOT EXISTS` + exception guards)

Migrations included:
- `supabase/migrations/20260504120000_revenue_infrastructure.sql` — Plaid ACH, PayPal,
  auto-invest cron, affiliate referral codes, platform fee view
- `supabase/migrations/20260504130000_staking_schema.sql` — user_stakes table, RLS policies,
  staking_pool_stats view, unstake() RPC

### Step 2 — Set Supabase edge function secrets

Run the interactive bootstrap script to push all required secrets to the Supabase project
via the Management API, then trigger an edge function deploy:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."   # from supabase.com/dashboard/account/tokens
export GITHUB_TOKEN="ghp_..."            # GitHub token with workflow scope (optional)
bash scripts/supabase-bootstrap.sh
```

The script will prompt for:

| Secret | Notes |
|--------|-------|
| ANTHROPIC_API_KEY | From console.anthropic.com |
| STRIPE_SECRET_KEY | From dashboard.stripe.com |
| STRIPE_WEBHOOK_SECRET | From Stripe webhook endpoint settings |
| PAYPAL_CLIENT_ID | From developer.paypal.com |
| PAYPAL_CLIENT_SECRET | From developer.paypal.com |
| PAYPAL_MODE | Hardcoded to `live` |
| PLAID_CLIENT_ID | Optional — skip if not using bank linking |
| PLAID_SECRET | Optional |
| PLAID_ENV | Hardcoded to `production` if Plaid creds provided |

All values are transmitted directly to the Supabase Management API over HTTPS and stored
encrypted. They do not appear in shell history (`read -s`).

### Step 3 — Deploy edge functions

If `GITHUB_TOKEN` was provided in Step 2, the workflow dispatch fires automatically.
Otherwise, trigger it manually:

- **Via GitHub UI**: https://github.com/aiqtp/aiqtp-omni-nexus/actions/workflows/deploy-all.yml
  → "Run workflow" → branch: main
- **Via merge**: Any merge to main auto-triggers `deploy-all.yml`

Monitor the deploy at: https://github.com/aiqtp/aiqtp-omni-nexus/actions

### Step 4 — Add remaining secrets to Render

Secrets for the trading-service and quantum-agent live on Render, not Supabase.
Add them at: https://dashboard.render.com → select service → Environment

See the Services & API Keys table above for the full list.

### Step 5 — Add SUPABASE_ACCESS_TOKEN to GitHub repository secrets

Required for `deploy-all.yml` to run on merges:

1. https://github.com/aiqtp/aiqtp-omni-nexus/settings/secrets/actions
2. New repository secret → Name: `SUPABASE_ACCESS_TOKEN` → Value: `sbp_...`

### Scripts reference

| File | Purpose |
|------|---------|
| `scripts/supabase-bootstrap.sh` | Sets all Supabase edge function secrets via Management API + triggers GitHub Actions deploy |
| `scripts/apply-new-migrations.sql` | Combined idempotent SQL for both new migrations — paste into SQL editor |

## Health Check URLs

```bash
curl https://aiqtp-trading-service.onrender.com/health
curl https://aiqtp-trading-service.onrender.com/brokers
curl https://aiqtp-quantum-agent.onrender.com/health
curl https://rueaxiyvseaxkysnoock.supabase.co/rest/v1/ -H "apikey: <anon_key>"
```
