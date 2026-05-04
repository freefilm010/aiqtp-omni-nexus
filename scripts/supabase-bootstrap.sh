#!/usr/bin/env bash
# =============================================================================
# Supabase Bootstrap — AIQTP Omni-Nexus
# Project ref: rueaxiyvseaxkysnoock
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN="sbp_..."
#   export GITHUB_TOKEN="ghp_..."          # optional — triggers edge-fn deploy
#   bash scripts/supabase-bootstrap.sh
#
# OR pass the access token as the first argument:
#   bash scripts/supabase-bootstrap.sh sbp_...
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_REF="rueaxiyvseaxkysnoock"
SUPABASE_API="https://api.supabase.com"
GITHUB_REPO="aiqtp-omni-nexus"          # adjust if org/repo differ
GITHUB_OWNER="aiqtp"                    # adjust if org/repo differ
WORKFLOW_FILE="deploy-all.yml"
GITHUB_BRANCH="main"

# ---------------------------------------------------------------------------
# Resolve access token
# ---------------------------------------------------------------------------
if [[ -n "${1:-}" ]]; then
  SUPABASE_ACCESS_TOKEN="$1"
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo ""
  echo "ERROR: SUPABASE_ACCESS_TOKEN is not set."
  echo "  Set it as an env var:  export SUPABASE_ACCESS_TOKEN=sbp_..."
  echo "  Or pass it as arg 1:   bash $0 sbp_..."
  exit 1
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}  [OK]${NC}  $*"; }
fail() { echo -e "${RED}  [FAIL]${NC} $*"; }
info() { echo -e "${YELLOW}  [--]${NC}  $*"; }

prompt_secret() {
  local var_name="$1"
  local label="$2"
  local optional="${3:-required}"
  local value=""

  if [[ "$optional" == "optional" ]]; then
    read -rsp "  $label (leave blank to skip): " value
    echo ""
    if [[ -z "$value" ]]; then
      info "Skipping $var_name (optional)"
      echo ""
      return
    fi
  else
    while [[ -z "$value" ]]; do
      read -rsp "  $label: " value
      echo ""
      if [[ -z "$value" ]]; then
        echo "  This secret is required. Please enter a value."
      fi
    done
  fi

  SECRETS+=("{\"name\":\"${var_name}\",\"value\":\"${value}\"}")
}

set_secrets_batch() {
  local payload="[$( IFS=','; echo "${SECRETS[*]}" )]"
  local http_status

  http_status=$(curl -s -o /tmp/supabase_secrets_response.json -w "%{http_code}" \
    -X POST \
    "${SUPABASE_API}/v1/projects/${PROJECT_REF}/secrets" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ "$http_status" == "200" || "$http_status" == "201" ]]; then
    ok "All secrets set successfully (HTTP $http_status)"
  else
    fail "Secret upload failed (HTTP $http_status)"
    echo "  Response:"
    cat /tmp/supabase_secrets_response.json 2>/dev/null || true
    echo ""
    return 1
  fi
}

trigger_github_workflow() {
  if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    info "GITHUB_TOKEN not set — skipping workflow_dispatch trigger"
    info "  To deploy edge functions, either:"
    info "    a) Merge a commit to main (triggers auto-deploy), or"
    info "    b) Re-run with: export GITHUB_TOKEN=ghp_... && bash $0"
    return
  fi

  local url="https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches"
  local payload="{\"ref\":\"${GITHUB_BRANCH}\"}"
  local http_status

  http_status=$(curl -s -o /tmp/gh_dispatch_response.json -w "%{http_code}" \
    -X POST "$url" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ "$http_status" == "204" ]]; then
    ok "GitHub Actions workflow_dispatch triggered: ${WORKFLOW_FILE}"
    info "  Monitor at: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions"
  else
    fail "workflow_dispatch failed (HTTP $http_status)"
    cat /tmp/gh_dispatch_response.json 2>/dev/null || true
    echo ""
    info "  You can trigger the workflow manually at:"
    info "  https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}"
  fi
}

# ---------------------------------------------------------------------------
# Verify access token is valid before proceeding
# ---------------------------------------------------------------------------
echo ""
echo "======================================================================="
echo " AIQTP Supabase Bootstrap"
echo " Project: ${PROJECT_REF}"
echo "======================================================================="
echo ""
info "Verifying Supabase access token..."

VERIFY_STATUS=$(curl -s -o /tmp/supabase_verify.json -w "%{http_code}" \
  "${SUPABASE_API}/v1/projects/${PROJECT_REF}" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}")

if [[ "$VERIFY_STATUS" == "200" ]]; then
  PROJECT_NAME=$(python3 -c "import json,sys; d=json.load(open('/tmp/supabase_verify.json')); print(d.get('name','unknown'))" 2>/dev/null || echo "unknown")
  ok "Token valid — project: ${PROJECT_NAME}"
else
  fail "Token verification failed (HTTP $VERIFY_STATUS)"
  echo "  Check your SUPABASE_ACCESS_TOKEN — get one at:"
  echo "  https://supabase.com/dashboard/account/tokens"
  cat /tmp/supabase_verify.json 2>/dev/null || true
  exit 1
fi

# ---------------------------------------------------------------------------
# Collect secrets interactively
# ---------------------------------------------------------------------------
echo ""
echo "-----------------------------------------------------------------------"
echo " Enter secrets for the Supabase project."
echo " Values are transmitted over HTTPS and stored encrypted in Supabase."
echo " They will NOT appear in your shell history (read -s)."
echo "-----------------------------------------------------------------------"
echo ""

declare -a SECRETS=()

# Always-required secrets
prompt_secret "ANTHROPIC_API_KEY"     "ANTHROPIC_API_KEY (from console.anthropic.com)"
prompt_secret "STRIPE_SECRET_KEY"     "STRIPE_SECRET_KEY (from dashboard.stripe.com)"
prompt_secret "STRIPE_WEBHOOK_SECRET" "STRIPE_WEBHOOK_SECRET (from Stripe webhook endpoint)"
prompt_secret "PAYPAL_CLIENT_ID"      "PAYPAL_CLIENT_ID (from developer.paypal.com)"
prompt_secret "PAYPAL_CLIENT_SECRET"  "PAYPAL_CLIENT_SECRET"

# Static/known value
SECRETS+=('{"name":"PAYPAL_MODE","value":"live"}')
info "PAYPAL_MODE set to: live (hardcoded)"
echo ""

# Optional secrets
prompt_secret "PLAID_CLIENT_ID" "PLAID_CLIENT_ID (from dashboard.plaid.com)" "optional"
prompt_secret "PLAID_SECRET"    "PLAID_SECRET"                                "optional"

# Static Plaid env (only add if Plaid creds were provided)
for s in "${SECRETS[@]}"; do
  if echo "$s" | grep -q '"PLAID_CLIENT_ID"'; then
    SECRETS+=('{"name":"PLAID_ENV","value":"production"}')
    info "PLAID_ENV set to: production (hardcoded)"
    echo ""
    break
  fi
done

# ---------------------------------------------------------------------------
# Upload all secrets in one batch request
# ---------------------------------------------------------------------------
echo ""
echo "-----------------------------------------------------------------------"
echo " Uploading ${#SECRETS[@]} secret(s) to Supabase..."
echo "-----------------------------------------------------------------------"

if ! set_secrets_batch; then
  echo ""
  echo "Bootstrap failed at secret upload step. Fix the error above and re-run."
  exit 1
fi

# ---------------------------------------------------------------------------
# Trigger edge function deploy via GitHub Actions
# ---------------------------------------------------------------------------
echo ""
echo "-----------------------------------------------------------------------"
echo " Triggering edge function deploy..."
echo "-----------------------------------------------------------------------"

trigger_github_workflow

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "======================================================================="
echo " Bootstrap Complete"
echo "======================================================================="
echo ""
echo "  Supabase dashboard:   https://supabase.com/dashboard/project/${PROJECT_REF}"
echo "  SQL editor:           https://supabase.com/dashboard/project/${PROJECT_REF}/sql"
echo "  Edge functions:       https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
echo "  Secrets/config:       https://supabase.com/dashboard/project/${PROJECT_REF}/settings/vault"
echo ""
echo "  Next steps:"
echo "  1. Apply new SQL migrations — run scripts/apply-new-migrations.sql in the SQL editor"
echo "     URL: https://supabase.com/dashboard/project/${PROJECT_REF}/sql"
echo "  2. Verify edge functions deployed:"
echo "     https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions"
echo "  3. Add remaining secrets to Render dashboard if not already done:"
echo "     https://dashboard.render.com"
echo ""
