# AIQTP — Production Infrastructure Blueprint

## Self-Writing Economy Platform: Cloud-Native Deployment Design

**Version:** 1.0  
**Date:** 2026-04-01  
**Status:** Reference Architecture  

---

## 1. System Overview

The AIQTP platform is a **self-evolving financial intelligence system** comprising:

- **Multi-agent trading simulation** (behavioral + RL + evolutionary)
- **Market microstructure engine** (limit order books, matching, queue priority)
- **Multi-universe economic simulator** (parallel economic realities)
- **Observer-dependent pricing** (belief-driven markets)
- **Self-writing economy kernel** (runtime rule/strategy mutation)
- **Institutional-grade risk/derivatives** (VaR, CVaR, Black-Scholes, vol surfaces)
- **Event-sourced accounting** (FIFO PnL, tax lots, attribution)
- **Safety kernel** (circuit breakers, drift detection, invariants)

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / INGRESS                        │
│              (Auth, Rate Limiting, Load Balancing)              │
└────────────┬──────────────────────────────────┬────────────────┘
             │                                  │
     ┌───────▼────────┐               ┌────────▼────────┐
     │  WEB CLIENT    │               │  ADMIN CONSOLE  │
     │  (React/Vite)  │               │  (React/Vite)   │
     └───────┬────────┘               └────────┬────────┘
             │                                  │
             └──────────────┬───────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │      EVENT BUS (Kafka)     │
              │   Partitioned by: asset,   │
              │   universe, agent-group    │
              └─────┬───┬───┬───┬───┬─────┘
                    │   │   │   │   │
        ┌───────────┘   │   │   │   └───────────┐
        ▼               ▼   ▼   ▼               ▼
   ┌─────────┐   ┌──────────┐ ┌──────────┐ ┌─────────┐
   │ MARKET  │   │  AGENT   │ │  MACRO   │ │  RISK   │
   │ SERVICE │   │ SERVICE  │ │ SERVICE  │ │ SERVICE │
   └────┬────┘   └────┬─────┘ └────┬─────┘ └────┬────┘
        │              │            │             │
        └──────────────┼────────────┼─────────────┘
                       │            │
              ┌────────▼────────────▼────────┐
              │     RULES ENGINE SERVICE     │
              │  (Self-Writing Economy Core) │
              └──────────────┬───────────────┘
                             │
              ┌──────────────▼───────────────┐
              │   EXECUTION ROUTER SERVICE   │
              │   (Sim / Paper / Live)       │
              └──────────────┬───────────────┘
                             │
              ┌──────────────▼───────────────┐
              │   EVENT STORE (Postgres)     │
              │   Append-only trade ledger   │
              └──────────────┬───────────────┘
                             │
              ┌──────────────▼───────────────┐
              │   SAFETY CLUSTER             │
              │   Circuit breakers + halt    │
              └──────────────┬───────────────┘
                             │
              ┌──────────────▼───────────────┐
              │   OBSERVABILITY STACK        │
              │   Prometheus / Grafana /     │
              │   OpenTelemetry / Loki       │
              └──────────────────────────────┘
```

---

## 3. Monorepo Structure

```
aiqtp-platform/
├── apps/
│   ├── web/                      # React frontend (current Lovable app)
│   ├── api-gateway/              # Public API (Fastify)
│   ├── market-service/           # Pricing + order book
│   ├── agent-service/            # Trading agents
│   ├── macro-service/            # Central bank + macro simulation
│   ├── universe-service/         # Multiverse engine
│   ├── rules-service/            # Self-writing economy kernel
│   ├── risk-service/             # VaR, CVaR, stress tests, safety
│   ├── execution-service/        # Sim/paper/live router
│   └── consciousness-service/    # Belief field + clustering
│
├── packages/
│   ├── event-bus/                # Kafka wrapper abstraction
│   ├── event-store/              # Event sourcing layer
│   ├── shared-types/             # TS types across all services
│   ├── telemetry/                # Logging + metrics + tracing
│   ├── config/                   # Shared configuration
│   └── safety/                   # Invariants, drift, circuit breakers
│
├── infra/
│   ├── k8s/                      # Kubernetes manifests
│   ├── helm/                     # Helm charts per service
│   └── terraform/                # AWS/GCP infrastructure
│
├── docker/
│   ├── base.Dockerfile
│   ├── dev.docker-compose.yml
│   └── prod.docker-compose.yml
│
├── .github/workflows/            # CI/CD pipelines
├── turbo.json
└── README.md
```

---

## 4. Service Specifications

### 4.1 Market Service
- **Uses:** `MicrostructureBook`, `VolSurface`, `optionsPricer`
- **Publishes:** `TRADE`, `UNIVERSE_STEP`
- **Subscribes:** `MACRO_SHOCK`, `RULE_MUTATION`
- **Scaling:** Partition by asset symbol

### 4.2 Agent Service
- **Uses:** `ConsciousAgent`, `BehavioralAgent`, `EvolutionEngine`, `RLAgent`
- **Publishes:** `TRADE`, `BELIEF_UPDATE`
- **Subscribes:** `UNIVERSE_STEP`, `MACRO_SHOCK`
- **Scaling:** Partition by agent group

### 4.3 Macro Service
- **Uses:** `MacroEngine`
- **Publishes:** `MACRO_SHOCK`, `UNIVERSE_STEP`
- **Scaling:** Single leader + standby replicas

### 4.4 Universe Service
- **Uses:** `EconomicUniverse`, `MetaInvestor`, `UniverseEvolver`
- **Publishes:** `UNIVERSE_STEP`, `MACRO_SHOCK`
- **Scaling:** One pod per universe

### 4.5 Rules Service
- **Uses:** `RuleEngine`, `compileStrategy`, `Governance`
- **Publishes:** `RULE_MUTATION`
- **Scaling:** Single leader (writes serialized)

### 4.6 Risk Service
- **Uses:** `riskEngine`, `SafetyCluster`, `DriftDetector`
- **Publishes:** `RISK_ALERT`, `CIRCUIT_BREAKER`
- **Scaling:** Quorum (3+) for halt decisions

### 4.7 Execution Service
- **Uses:** `ExecutionRouter`
- **Scaling:** Horizontal (stateless)

### 4.8 Consciousness Service
- **Uses:** `BeliefField`, `formClusters`, `synchronizeBeliefs`, `ObserverMarket`
- **Publishes:** `BELIEF_UPDATE`
- **Scaling:** Single leader

---

## 5. Event Topics (Kafka)

| Topic | Partitioning | Retention | Consumers |
|-------|-------------|-----------|-----------|
| `trades` | By symbol | 30 days | Agent, Risk, Rules, Execution |
| `belief-updates` | By agent group | 7 days | Consciousness, Market |
| `rule-mutations` | Single partition | Forever | All services |
| `macro-shocks` | None | 30 days | Market, Agent, Universe |
| `universe-steps` | By universe name | 30 days | Agent, Meta-Investor |
| `risk-alerts` | By severity | 90 days | All services |
| `circuit-breaker` | None | Forever | All services (priority) |

---

## 6. Data Stores

| Store | Technology | Purpose |
|-------|-----------|---------|
| Event Ledger | PostgreSQL (append-only) | Trade events, audit trail |
| Time Series | TimescaleDB / ClickHouse | Price history, metrics |
| State Cache | Redis | Hot market state, agent positions |
| Config Store | etcd / ConfigMap | Runtime governance parameters |
| Snapshots | S3 / Object Storage | Periodic state snapshots |

---

## 7. Kubernetes Manifests

### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: aiqtp-platform
```

### Service Deployment (Agent Service Example)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-service
  namespace: aiqtp-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-service
  template:
    metadata:
      labels:
        app: agent-service
    spec:
      containers:
        - name: agent-service
          image: ghcr.io/aiqtp/agent-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: KAFKA_BROKER
              value: kafka:9092
            - name: EVENT_STORE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
          resources:
            requests: { memory: "256Mi", cpu: "250m" }
            limits: { memory: "512Mi", cpu: "500m" }
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 10
          readinessProbe:
            httpGet: { path: /ready, port: 3000 }
            initialDelaySeconds: 5
```

### Safety Kill-Switch
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: global-safety
  namespace: aiqtp-platform
data:
  MAX_GLOBAL_RISK: "0.75"
  AUTO_HALT_ENABLED: "true"
  MAX_LEVERAGE_CAP: "3.0"
```

### HPA
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-service-hpa
  namespace: aiqtp-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agent-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
```

---

## 8. Docker

### Production Multi-Stage
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Dev Compose
```yaml
version: "3.9"
services:
  kafka:
    image: bitnami/kafka:3.7
    ports: ["9092:9092"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: aiqtp, POSTGRES_PASSWORD: postgres }
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
  api-gateway:
    build: { context: ., dockerfile: docker/base.Dockerfile }
    environment:
      - KAFKA_BROKER=kafka:9092
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/aiqtp
      - REDIS_URL=redis://redis:6379
    ports: ["3000:3000"]
    depends_on: [kafka, redis, postgres]
volumes:
  pgdata:
```

---

## 9. CI/CD

### CI
```yaml
name: CI
on: [pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint && npm run typecheck && npm run test
```

### CD
```yaml
name: CD
on: { push: { branches: [main] } }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          for svc in market-service agent-service macro-service risk-service; do
            docker build -t ghcr.io/aiqtp/$svc:${{ github.sha }} .
            docker push ghcr.io/aiqtp/$svc:${{ github.sha }}
          done
      - run: kubectl apply -f infra/k8s/ -n aiqtp-platform
```

---

## 10. Security

| Layer | Measure |
|-------|---------|
| Network | VPC isolation, private subnets |
| Auth | JWT on all service-to-service calls |
| Secrets | K8s Secrets + AWS SSM |
| Data | AES-256 at rest, TLS in transit |
| Audit | Append-only event store |
| Access | K8s RBAC, Postgres RLS |
| Safety | Global circuit breaker, invariant enforcement |

---

## 11. Scaling Strategy

| Service | Strategy | Notes |
|---------|----------|-------|
| Market | Shard by symbol | Independent order books |
| Agent | Horizontal | Agent groups across pods |
| Macro | Leader + standby | Single macro truth |
| Universe | 1 pod/universe | Parallel realities |
| Risk | Quorum (3+) | Consensus for halts |
| Execution | Horizontal | Stateless routing |
| Consciousness | Leader | Single belief aggregation |

---

## 12. Implemented Engine Modules

| Module | Path | Status |
|--------|------|--------|
| Market Microstructure | `src/lib/microstructure/limitOrderBook.ts` | ✅ |
| Multi-Agent Simulation | `src/lib/simulation/multiAgentSim.ts` | ✅ |
| Options Pricing + Greeks | `src/lib/derivatives/optionsPricer.ts` | ✅ |
| Volatility Surface | `src/lib/derivatives/volSurface.ts` | ✅ |
| Risk Engine (VaR/CVaR) | `src/lib/risk/riskEngine.ts` | ✅ |
| HFT Simulator | `src/lib/hft/hftSimulator.ts` | ✅ |
| Arbitrage Engine | `src/lib/exchange/arbitrageEngine.ts` | ✅ |
| Market Surveillance | `src/lib/forensics/marketSurveillance.ts` | ✅ |
| Autonomous Fund Manager | `src/lib/fund/autonomousFundManager.ts` | ✅ |
| Global Macro Engine | `src/lib/macro/macroEngine.ts` | ✅ |
| Behavioral Agents | `src/lib/behavior/behavioralAgents.ts` | ✅ |
| DEX + MEV Simulator | `src/lib/dex/mevSimulator.ts` | ✅ |
| Evolutionary Engine | `src/lib/evolution/evolutionEngine.ts` | ✅ |
| Multi-Universe Engine | `src/lib/multiverse/universeEngine.ts` | ✅ |
| Observer Market | `src/lib/transcendence/observerMarket.ts` | ✅ |
| Universe Generator | `src/lib/transcendence/universeGenerator.ts` | ✅ |
| Conscious Agents | `src/lib/transcendence/consciousAgent.ts` | ✅ |
| Collective Consciousness | `src/lib/collective/collectiveConsciousness.ts` | ✅ |
| Self-Writing Economy | `src/lib/selfwriting/selfWritingEconomy.ts` | ✅ |
| Event Bus | `src/lib/infra/eventBus.ts` | ✅ |
| Event Store | `src/lib/infra/eventStore.ts` | ✅ |
| Execution Router | `src/lib/infra/executionRouter.ts` | ✅ |
| Safety Cluster | `src/lib/infra/safetyCluster.ts` | ✅ |
| Telemetry | `src/lib/infra/telemetry.ts` | ✅ |
| Platform Orchestrator | `src/lib/infra/index.ts` | ✅ |

**Total: 25 production-grade TypeScript engine modules.**

---

## 13. Migration Path

To extract from in-app modules to distributed services:

1. **Extract** each `src/lib/*` into its own `apps/*-service` package
2. **Add Kafka producers/consumers** wrapping the existing pure logic
3. **Deploy** each as independent Docker container
4. **Connect** via event topics (Section 5)
5. **Add observability** (Prometheus + Grafana + OpenTelemetry)
6. **Enable multi-region** with Kafka MirrorMaker + cross-region K8s

Current modules are **already service-boundary aligned** — clean interfaces, no shared mutable state.
