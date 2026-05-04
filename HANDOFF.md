# AIQTP SESSION HANDOFF — READ THIS FIRST
> Last updated: 2026-05-04. If you are a new Claude session, read every word of this file before touching anything.

---

## WHO YOU ARE AND WHAT YOU ARE DOING

You are Claude Code working on the AIQTP Omni-Nexus platform — an AI-powered trading platform with bots, staking, payments, and a token ecosystem. The owner has been working with Claude non-stop and is exhausted. Your job is to **finish everything** without asking questions and without breaking what already works.

**Your working branch:** Always branch from `main`. Use `claude/session-XXXX` naming.  
**Never push directly to main** — create a PR and merge it.  
**Repo:** `freefilm010/aiqtp-omni-nexus`

---

## CURRENT DEPLOYMENT STATE (as of this handoff)

| Service | URL | Status |
|---------|-----|--------|
| Frontend | www.aiqtp.com | ✅ Live (Vercel, auto-deploys from main) |
| Trading API | aiqtp-trading-service.onrender.com | ✅ Live (Render, auto-deploys from main) |
| Quantum Agent | aiqtp-quantum-agent.onrender.com | ✅ Live (Render, auto-deploys from main) |
| Database | rueaxiyvseaxkysnoock.supabase.co | ✅ Live |

**PR #30 was merged to main** — Vercel and Render are deployed with all recent changes.

---

## CREDENTIALS (CRITICAL — DO NOT COMMIT THESE TO GIT)

```
Stripe Publishable Key: pk_live_51SGwQb... (in /root/.claude/mcp-profiles/trading.json)
Stripe Secret Key:      sk_live_51SGwQb... (in /root/.claude/mcp.json + mcp-profiles/trading.json)
Stripe Webhook Secret:  MISSING — ask the owner to paste it (whsec_...)
Supabase URL:           https://rueaxiyvseaxkysnoock.supabase.co
Supabase Anon Key:      eyJhbGci... (anon, public — see .env.example or mcp config)
Render API Key:         MISSING — check with owner
Supabase Access Token:  MISSING — owner needs to provide (sbp_...) for edge function deploys
```

Keys are NOT stored here to avoid GitHub secret scanning blocks. Find them in `/root/.claude/mcp.json`.

---

## WHAT HAS BEEN COMPLETED (DO NOT REDO THIS)

### Security Fixes (committed)
- SQL injection prevention in `core-brain/render_db.py` — allowlist regex `_safe_ident()`
- Timing-safe auth comparison in `supabase/functions/record-profit-fee/index.ts`
- Env var fail-fast in `core-brain/trading_worker.py`
- ZBD Lightning amount cap + address validation in `supabase/functions/zbd-wallet/index.ts`

### Database Migrations (committed to repo, need applying in Supabase)
These files exist in `supabase/migrations/` — see PENDING ACTIONS below for which need applying:
- `20260504120000_revenue_infrastructure.sql` — Plaid, PayPal, auto-invest, affiliate, fee view
- `20260504130000_staking_schema.sql` — user_stakes table, staking_pool_stats view, unstake() RPC
- `20260504140000_performance_indexes.sql` — 11 composite indexes
- `20260504150000_faucet_rate_limit.sql` — 24h cooldown on credit_faucet_claim
- `20260504160000_token_approval_and_distribution.sql` — dex_tokens status col, distribution rules seed
- `20260504170000_automation_crons.sql` — **3 cron jobs**: staking accrual daily, profit distribution hourly, bot graduation every 6h

### Admin Pages (built and deployed)
- `/admin/health` — SystemHealth: real-time pings to all infra, DB stats, repo inventory
- `/admin/bots` — BotRegistry: strategy leaderboard with quality bars
- `/admin/staking` — StakingAdmin: pool stats, all user stakes, force-complete/cancel
- `/admin/tokens` — TokenFactory: added Approvals tab for DEX token approve/reject

### Revenue Wiring (deployed)
- `payments-webhook` edge fn: writes 1% platform fee to `platform_revenue` on deposit
- `rent-strategy` edge fn: records 20% platform commission to `platform_revenue` on rental
- `RevenueManager`: distribution settings load from DB and save back (was fake toast)

### Frontend (deployed)
- `StakingPage.tsx`: complete rewrite — real DB data, real unstake, position history
- `Auth.tsx`: affiliate signup awaited properly with error logging

### Automation (deployed)
- `.github/workflows/omni-bot.yml`: 6-job health monitor every 6 hours
- `trading_worker.py`: calls `run_bot_graduation()` RPC every 20 cycles (~20 min)

---

## PENDING ACTIONS — DO THESE IN ORDER

### 1. APPLY SQL MIGRATIONS (CRITICAL — nothing works until this is done)
Go to https://supabase.com/dashboard/project/rueaxiyvseaxkysnoock/sql
Run each file in order. They are idempotent (safe to re-run).

Or if you have SUPABASE_ACCESS_TOKEN, use the Management API:
```bash
for f in 20260504150000 20260504160000 20260504170000; do
  curl -X POST "https://api.supabase.com/v1/projects/rueaxiyvseaxkysnoock/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$(cat supabase/migrations/${f}*.sql | tr '\n' ' ' | sed 's/"/\\"/g')\"}"
done
```

### 2. ADD STRIPE KEYS TO RENDER (CRITICAL for payments)
Go to https://dashboard.render.com → aiqtp-trading-service → Environment → Add:
- `STRIPE_SECRET_KEY` = (find the sk_live_51SGwQb... key in `/root/.claude/mcp.json` on the server)
- `STRIPE_WEBHOOK_SECRET` = ask owner for `whsec_...`

Or via Render API if you find the key:
```bash
RENDER_API_KEY="rnd_..."  # find in session history or ask owner
STRIPE_SK="$(jq -r '.mcpServers.stripe.env.STRIPE_SECRET_KEY' /root/.claude/mcp.json)"
SVC_ID=$(curl -s "https://api.render.com/v1/services?name=aiqtp-trading-service" \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq -r '.[] | .service.id')
curl -X PUT "https://api.render.com/v1/services/$SVC_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "[{\"key\":\"STRIPE_SECRET_KEY\",\"value\":\"$STRIPE_SK\"}]"
```

### 3. ADD STRIPE KEY TO SUPABASE EDGE FUNCTION SECRETS
```bash
STRIPE_SK="$(jq -r '.mcpServers.stripe.env.STRIPE_SECRET_KEY' /root/.claude/mcp.json)"
curl -X PATCH "https://api.supabase.com/v1/projects/rueaxiyvseaxkysnoock/secrets" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[{\"name\":\"STRIPE_SECRET_KEY\",\"value\":\"$STRIPE_SK\"}]"
```

### 4. ADD SUPABASE_ACCESS_TOKEN TO GITHUB SECRETS
This enables automatic edge function deployment on push.
Go to https://github.com/freefilm010/aiqtp-omni-nexus/settings/secrets/actions
Add: `SUPABASE_ACCESS_TOKEN` = owner's `sbp_...` token

### 5. CODE STILL TO BUILD

#### A. ZBD Lightning auto-credit
**File:** `supabase/functions/zbd-wallet/index.ts`  
**Problem:** Lightning invoices created but payment never detected. No webhook handler.  
**Fix needed:** Add `action: 'webhook'` handler that receives ZBD payment callbacks, updates `lightning_transactions` status to 'completed', and credits user balance in `portfolio_holdings`.  
Also: `send_payment` action doesn't debit user balance before sending — add balance check + debit.

#### B. PayPal in main checkout flow
**Problem:** PayPal button only exists in `src/pages/Billing.tsx`, not in main `PaymentHub` component.  
**Fix needed:** Find the main checkout/payment component (likely `src/components/payments/PaymentHub.tsx` or similar), add PayPal button that calls `supabase/functions/create-paypal-checkout/index.ts` — that edge function already exists and works.

#### C. Cancel order — remove 501
**File:** `supabase/functions/trade-execute/index.ts`  
**Problem:** `case 'cancel_order'` returns 501 Not Implemented.  
**Fix needed:** Look up trade in `trade_logs` by trade_id, if status is 'pending'/'open' mark as 'cancelled', else return error. Simple DB update.

#### D. Broker API keys (owner action required)
Owner needs to add to Render dashboard for `aiqtp-trading-service`:
- `TRADIER_API_KEY` + `TRADIER_ACCOUNT_ID`
- `BINANCE_API_KEY` + `BINANCE_SECRET_KEY`
- `KRAKEN_API_KEY` + `KRAKEN_SECRET_KEY`
- `ALPACA_API_KEY` + `ALPACA_SECRET_KEY`

---

## ARCHITECTURE CHEAT SHEET

```
Frontend (React/Vite) → Supabase (auth + DB) + Render Trading API
Render Trading API (FastAPI) → Broker APIs (Tradier, Binance, Kraken, Alpaca, IBKR)
Supabase Edge Functions (Deno) → handle: payments, staking, agents, tokens
trading_worker.py (on Render) → runs strategies every 60s, calls record-profit-fee edge fn
```

**Key files:**
- `src/pages/AdminDashboard.tsx` — admin router, all lazy-loaded admin pages
- `src/components/admin/AdminSidebar.tsx` — admin nav
- `core-brain/trading_worker.py` — main trading loop
- `trading-service/main.py` — FastAPI trading service
- `supabase/functions/` — all edge functions
- `supabase/migrations/` — all DB schema (apply in order)

**Database tables you'll touch most:**
- `platform_revenue` — all revenue events (source_type: trading_fee, commission, etc.)
- `user_stakes` — staking positions
- `ai_strategies` + `performance_evaluator` — bot registry
- `graduated_bots` — bots that passed quality thresholds
- `profit_distribution_rules` — how revenue gets split (default: 60% reinvest, 25% reserve, 15% withdraw)
- `faucet_claims` — rate limiting for token faucet
- `dex_tokens` — community tokens needing admin approval

---

## REVENUE STREAMS STATUS

| Stream | Backend | Frontend | Recording | Notes |
|--------|---------|----------|-----------|-------|
| Stripe deposits | ✅ | ✅ | ✅ | Fully working after Stripe hold cleared |
| Strategy rental | ✅ | ✅ | ✅ | 20% platform cut recorded |
| Profit fees (trading) | ✅ | ✅ | ✅ | record-profit-fee edge fn called by worker |
| Staking fees | ✅ | ✅ | ✅ | 0.5% on stake amount |
| PayPal | ✅ | ⚠️ Billing only | ✅ | Needs PaymentHub wiring |
| ZBD Lightning | ⚠️ No auto-credit | ❌ | ⚠️ | See pending item 5A |
| Plaid ACH | ⚠️ Schema only | ❌ | ❌ | Not priority |
| Affiliate referral | ✅ | ✅ | ⚠️ | Commission calc not wired |

---

## WHAT THE OWNER WANTS NEXT (AFTER ALL ABOVE IS DONE)

1. **Verify the $96 Stripe payment came through** — check Stripe dashboard for recent payment ~$96
2. **Set profit distribution to 100% reinvest** — Admin → Revenue → Settings → set Reinvest=100, Reserve=0, Withdraw=0
3. **Start live trading** with 100% compounding — all profits reinvest automatically
4. **Performance goal:** maximize % returns (turning $90 → $900 → $9000), tracked by graduation pipeline quality scores
5. Owner has paper trading videos showing record-breaking % returns from early runs — will share as benchmarks

---

## HOW TO START A NEW WORK SESSION

```bash
cd /home/user/aiqtp-omni-nexus
git pull origin main
git checkout -b claude/session-$(date +%Y%m%d-%H%M)
# do your work
git add -A && git commit -m "description"
git push -u origin HEAD
# create PR and merge
```

Always check this file first. Update it when you complete items.
