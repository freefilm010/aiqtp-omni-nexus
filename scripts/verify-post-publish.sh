#!/usr/bin/env bash
# Post-publish verification for auto_invest_allocations integrity.
#
# Usage:
#   ./scripts/verify-post-publish.sh                 # uses PG* env vars
#   DATABASE_URL=postgres://... ./scripts/verify-post-publish.sh
#
# Exits 0 only when:
#   1. the unique index uniq_auto_invest_allocation_active exists
#   2. active allocation rows == distinct (engine_id, asset_symbol) groups
set -uo pipefail

INDEX_NAME="uniq_auto_invest_allocation_active"
PSQL=(psql -X -A -t --no-psqlrc)
[ -n "${DATABASE_URL:-}" ] && PSQL+=("$DATABASE_URL")

run() { "${PSQL[@]}" -c "$1"; }

fail=0
echo "== Post-publish verification: auto_invest_allocations =="

idx=$(run "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname='${INDEX_NAME}';") || exit 2
if [ "${idx:-0}" = "1" ]; then
  echo "PASS  unique index ${INDEX_NAME} present"
else
  echo "FAIL  unique index ${INDEX_NAME} MISSING"
  fail=1
fi

read -r rows groups < <(run "SELECT count(*), count(DISTINCT (engine_id, asset_symbol)) FROM public.auto_invest_allocations WHERE is_active;" | tr '|' ' ') || exit 2
echo "      active rows=${rows} distinct groups=${groups}"
if [ "${rows}" = "${groups}" ]; then
  echo "PASS  no duplicate active allocations"
else
  echo "FAIL  $(( rows - groups )) duplicate active rows"
  fail=1
fi

dups=$(run "SELECT count(*) FROM (SELECT 1 FROM public.auto_invest_allocations WHERE is_active GROUP BY engine_id, asset_symbol HAVING count(*)>1) d;")
echo "      duplicate groups=${dups:-0}"

if [ "$fail" -eq 0 ]; then echo "RESULT: OK"; else echo "RESULT: FAILED"; fi
exit "$fail"
