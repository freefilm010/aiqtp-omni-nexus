# AIQTP — Sovereignty Runbook

**Objective: the platform is the single source of truth. No vendor can hold it hostage.**

This repo now runs end-to-end on hardware you control. Lovable, Supabase Inc., Vercel and
Render become *optional mirrors*, not dependencies. Any agent (Claude Code, Cursor, Codex,
a human team) can clone this repo and stand up an identical, complete platform.

---

## 1. What "sovereign" means here, concretely

| Layer | Vendor today | Sovereign replacement | Location |
|---|---|---|---|
| Database | Supabase cloud Postgres | `supabase/postgres` container (or your own Postgres / Oracle host) | `docker-compose.yml` → `db` |
| Auth | Supabase Auth | GoTrue container, same JWT contract | `db`, `auth` |
| Data API | Supabase REST | PostgREST container | `rest` |
| Realtime | Supabase Realtime | Realtime container | `realtime` |
| Storage | Supabase Storage | Storage container on local disk | `storage` |
| Edge functions (52) | Supabase Functions | `supabase/edge-runtime` + router | `functions`, `docker/edge-main/index.ts` |
| Frontend CDN | Vercel | Vite build + nginx behind Caddy | `docker/Dockerfile.web` |
| Python trading/quant | Render | `trading-tools`, `worker`, `rag` containers | `docker/Dockerfile.*` |
| TLS / routing | Vercel + Render edges | Caddy, auto Let's Encrypt | `docker/Caddyfile` |
| LLM inference | Paid APIs | Ollama container (Hermes / local models) | `ollama` |

**Zero application code changes are required.** The Caddy API surface is wire-compatible
with `supabase-js`: `/auth/v1`, `/rest/v1`, `/realtime/v1`, `/storage/v1`, `/functions/v1`.
You only repoint two build-time variables:

```
VITE_SUPABASE_URL=https://api.aiqtp.com
VITE_SUPABASE_PUBLISHABLE_KEY=<your ANON_KEY>
```

---

## 2. One-command takeover

On a fresh VPS (4 vCPU / 16 GB / 200 GB NVMe is sufficient; Docker + Docker Compose installed):

```bash
git clone https://github.com/freefilm010/aiqtp-omni-nexus.git && cd aiqtp-omni-nexus
cp .env.example .env          # fill POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY,
                              # SERVICE_ROLE_KEY, APP_DOMAIN, API_DOMAIN
export CLOUD_DB_URL="postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres"

./scripts/sovereign-takeover.sh all
```

That runs, in order:

1. **export** — `pg_dump` of `public` + `auth` + `storage` (schema **and** data), all 243
   migrations, all 52 edge functions, and a per-table row-count snapshot.
2. **import** — restores into your own Postgres and **diffs row counts against the cloud
   snapshot**, writing any discrepancy to `sovereign-export/db/ROW-COUNT-DIFF.txt`.
   Migration is not declared successful unless that diff is reviewed.
3. **up** — builds and starts every container, provisioning TLS for your domains.
4. **verify** — probes auth, REST, storage, edge functions, trading service and the
   frontend, and exits non-zero if any surface is down.

### Generating the keys

```bash
node -e 'const c=require("crypto");console.log("JWT_SECRET="+c.randomBytes(32).toString("hex"))'
# then, with that secret:
node -e 'const j=require("jsonwebtoken");const s=process.env.JWT_SECRET;
 console.log("ANON_KEY="+j.sign({role:"anon",iss:"supabase"},s,{expiresIn:"10y"}));
 console.log("SERVICE_ROLE_KEY="+j.sign({role:"service_role",iss:"supabase"},s,{expiresIn:"10y"}))'
```

---

## 3. Using a different database (Oracle, managed Postgres, on-prem SQL)

The only hard requirement is **PostgreSQL 15+** — RLS policies, `SECURITY DEFINER`
functions and PostgREST all depend on Postgres semantics. Two supported shapes:

- **Managed/own Postgres host:** delete the `db` service, and point `DATABASE_URL`,
  `PG_META_DB_HOST`, `SUPABASE_DB_URL` and PostgREST's `PGRST_DB_URI` at your host.
- **Oracle as the system of record:** keep Postgres as the operational store and replicate
  to Oracle via logical decoding (`pgoutput` → Debezium → Oracle). Treat Oracle as the
  archival/reporting tier. Do **not** attempt to run RLS-dependent app logic on Oracle
  directly; the policy model does not translate and would silently drop access controls.

---

## 4. Multi-agent development without lock-in

The repository is the contract. Anything an agent needs is in-tree:

- `supabase/migrations/` — full, ordered schema history (243 files).
- `supabase/functions/` — all 52 backend functions, plain Deno/TypeScript.
- `docker-compose.yml` + `docker/` — the complete runtime.
- `scripts/sovereign-takeover.sh` — reproducible environment from zero.
- `CLAUDE.md`, `AIQTP-Project/*.md` — architecture and decision record.

Rule for every agent, human or model: **branch → PR → `main`**. `main` is the single source
of truth; every environment (VPS, cloud mirror, preview) deploys *from* it and never *to* it.

---

## 5. Kill-switch / disaster drill

```bash
docker compose exec -T db pg_dumpall -U postgres | gzip > backup-$(date +%F).sql.gz
./scripts/sovereign-takeover.sh verify      # must exit 0
```

Run the drill weekly. If the cloud vendor disappears mid-week, the last drill is your
recovery point, and nothing in the recovery path touches a third party.
