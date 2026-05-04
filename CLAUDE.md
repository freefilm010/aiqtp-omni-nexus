# AIQTP Omni-Nexus — Architecture & Sync Rules

## Source of Truth: GitHub `main` branch

**GitHub main is the boss. Every platform follows it. Nobody overwrites it directly.**

## Platform Map

| URL | Platform | Deploys From | Purpose |
|-----|----------|-------------|---------|
| www.aiqtp.com | Vercel | GitHub main (auto) | Production frontend |
| aiqtp.vercel.app | Vercel | GitHub main (auto) | Vercel preview |
| aiqtp.lovable.app | Lovable | Lovable editor | UI preview only |
| aiqtp-trading-service.onrender.com | Render | GitHub main (auto) | Trading API |
| aiqtp-quantum-agent.onrender.com | Render | GitHub main (auto) | Quantum AI API |
| rueaxiyvseaxkysnoock.supabase.co | Supabase | Lovable publish | Edge functions + Auth |

## Branch Strategy

```
main              ← protected, production, never push directly
lovable           ← Lovable editor writes here
feature/*         ← Claude Code feature work
```

- **Lovable** → always commits to `lovable` branch → PR to main
- **Claude Code** → always branches from main → PR to main
- **Nobody** pushes directly to main

## Deployment Flow

```
Code change
    ↓
Branch (lovable/* or feature/*)
    ↓
Pull Request to main
    ↓
Merge to main
    ↓
Auto-deploy: Vercel + Render
Manual step: Lovable → Publish (syncs edge functions to Supabase)
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
| ALPACA_API_KEY | Render | Trading |

## Stack

- **Frontend**: React 19 / Vite 7 / TypeScript / TailwindCSS
- **Trading API**: FastAPI (Python 3.11) on Render
- **Quantum AI**: FastAPI (Python 3.11) on Render
- **Database**: Render PostgreSQL (primary) + Supabase (auth + edge functions)
- **Edge Functions**: Deno/TypeScript on Supabase (deployed via Lovable)

## Rules for Claude Code

1. Always `git pull origin main` before starting new work
2. Never push directly to main
3. Never hardcode secrets — use env vars
4. After merging to main, Vercel and Render auto-deploy — no manual step needed
5. Supabase edge function changes require user to hit Publish in Lovable

## Rules for Lovable

1. Pull latest from GitHub before making changes
2. Commit to `lovable` branch, not main
3. Never hardcode API keys in edge function code — use `Deno.env.get()`
4. After publishing, edge functions deploy to Supabase automatically

## Health Check URLs

```bash
curl https://aiqtp-trading-service.onrender.com/health
curl https://aiqtp-quantum-agent.onrender.com/health
curl https://rueaxiyvseaxkysnoock.supabase.co/rest/v1/ -H "apikey: <anon_key>"
```
