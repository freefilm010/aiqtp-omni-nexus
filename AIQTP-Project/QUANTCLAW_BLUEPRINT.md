# QuantClaw Agent Blueprint v1.0

> Reference architecture for the AIQTP Quant Clawbot system.
> This document maps the spec to **existing platform capabilities** — no external deployments needed.

---

## 0. GOAL

A unified **"Quant Clawbot"** agent layer within AIQTP that orchestrates:

1. **QuantClaw-Dev** — Research, code assistance, strategy exploration, backtests, simulated trades.
2. **QuantClaw-Prod** (optional) — Tightly controlled live trading with safety constraints.

Both agents leverage the platform's existing AI gateway, strategy studio, ML engine, and GitHub ecosystem.

---

## 1. ARCHITECTURE MAPPING

| Spec Component | AIQTP Equivalent | Status |
|---|---|---|
| LLM Backend (Ollama) | Lovable AI Gateway (Gemini/GPT-5) | ✅ Live |
| OpenClaw Gateway | QAQI Agent + AI Copilot edge functions | ✅ Live |
| Qdrant Vector DB | RAG via edge function + embeddings | ✅ Available |
| RAG Service | `qaqi-agent` / `aiqtp-agent` edge functions | ✅ Live |
| Trading Tools | Strategy Studio (Freqtrade-style) | ✅ Live |
| Backtest Engine | `src/lib/backtesting/engine.ts` | ✅ Live |
| ccxt Exchange | `ccxt-trading` edge function | ✅ Live |
| ML Predictions | `ml-predictions` edge function + ML engine | ✅ Live |
| Web UI | AIQTP platform at aiqtp.com | ✅ Live |

---

## 2. AGENT DEFINITIONS

### Agent 1: QuantClaw-Dev

**Purpose:** Development, research, code assistance, strategy exploration, backtests, simulated trades.

**Tools allowed:**
- `search_trading_code` → RAG search across Tier 1+2 repos (trading, strategies, platforms)
- `search_quant_research` → RAG search across Tier 1+3 repos (quant, research, ML)
- `search_onchain` → RAG search for on-chain repos (OpenZeppelin, Solana, EIPs, NFT)
- `freqtrade_backtest` → Strategy Studio backtest engine
- `freqtrade_optimize` → Hyperparameter optimization via ML engine
- `ccxt_sim_order` → Paper trading via ccxt simulation
- `factor_generation` → Alpha factor library (50+ indicators)
- `portfolio_optimize` → Mean-variance, risk parity, Black-Litterman

**Tools NOT allowed:**
- `ccxt_live_order` — Never for Dev agent

### Agent 2: QuantClaw-Prod (Optional)

**Purpose:** Tightly controlled live trading.

**Safety constraints for `ccxt_live_order`:**
- Max position size: ≤ 2% of account per trade
- Symbol whitelist: BTC-USDT, ETH-USDT (configurable via admin settings)
- Rate limit: Max 5 trades per hour
- Approval flow: Agent proposes → Admin approves → Execute

---

## 3. REPO MANIFEST (RAG Tiers)

### Tier 1 — Core Trading Brain (Default Corpus)

| Repo | Tags |
|---|---|
| aiquanttradeplat | trading, platform, aiqtp |
| aiqtp-omni-nexus | trading, platform, omni |
| DYNAMIC-QUANT-ASSET-PLATFORM | trading, quant, platform |
| DYNAMIC-QUANT-PLAT-RENDERROOT-FIXED- | trading, quant, renderroot |
| DQuatut | trading, quant |
| aiqtp.org | trading, platform, website |
| freefilm | personal, misc, meta |
| FORALL_DYNAMICS_EXT | dynamics, platform |
| ai-evolution-platform | ai, platform |
| aiqtpreprepo | aiqtp, staging |
| resdevgent | research, dev, agent |
| RD-Agent | agent, research |
| Quantum-SDR-RF-AI-LAB | quantum, sdr, rf, ai |
| QuantumKeep | quant, notes |
| QuantMuse | quant, research |
| freqtrade | freqtrade, framework |
| freqtrade-strategies | freqtrade, strategies |
| Gekko-Strategies | gekko, strategies |
| gekko | gekko, framework |
| strategies | strategies, generic |
| crypto-trading-bot | trading, bot |
| awesome-crypto-trading-bots | trading, bots, curated |
| machine-learning-for-trading | ml, trading, book |
| Machine-Learning-for-Algorithmic-Trading-Bots-with-Python | ml, trading, bots, book |
| FinRL | reinforcement-learning, trading |
| mindsdb | mindsdb, ml, automation |
| Market-Overview-Indexes-Forex-Metals-Crypto | market, overview, data |

### Tier 2 — Infra, On-Chain, APIs (Included for infra/API queries)

| Repo | Tags |
|---|---|
| ccxt | ccxt, exchanges, api |
| TradingView-API | tradingview, api |
| openzeppelin-contracts | openzeppelin, contracts |
| build-blockchain-insurance-app | blockchain, insurance |
| token_sale | token, sale, ico |
| solana-pumpfun-smart-contract | solana, contract |
| solana-raydium-sniper-bot | solana, sniper |
| solana-trading-bot | solana, trading, bot |
| solana | solana, core |
| cairo-contracts | starknet, cairo |
| EIPs | ethereum, eips |
| nft | nft, onchain |
| cryptoviz | visualization, crypto |
| zbd-docs | zbd, docs |
| ibm.github.io | ibm, docs |
| exploit-uniswap | uniswap, exploit, ⚠️ REFERENCE ONLY |

### Tier 3 — Frameworks, LLMs, Quantum (Opt-in only)

| Repo | Tags |
|---|---|
| transformers | llm, transformers |
| DeepSeek-V3 | deepseek, llm |
| DeepSeek-Coder | deepseek, coder |
| DeepSeek-Math | deepseek, math |
| NeMo | nemo, llm |
| DeepSpeed | deepspeed, training |
| self-adaptive-llms | llm, research |
| qdrant | vector-db, qdrant |
| langgraph | agents, orchestration |
| langchainjs | langchain, js |
| ollama | ollama |
| sglang | llm, sglang |
| opencv | opencv, vision |
| automl | automl |
| Awesome-AutoDL | autodl, awesome |
| autokeras | autokeras |
| FfDL | ffdl |
| differential-privacy-library | differential-privacy |
| liboqs | post-quantum, crypto |
| FourQlib | ecc |
| xmrig | mining, xmrig |
| system-prompts-and-models-of-ai-tools | prompts, meta |
| qiskit-textbook | qiskit, textbook |
| qiskit-experiments | qiskit, experiments |
| qiskit-nature | qiskit, nature |
| qiskit-algorithms | qiskit, algorithms |
| qiskit-machine-learning | qiskit, ml |
| Substrate | substrate, blockchain |
| Telos | telos, chain |
| fabric | fabric, hyperledger |
| kyber-k2so | kyber, crypto |

**RAG Rules:**
- Tier 1 = default corpus for all trading/platform queries
- Tier 2 = included when queries involve infra, APIs, or on-chain topics
- Tier 3 = opt-in only (user must explicitly request)
- `exploit-uniswap` = **reference only** — never used to propose or execute exploits

---

## 4. TOOL ENDPOINTS (Mapped to Existing Services)

| Tool | Existing Endpoint |
|---|---|
| `search_trading_code` | `qaqi-agent` with tier filter |
| `search_quant_research` | `aiqtp-agent` with tier filter |
| `freqtrade_backtest` | Strategy Studio + `generate-strategy` |
| `freqtrade_optimize` | `ml-predictions` + factor engine |
| `ccxt_sim_order` | `ccxt-trading` (paper mode) |
| `ccxt_live_order` | `ccxt-trading` (live, admin-gated) |
| `factor_generation` | `generate-factors` |
| `portfolio_optimize` | `src/lib/portfolio/optimization.ts` |

---

## 5. SECURITY REQUIREMENTS

- All secrets in Lovable Cloud secrets store (never in code)
- Live trading disabled by default; requires admin flag
- Position size limits enforced server-side
- Symbol whitelist managed via `admin_settings` table
- Rate limiting via `rateLimiter.ts` shared module
- `exploit-uniswap` content tagged as reference-only in RAG metadata

---

## 6. OPS RUNBOOK

### Re-ingest Repos
Navigate to QuantClaw Command Center → RAG tab → "Full Ingest" button

### Add/Remove Repos
Edit `src/lib/github/repositories.ts` categories and tiers

### Start/Stop Services
All services are edge functions — deployed automatically via Lovable Cloud

### Logs
View via Lovable Cloud backend panel → Edge Function Logs

### Example Prompts for QuantClaw-Dev
1. "Backtest RSI-EMA crossover on BTC/USDT 1h from 2024-01-01 to 2024-06-01"
2. "Explain how the DCA strategy in freqtrade-strategies decides entry and exit"
3. "Compare momentum vs mean-reversion strategies and suggest improvements"
4. "Search my repos for Solana PumpFun contract deployment logic"
5. "Generate an alpha factor combining RSI divergence with volume profile"
