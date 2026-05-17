# AIQTP Omni-Nexus — Ops Runbook

## Quick Start (Self-Hosted)

```bash
cp .env.example .env          # fill in required secrets
docker compose up -d          # starts full stack (~2 min cold start)
```

### Access
| Service | URL |
|---|---|
| QuantClaw UI (Kong) | http://localhost:8000 |
| Supabase Studio | http://localhost:3000 |
| RAG API | http://localhost:8001/docs |
| Trading Tools API | http://localhost:8002/docs |
| Qdrant Dashboard | http://localhost:6333/dashboard |
| Ollama | http://localhost:11434 |

---

## One-Command Deploy (Cloud)

```bash
chmod +x deploy.sh && ./deploy.sh
```

Prompts for 6 secrets, then automatically:
1. Sets Supabase edge function secrets
2. Seeds QTC/AIQ/NXS token data
3. Creates/updates Render Background Worker
4. Registers Stripe live webhook

---

## Service Architecture

```
User Browser
    │
    ▼
Kong :8000  ──►  PostgREST → PostgreSQL
    │         ──►  GoTrue (Auth)
    │         ──►  Realtime
    │         ──►  Storage
    │
    ├─► RAG Service :8001
    │       └── Qdrant :6333 (vectors)
    │       └── Ollama :11434 (embeddings + LLM)
    │
    ├─► Trading Tools :8002
    │       └── Alpaca API (live orders)
    │
    └─► Render Worker (background)
            └── agent_directives (Supabase polling)
```

---

## Ingesting the RAG Corpus

Initial ingest happens automatically on first start if Qdrant is empty.

Manual trigger:
```bash
curl -X POST http://localhost:8001/ingest \
  -H "Content-Type: application/json" \
  -d '{"tiers": [1, 2], "force": false}'
```

Check status:
```bash
curl http://localhost:8001/status
```

Add Tier 3 repos:
```bash
curl -X POST http://localhost:8001/ingest \
  -H "Content-Type: application/json" \
  -d '{"tiers": [3], "force": false}'
```

---

## Adding Repos to RAG Corpus

Edit `rag-service/repos.yaml`, then re-ingest:

```yaml
repos:
  - url: https://github.com/yourusername/yourrepo
    tier: 1                         # 1=always, 2=infra, 3=opt-in
    tags: [trading, strategy]
```

Then:
```bash
curl -X POST http://localhost:8001/ingest/trigger
```

---

## Alpaca Live Trading

1. Open QuantClaw → QAQI Agent tab
2. Enter Alpaca API Key + Secret → Save to Vault
3. Switch to QuantClaw-Prod agent
4. Use ccxt_live_order in Agent Tools → Trade

Safety guardrails (in trading_worker.py):
- **Max 20% NAV per order** (set by commit 638ef39 — review before enabling live
  trading at this size; consider tightening for production)
- 5 orders/hr per user_id rolling window — **NOTE: in-memory only, resets on
  every worker restart. Migrate to Postgres-backed counter before relying on it
  for production rate limiting.**
- Symbol whitelist (BTCUSD, ETHUSD, SOLUSD, AVAXUSD, LINKUSD by default)
- Paper mode guard (requires ALPACA_PAPER_MODE=false)
- Kill switch (fail-CLOSED): reads `system_status` table on every loop. On
  read error, trading HALTS until status is readable.
- ⚠️ The HTTP-exposed `POST /ccxt/live_order` route in trading-service does
  NOT currently honor the kill switch or enforce position-size limits.
  Currently gated off by `CCXT_LIVE_ENABLED=false` in production. Do not
  flip that flag without first wiring kill-switch + position-size checks
  into that route.

---

## Render Background Worker

The worker polls `agent_directives` every 60s (configurable via `LOOP_INTERVAL_SECONDS`).

To set SUPABASE_SERVICE_ROLE_KEY on Render:
1. Go to dashboard.render.com → your service → Environment
2. Add `SUPABASE_SERVICE_ROLE_KEY` = your key from Supabase dashboard

All other env vars are pre-set by deploy.sh or loaded from `account_key_vault`.

---

## Database Migrations

Migrations live in `supabase/migrations/`. Apply to Supabase Cloud:
```bash
supabase db push --project-ref rueaxiyvseaxkysnoock
```

Apply to self-hosted (mount at startup):
```yaml
volumes:
  - ./supabase/migrations:/docker-entrypoint-initdb.d:ro
```

---

## Ollama Model Management

Pull additional models:
```bash
docker compose exec ollama ollama pull mistral
docker compose exec ollama ollama pull nomic-embed-text
docker compose exec ollama ollama list
```

Switch embedding model (in .env):
```
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3
```

Use OpenAI instead (in .env):
```
OPENAI_API_KEY=sk-...
```
When `OPENAI_API_KEY` is set, the RAG service uses `text-embedding-3-small` for embeddings and `gpt-4o-mini` for answers, ignoring Ollama.

---

## Logs

```bash
docker compose logs -f rag           # RAG ingest/search
docker compose logs -f trading-tools # Freqtrade/ccxt
docker compose logs -f worker        # Render worker (local)
docker compose logs -f ollama        # model loading
docker compose logs -f qdrant        # vector ops
```

---

## Backups

PostgreSQL:
```bash
docker compose exec db pg_dump -U postgres postgres > backup.sql
```

Qdrant vectors:
```bash
docker compose exec qdrant \
  curl -s http://localhost:6333/collections/quantclaw_rag/snapshots \
  -X POST
```

---

## Troubleshooting

**RAG returns empty results**
- Check Qdrant status: `curl http://localhost:6333/collections/quantclaw_rag`
- If `points_count = 0`, trigger ingest: `curl -X POST http://localhost:8001/ingest/trigger`
- Check Ollama is up: `curl http://localhost:11434/api/tags`

**Ollama slow to respond**
- First query after model load is slow (cold start ~30s)
- Subsequent queries are cached in memory
- Add GPU: see Ollama Docker docs for `--gpus all`

**agent_directives not picked up**
- Worker polls every 60s — wait one cycle
- Check Render logs (or `docker compose logs worker`)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set on Render

**TypeScript build fails on Vercel**
- `vercel.json` already sets `installCommand: npm install --legacy-peer-deps`
- If still failing, check `package.json` overrides section

**Alpaca "unauthorized"**
- Verify keys in `account_key_vault` table (Supabase Studio → Table Editor)
- For live trading, ensure `ALPACA_PAPER_MODE=false` and you're using live API keys (not paper)
- Live API base URL: `https://api.alpaca.markets` (not paper URL)
