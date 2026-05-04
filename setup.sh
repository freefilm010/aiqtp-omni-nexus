#!/usr/bin/env bash
# =============================================================================
# setup.sh — AIQTP one-shot environment injection
# =============================================================================
# Injects VITE_RENDER_WORKER_URL and VITE_QUANTUM_AGENT_URL into your Vercel
# project for all three environments (production, preview, development).
#
# Prerequisites — add to .env (never commit):
#   VERCEL_TOKEN=<your token from vercel.com/account/tokens>
#   VITE_RENDER_WORKER_URL=<https://aiqtp-trading-service.onrender.com>
#   VITE_QUANTUM_AGENT_URL=<https://aiqtp-quantum-agent.onrender.com>
#
# Project is resolved from .vercel/project.json (committed in this repo).
# Optionally set VERCEL_ORG_ID in .env if your project is under a team.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Load .env ──────────────────────────────────────────────────────────────────
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -v '^#' "$REPO_ROOT/.env" | grep -v '^$' | sed 's/^export //')
  set +a
fi

MISSING=0
for VAR in VERCEL_TOKEN VITE_RENDER_WORKER_URL VITE_QUANTUM_AGENT_URL; do
  if [ -z "${!VAR:-}" ]; then
    echo "⚠  $VAR not set — skipping Vercel injection"
    MISSING=1
  fi
done

if [ "$MISSING" -eq 0 ]; then
  echo "→ Injecting Vercel env vars..."

  SCOPE_FLAG=""
  if [ -n "${VERCEL_ORG_ID:-}" ]; then
    SCOPE_FLAG="--scope $VERCEL_ORG_ID"
  fi

  for ENV in production preview development; do
    for VAR in VITE_RENDER_WORKER_URL VITE_QUANTUM_AGENT_URL; do
      VAL="${!VAR}"
      # Remove existing then re-add (idempotent)
      # shellcheck disable=SC2086
      vercel env remove "$VAR" "$ENV" \
        --token "$VERCEL_TOKEN" \
        $SCOPE_FLAG \
        --yes 2>/dev/null || true

      # shellcheck disable=SC2086
      echo "$VAL" | vercel env add "$VAR" "$ENV" \
        --token "$VERCEL_TOKEN" \
        $SCOPE_FLAG \
        --force
      echo "  ✓ $VAR → $ENV"
    done
  done

  echo "→ Triggering Vercel redeploy..."
  # shellcheck disable=SC2086
  vercel deploy --prod \
    --token "$VERCEL_TOKEN" \
    $SCOPE_FLAG \
    --yes 2>&1 | tail -5

  echo "✅ Vercel env vars injected and redeploy triggered."
else
  echo "ℹ  Add VERCEL_TOKEN, VITE_RENDER_WORKER_URL, VITE_QUANTUM_AGENT_URL"
  echo "   to .env then re-run: bash setup.sh"
fi
