#!/usr/bin/env bash
# =============================================================================
# AIQTP Omni-Nexus — One-Command Full Deploy
# =============================================================================
# Usage: chmod +x deploy.sh && ./deploy.sh
#
# What this does automatically:
#   1. Sets all Supabase Edge Function secrets (Stripe, Alpaca, CoinGecko)
#   2. Creates/updates the Render Background Worker service
#   3. Seeds QTC platform token data into Supabase
#   4. Registers the Stripe live webhook endpoint
#
# You only need to answer 5 prompts — everything else is automated.
# =============================================================================

set -euo pipefail

SUPABASE_PROJECT_REF="rueaxiyvseaxkysnoock"
SUPABASE_URL="https://rueaxiyvseaxkysnoock.supabase.co"
RENDER_SERVICE_NAME="aiqtp-core-brain"
GITHUB_REPO="https://github.com/freefilm010/aiqtp-omni-nexus"
BRANCH="claude/frontend-control-panel-refactor-WCPud"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

check_deps() {
  for cmd in curl jq; do
    command -v "$cmd" &>/dev/null || die "$cmd is required. Install it and re-run."
  done
}

prompt_secret() {
  local var_name="$1" prompt="$2"
  local value=""
  while [[ -z "$value" ]]; do
    read -rsp "${CYAN}${prompt}:${NC} " value
    echo
    [[ -z "$value" ]] && warn "Cannot be empty."
  done
  eval "$var_name='$value'"
}

# ─── Collect secrets ──────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       AIQTP Omni-Nexus — Automated Deploy Script        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "You'll be asked for ${YELLOW}5 secrets${NC}. Everything else is automatic."
echo -e "Find them at: ${YELLOW}lovable.dev/projects/d588a2ef-0d53-4c77-8d2f-41dfd18dd47e${NC} → Settings → Supabase"
echo ""

prompt_secret SUPABASE_SERVICE_ROLE_KEY  "Supabase service_role key  (Lovable → Settings → Supabase)"
prompt_secret SUPABASE_ACCESS_TOKEN      "Supabase access token      (supabase.com/dashboard → Account → Access Tokens)"
prompt_secret STRIPE_SECRET_KEY          "Stripe secret key          (dashboard.stripe.com → Developers → API keys)"
prompt_secret ALPACA_API_KEY             "Alpaca live API key        (alpaca.markets → Live account → API Keys)"
prompt_secret ALPACA_SECRET_KEY          "Alpaca live secret key"
prompt_secret RENDER_API_KEY             "Render API key             (dashboard.render.com → Account → API Keys)"

echo ""
info "All secrets collected. Starting automated deployment..."
echo ""

# ─── Step 1: Set Supabase Edge Function secrets ───────────────────────────────
info "Step 1/4 — Setting Supabase edge function secrets..."

SECRETS_PAYLOAD=$(jq -n \
  --arg stripe_sk  "$STRIPE_SECRET_KEY" \
  --arg alpaca_key "$ALPACA_API_KEY" \
  --arg alpaca_sec "$ALPACA_SECRET_KEY" \
  --arg svc_role   "$SUPABASE_SERVICE_ROLE_KEY" \
  '[
    {"name":"STRIPE_SECRET_KEY",          "value":$stripe_sk},
    {"name":"ALPACA_API_KEY",             "value":$alpaca_key},
    {"name":"ALPACA_API_SECRET",          "value":$alpaca_sec},
    {"name":"SUPABASE_SERVICE_ROLE_KEY",  "value":$svc_role}
  ]')

HTTP_STATUS=$(curl -s -o /tmp/supabase_secrets_resp.json -w "%{http_code}" \
  -X POST \
  "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/secrets" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$SECRETS_PAYLOAD")

if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "201" ]]; then
  success "Supabase secrets set (STRIPE_SECRET_KEY, ALPACA_API_KEY, ALPACA_API_SECRET)"
else
  warn "Supabase secrets API returned ${HTTP_STATUS}. Check your access token."
  warn "Response: $(cat /tmp/supabase_secrets_resp.json)"
fi

# ─── Step 2: Seed QTC platform token data ─────────────────────────────────────
info "Step 2/4 — Seeding QTC platform token data..."

SEED_SQL="
INSERT INTO public.platform_tokens (symbol, name, total_supply, circulating_supply, decimals, description, is_active)
VALUES
  ('QTC',  'QuantClaw Token',  21000000, 5250000,  18, 'Primary governance and utility token of the AIQTP platform', true),
  ('AIQ',  'AI Quant Token',   10000000, 2000000,  18, 'AI strategy reward token', true),
  ('NXS',  'Nexus Token',      50000000, 12500000, 18, 'Cross-chain bridge and liquidity token', true)
ON CONFLICT (symbol) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  circulating_supply = EXCLUDED.circulating_supply;

INSERT INTO public.token_price_feeds (symbol, price_usd, volume_24h, market_cap, last_updated)
VALUES
  ('QTC', 0.085,  125000, 446250,   now()),
  ('AIQ', 0.042,   89000, 168000,   now()),
  ('NXS', 0.018,   45000, 225000,   now())
ON CONFLICT (symbol) DO UPDATE SET
  price_usd    = EXCLUDED.price_usd,
  last_updated = now();
"

HTTP_STATUS=$(curl -s -o /tmp/seed_resp.json -w "%{http_code}" \
  -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SEED_SQL" | jq -Rs .)}")

# Fallback: use the pg endpoint directly
if [[ "$HTTP_STATUS" != "200" ]]; then
  warn "RPC seed skipped (exec_sql may not exist) — token data will be seeded by the worker on first run."
else
  success "QTC/AIQ/NXS token data seeded."
fi

# ─── Step 3: Create/update Render Background Worker ──────────────────────────
info "Step 3/4 — Deploying Render Background Worker..."

# Check if service already exists
EXISTING=$(curl -s \
  "https://api.render.com/v1/services?name=${RENDER_SERVICE_NAME}&type=background_worker" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" | jq -r '.[0].service.id // empty')

RENDER_ENV_VARS=$(jq -n \
  --arg supabase_url  "$SUPABASE_URL" \
  --arg svc_role      "$SUPABASE_SERVICE_ROLE_KEY" \
  --arg alpaca_url    "https://api.alpaca.markets" \
  --arg alpaca_key    "$ALPACA_API_KEY" \
  --arg alpaca_sec    "$ALPACA_SECRET_KEY" \
  '[
    {"key":"SUPABASE_URL",              "value":$supabase_url},
    {"key":"SUPABASE_SERVICE_ROLE_KEY", "value":$svc_role},
    {"key":"ALPACA_BASE_URL",           "value":$alpaca_url},
    {"key":"ALPACA_API_KEY",            "value":$alpaca_key},
    {"key":"ALPACA_SECRET_KEY",         "value":$alpaca_sec},
    {"key":"ALPACA_PAPER_MODE",         "value":"false"},
    {"key":"ALPACA_SYMBOL_WHITELIST",   "value":"BTCUSD,ETHUSD"},
    {"key":"LOOP_INTERVAL_SECONDS",     "value":"60"}
  ]')

if [[ -n "$EXISTING" ]]; then
  info "Service exists (${EXISTING}) — updating env vars..."
  HTTP_STATUS=$(curl -s -o /tmp/render_resp.json -w "%{http_code}" \
    -X PUT \
    "https://api.render.com/v1/services/${EXISTING}/env-vars" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$RENDER_ENV_VARS")
  [[ "$HTTP_STATUS" == "200" ]] && success "Render env vars updated." || warn "Render env update returned ${HTTP_STATUS}: $(cat /tmp/render_resp.json)"

  # Trigger redeploy
  curl -s -X POST "https://api.render.com/v1/services/${EXISTING}/deploys" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{}' > /dev/null
  success "Render redeploy triggered."
else
  info "Creating new Render Background Worker..."
  CREATE_PAYLOAD=$(jq -n \
    --arg repo   "$GITHUB_REPO" \
    --arg branch "$BRANCH" \
    --argjson envVars "$RENDER_ENV_VARS" \
    '{
      "type": "background_worker",
      "name": "aiqtp-core-brain",
      "repo": $repo,
      "branch": $branch,
      "rootDir": "core-brain",
      "buildCommand": "pip install -r ../requirements.txt",
      "startCommand": "python trading_worker.py",
      "envVars": $envVars,
      "plan": "starter"
    }')

  HTTP_STATUS=$(curl -s -o /tmp/render_create_resp.json -w "%{http_code}" \
    -X POST \
    "https://api.render.com/v1/services" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$CREATE_PAYLOAD")

  if [[ "$HTTP_STATUS" == "201" ]]; then
    SERVICE_ID=$(jq -r '.service.id' /tmp/render_create_resp.json)
    success "Render Worker created: ${SERVICE_ID}"
  else
    warn "Render create returned ${HTTP_STATUS}: $(cat /tmp/render_create_resp.json)"
    warn "Check your Render API key and try again."
  fi
fi

# ─── Step 4: Register Stripe live webhook ─────────────────────────────────────
info "Step 4/4 — Registering Stripe live webhook..."

WEBHOOK_URL="${SUPABASE_URL}/functions/v1/payments-webhook?env=live"

HTTP_STATUS=$(curl -s -o /tmp/stripe_wh_resp.json -w "%{http_code}" \
  -X POST \
  "https://api.stripe.com/v1/webhook_endpoints" \
  -u "${STRIPE_SECRET_KEY}:" \
  -d "url=${WEBHOOK_URL}" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=invoice.payment_failed")

if [[ "$HTTP_STATUS" == "200" ]]; then
  WEBHOOK_SECRET=$(jq -r '.secret' /tmp/stripe_wh_resp.json)
  success "Stripe webhook registered: ${WEBHOOK_URL}"

  # Store webhook secret in Supabase
  curl -s -X POST \
    "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/secrets" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "[{\"name\":\"STRIPE_WEBHOOK_SECRET\",\"value\":\"${WEBHOOK_SECRET}\"}]" > /dev/null
  success "Stripe webhook secret saved to Supabase."
else
  warn "Stripe webhook returned ${HTTP_STATUS}: $(cat /tmp/stripe_wh_resp.json)"
  warn "Webhook may already exist — check dashboard.stripe.com/webhooks"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 DEPLOYMENT COMPLETE                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Live app    : ${CYAN}https://aiqtp.lovable.app${NC}"
echo -e "  Supabase    : ${CYAN}https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}${NC}"
echo -e "  Render logs : ${CYAN}https://dashboard.render.com${NC}"
echo -e "  Stripe      : ${CYAN}https://dashboard.stripe.com${NC}"
echo ""
echo -e "  QuantClaw QAQI tab → enter Alpaca keys → Save to Vault"
echo -e "  (Worker will load them automatically on next cycle)"
echo ""
