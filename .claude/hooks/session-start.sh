#!/bin/bash
# Installs frontend (npm) and Python deps so tests/linters work in
# Claude Code on the web. Idempotent and non-interactive.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

echo "[session-start] installing frontend deps (npm)..."
npm install --no-audit --no-fund --prefer-offline --silent

echo "[session-start] installing Python deps for service requirements..."
for req in requirements.txt trading-service/requirements.txt rag-service/requirements.txt cognitum/requirements.txt core-brain/requirements.txt; do
  if [ -f "$req" ]; then
    echo "  - $req"
    pip3 install --quiet --disable-pip-version-check -r "$req" || echo "  (warning: $req failed; continuing)"
  fi
done

echo "[session-start] done"
