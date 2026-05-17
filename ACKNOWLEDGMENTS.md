# Acknowledgments

AIQTP™ Omni-Nexus is built and owned by **DRTRUST (Wyoming)**.

The platform exists because of substantial collaboration across modern AI tooling, the open-source ecosystem, and infrastructure providers. Listed here, with DRTRUST first and the rest in alphabetical order:

## Owner

- **DRTRUST** (Wyoming) — owner, direction, final decisions on architecture, product, and operations. Every commit, configuration, and release happens under DRTRUST direction.

## AI tooling

- **Anthropic Claude** — Claude Code and Claude Opus 4.7 (1M context). Architecture review, code generation, audits, refactors, regulatory research, and the system-wide cleanup of fabricated content captured in `AUDIT_2026-05-17.md`.
- **Claude Code** — the CLI agent built on Anthropic Claude, used for interactive development sessions.
- **Lovable** (lovable.dev) — initial project scaffolding and many iterative feature commits via the `gpt-engineer-app[bot]` integration. The React/Vite/shadcn-ui foundation, frontend layout, and many of the admin UI components originated here.
- **Manus AI** — Stripe auto-invest pipeline, multi-broker integrations (Hyperliquid, Jupiter, 1inch, CoinGecko, DeFi Llama, CCXT connectors), grid/DCA/arb/momentum strategies, and the gasless-bot army architecture.
- **NotebookLM** (Google) — research synthesis, regulatory exploration, and document ingestion. Notebook outputs informed early thinking on the GENIUS Act, post-quantum cryptography, and time-crystal physics research compiled in `AIQTP-Project/research-papers/`.
- **Ollama** — local LLM runtime backing the self-hosted RAG service (`rag-service/`) and powering offline embedding + inference.
- **OpenClaw** — internal AI agent framework used inside the platform's RAG service for code-corpus search and answer generation.
- **Replit** — development environment for early iterations.

## Open-source ecosystem

- **Frontend**: React 19, Vite 7, TypeScript 5.9, Tailwind CSS, shadcn-ui, Radix UI, TanStack Query, Recharts, lightweight-charts, lucide-react, Framer Motion, Sonner, Zod
- **Backend**: FastAPI, uvicorn, httpx, web3.py, pydantic, ccxt, Freqtrade
- **Data & infra**: Supabase (Postgres, GoTrue, Realtime, Storage, Edge Functions), Qdrant, Ollama, Kong, PostgREST
- **Trading & integrations**: Alpaca, Tradier, Binance, Kraken, IBKR, KuCoin, MEXC, Gate.io, Hyperliquid, Solana/Jupiter, 1inch, CoinGecko, DeFi Llama
- **Payments**: Stripe, PayPal, ZBD
- **Quantum**: IBM Qiskit Runtime, qiskit-ibm-runtime
- **Cryptography**: NIST post-quantum standards (ML-KEM Kyber, ML-DSA Dilithium, SLH-DSA SPHINCS+)
- **Security CI**: Semgrep, CodeQL, Trivy, OSV-Scanner, OSSF Scorecard, GitGuardian, Qodo Merge
- **Hosting**: Vercel, Render, Supabase, GitHub Actions
- **AI APIs consumed by the platform**: Anthropic Claude API, OpenAI API

## A note on attribution

Where listed AI tools have their own GitHub identities, commits made by those tools appear under their own `Author` field in git history (for example, Lovable as `gpt-engineer-app[bot]`, Manus as `Manus <manus@aiqtp.com>`, Claude Code via `noreply@anthropic.com` co-author lines). This document is the canonical place for full credit; individual commits credit only the entities that contributed to that specific change.

---

AIQTP™ and the AIQTP logo are trademarks of **DRTRUST (Wyoming)**.

Copyright © DRTRUST (Wyoming). All rights reserved.
