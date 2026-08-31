#!/usr/bin/env bash
# =============================================================================
# AIQTP — SOVEREIGN TAKEOVER
# Moves the entire platform off Lovable / Supabase Inc. / Vercel / Render and
# onto infrastructure you own, in one run. Idempotent — safe to re-run.
#
#   ./scripts/sovereign-takeover.sh export    # pull everything from the cloud
#   ./scripts/sovereign-takeover.sh import    # load it into your own stack
#   ./scripts/sovereign-takeover.sh up        # boot the sovereign stack
#   ./scripts/sovereign-takeover.sh verify    # prove every surface is live
#   ./scripts/sovereign-takeover.sh all       # export → import → up → verify
#
# Required for `export` (from your own Supabase/Postgres credentials):
#   CLOUD_DB_URL   postgres://postgres:<pw>@db.<ref>.supabase.co:5432/postgres
# Required for `import`/`up`:
#   .env populated (see .env.example) — POSTGRES_PASSWORD, JWT_SECRET,
#   ANON_KEY, SERVICE_ROLE_KEY, APP_DOMAIN, API_DOMAIN
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${ROOT}/sovereign-export"
CMD="${1:-all}"

log()  { printf '\033[1;36m[sovereign]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[fail]\033[0m %s\n' "$*" >&2; exit 1; }

# ── 1. EXPORT ────────────────────────────────────────────────────────────────
do_export() {
  [ -n "${CLOUD_DB_URL:-}" ] || fail "CLOUD_DB_URL is not set. Export needs direct DB access."
  mkdir -p "$OUT"/{db,functions,storage}

  log "Dumping roles + schema (public, auth, storage) ..."
  pg_dump "$CLOUD_DB_URL" \
    --schema=public --schema=auth --schema=storage \
    --no-owner --no-privileges --schema-only \
    > "$OUT/db/01-schema.sql"

  log "Dumping ALL data (public + auth users + storage metadata) ..."
  pg_dump "$CLOUD_DB_URL" \
    --schema=public --schema=auth --schema=storage \
    --no-owner --no-privileges --data-only --disable-triggers \
    > "$OUT/db/02-data.sql"

  log "Snapshotting row counts for verification ..."
  psql "$CLOUD_DB_URL" -At -F',' -c "
    select relname, n_live_tup
    from pg_stat_user_tables
    where schemaname = 'public'
    order by n_live_tup desc" > "$OUT/db/ROW-COUNTS.csv"

  log "Copying edge functions ($(ls -1 "$ROOT/supabase/functions" | wc -l) functions) ..."
  cp -R "$ROOT/supabase/functions/." "$OUT/functions/"

  log "Copying migrations ($(ls -1 "$ROOT/supabase/migrations" | wc -l) files) ..."
  mkdir -p "$OUT/db/migrations"
  cp -R "$ROOT/supabase/migrations/." "$OUT/db/migrations/"

  log "Export complete → $OUT ($(du -sh "$OUT" | cut -f1))"
}

# ── 2. IMPORT ────────────────────────────────────────────────────────────────
do_import() {
  [ -f "$ROOT/.env" ] || fail ".env missing — copy .env.example and fill it in."
  # shellcheck disable=SC1091
  set -a; . "$ROOT/.env"; set +a
  [ -f "$OUT/db/01-schema.sql" ] || fail "No export found. Run: $0 export"

  log "Starting database only ..."
  docker compose up -d db
  until docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; do sleep 2; done

  local PSQL=(docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=0)

  log "Restoring schema ..."
  "${PSQL[@]}" < "$OUT/db/01-schema.sql" > "$OUT/db/restore-schema.log" 2>&1 || true

  log "Restoring data (this can take several minutes) ..."
  "${PSQL[@]}" < "$OUT/db/02-data.sql" > "$OUT/db/restore-data.log" 2>&1 || true

  log "Reconciling row counts against the cloud snapshot ..."
  "${PSQL[@]}" -At -F',' -c "
    select relname, n_live_tup from pg_stat_user_tables
    where schemaname='public' order by n_live_tup desc" > "$OUT/db/ROW-COUNTS-LOCAL.csv"
  diff <(sort "$OUT/db/ROW-COUNTS.csv") <(sort "$OUT/db/ROW-COUNTS-LOCAL.csv") \
    > "$OUT/db/ROW-COUNT-DIFF.txt" 2>&1 || true
  if [ -s "$OUT/db/ROW-COUNT-DIFF.txt" ]; then
    log "Row-count differences recorded in $OUT/db/ROW-COUNT-DIFF.txt (review before cutover)."
  else
    log "Row counts match the cloud exactly."
  fi
}

# ── 3. UP ────────────────────────────────────────────────────────────────────
do_up() {
  [ -f "$ROOT/.env" ] || fail ".env missing."
  log "Building and starting the full sovereign stack ..."
  docker compose up -d --build
  log "Stack up. App: https://${APP_DOMAIN:-localhost}  API: https://${API_DOMAIN:-localhost:8000}"
}

# ── 4. VERIFY ────────────────────────────────────────────────────────────────
do_verify() {
  # shellcheck disable=SC1091
  [ -f "$ROOT/.env" ] && { set -a; . "$ROOT/.env"; set +a; }
  local API="${API_EXTERNAL_URL:-http://localhost:8000}"
  local ok=0 bad=0

  check() {
    local label="$1" url="$2"; shift 2
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$@" "$url" || echo 000)
    if [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
      printf '  \033[1;32m✓\033[0m %-24s %s\n' "$label" "$code"; ok=$((ok+1))
    else
      printf '  \033[1;31m✗\033[0m %-24s %s\n' "$label" "$code"; bad=$((bad+1))
    fi
  }

  log "Verifying sovereign surfaces ..."
  check "auth (GoTrue)"     "$API/auth/v1/health"
  check "rest (PostgREST)"  "$API/rest/v1/" -H "apikey: ${ANON_KEY:-}"
  check "storage"           "$API/storage/v1/bucket" -H "Authorization: Bearer ${SERVICE_ROLE_KEY:-}"
  check "edge functions"    "$API/functions/v1/health"
  check "trading service"   "$API/trading/health"
  check "frontend"          "http://localhost:80" -H "Host: ${APP_DOMAIN:-localhost}"

  echo
  log "$ok healthy, $bad failing."
  [ "$bad" -eq 0 ] || exit 1
}

case "$CMD" in
  export) do_export ;;
  import) do_import ;;
  up)     do_up ;;
  verify) do_verify ;;
  all)    do_export; do_import; do_up; do_verify ;;
  *)      fail "Unknown command: $CMD (export|import|up|verify|all)" ;;
esac
