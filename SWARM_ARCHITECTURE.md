# AIQTP Swarm Architecture
## Hardware-Accelerated, Amnesia-Free, Decentralized MEV Trading Swarm

**Version:** 0.1.0-blueprint  
**Status:** Architecture Design — Pre-Implementation  
**Date:** 2026-05-04  
**Classification:** Internal Engineering Reference

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Pillar 1 — The Hardware Edge (Cognitum)](#pillar-1--the-hardware-edge-cognitum)
4. [Pillar 2 — Amnesia-Free Memory (Engram)](#pillar-2--amnesia-free-memory-engram)
5. [Pillar 3 — God Mode MEV Data Stack](#pillar-3--god-mode-mev-data-stack)
6. [Pillar 4 — Decentralized Compute Swarm ($NXVR Tokenomics)](#pillar-4--decentralized-compute-swarm-nxvr-tokenomics)
7. [Dual-Track Deployment](#dual-track-deployment)
8. [File Map and Module Reference](#file-map-and-module-reference)
9. [Data Structures Reference](#data-structures-reference)
10. [Integration with Existing Stack](#integration-with-existing-stack)
11. [Security Model](#security-model)
12. [Roadmap](#roadmap)

---

## Executive Summary

AIQTP is pivoting from a centralized, cloud-only trading platform to a **Hardware-Accelerated, Amnesia-Free, Decentralized MEV Trading Swarm**. This architecture is built on four mutually reinforcing pillars:

1. **Cognitum** — Physical and virtual edge nodes that bring sub-millisecond execution latency to individual participants. The $257 Cognitum Seed USB device is the anchor. The downloadable Virtual Node (eSIM/e-ware) scales the network to any machine on earth.

2. **Engram** — A purpose-built, amnesia-free memory system that replaces RAG vector databases with a deterministic, O(1)-lookup hash embedding table. Agents never forget. Context never dilutes.

3. **MEV Data Stack** — A three-tier data pipeline, anchored at Tier 1 by Flashbots MEV relay WebSocket streams and private mempool RPC endpoints. Every opportunity is scored in USDT net P&L before execution.

4. **$NXVR Tokenomics** — A stake-to-participate compute mining layer. Nodes earn $NXVR proportional to validated compute work: mempool data processed, MEV ops confirmed, uptime maintained.

These pillars compose into a single coherent system: a mesh of edge devices and virtual clients that together form a decentralized intelligence capable of detecting, scoring, and executing MEV opportunities faster and more cheaply than any single centralized actor.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PARTICIPANT LAYER                               │
│                                                                         │
│   ┌──────────────────────┐          ┌──────────────────────────────┐   │
│   │  Cognitum Seed USB   │          │  Cognitum Virtual Node       │   │
│   │  (Hard SIM)          │          │  (eSIM / e-ware client)      │   │
│   │  ARM Cortex-M7 MCU   │          │  Mac / Win / Linux           │   │
│   │  Ed25519 HSM chip    │          │  CPU/GPU software signing    │   │
│   │  100K vector memory  │          │  Software Engram memory      │   │
│   └──────────┬───────────┘          └──────────────┬───────────────┘   │
│              │                                      │                   │
│              └─────────────────┬────────────────────┘                   │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │  Authenticated Node Registration
                                 │  (Ed25519-signed heartbeat)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SWARM COORDINATOR LAYER                           │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │               Swarm Coordinator (FastAPI / asyncio)             │  │
│   │                                                                 │  │
│   │   • Node registry + heartbeat tracking                         │  │
│   │   • MEV opportunity fan-out (broadcast to eligible nodes)      │  │
│   │   • Compute share accounting (per node, per epoch)             │  │
│   │   • Slashing arbitration                                       │  │
│   │   • $NXVR reward distribution trigger                         │  │
│   └──────────────────────────┬──────────────────────────────────────┘  │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
          ┌────────────────────┼──────────────────────┐
          │                    │                       │
          ▼                    ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐
│  MEV DATA TIER 1 │  │  MEV DATA TIER 2 │  │  MEV DATA TIER 3        │
│                  │  │                  │  │                         │
│  Flashbots MEV   │  │  DEX price feeds │  │  OHLC / legacy candle   │
│  Relay WebSocket │  │  AMM reserves    │  │  (deprioritized)        │
│                  │  │  (Uniswap v3,    │  │                         │
│  Bitquery stream │  │   Curve, Balancr)│  │  CoinGecko, Binance     │
│                  │  │                  │  │  REST fallback           │
│  Private RPC     │  │  On-chain events │  │                         │
│  (Infura/Alchemy)│  │  (ERC-20 Transfer│  │                         │
│                  │  │   Swap, Sync)    │  │                         │
└────────┬─────────┘  └────────┬─────────┘  └──────────┬──────────────┘
         │                     │                        │
         └─────────────────────┼────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MEV OPPORTUNITY SCORER                             │
│                                                                         │
│   Input:  raw pending tx / DEX state                                   │
│   Output: MEVOpportunity { expected_profit_usdt, gas_cost_usdt,        │
│                            net_pnl_usdt, strategy_type, confidence }   │
│                                                                         │
│   Filters: net_pnl_usdt > MIN_PROFIT_THRESHOLD_USDT (default: 5.0)    │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXECUTION LAYER                                 │
│                                                                         │
│   ┌───────────────────────┐     ┌─────────────────────────────────┐   │
│   │  MemPoolSniperAgent   │     │  Broker Router                  │   │
│   │  (per Cognitum node)  │     │                                 │   │
│   │                       │     │  /brokers/binance/order         │   │
│   │  • Bundle construction│────▶│  /brokers/kraken/order          │   │
│   │  • Flashbots submit   │     │  /brokers/tradier/order         │   │
│   │  • Backrun / sandwich │     │  /brokers/ibkr/order            │   │
│   └───────────────────────┘     └─────────────────────────────────┘   │
│                                                                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      REWARD DISTRIBUTION                                │
│                                                                         │
│   $NXVR mint event per epoch (default: 1 hour)                        │
│   Reward = base_reward * (node_compute_share / total_network_compute)  │
│             * quality_multiplier                                        │
│                                                                         │
│   On-chain settlement → Engram L3 persistent log                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Pillar 1 — The Hardware Edge (Cognitum)

### 1.1 Cognitum Seed — The $257 USB Edge Device

The Cognitum Seed is a purpose-built USB edge device that turns any host machine into a first-class swarm participant without trusting that host machine with signing keys. It is the physical root of trust for the entire network.

**Hardware Specification:**

| Component | Specification |
|-----------|--------------|
| MCU | ARM Cortex-M7 @ 480 MHz (STM32H7 class) |
| SRAM | 1 MB on-chip + 8 MB PSRAM for Engram L1/L2 |
| Flash | 16 MB NOR flash for Engram L3 cold store |
| Signing | ATECC608B (or equivalent) — Ed25519 hardware security module |
| Interface | USB 2.0 HID + CDC-ACM serial (host sees a virtual COM port) |
| Connectivity | USB-powered; host provides network via USB CDC-ECM or shared IP |
| Power | <250 mW typical; <5 mW in async sleep between events |
| Vector Memory | 100,000 Engram embedding slots (512-bit hash keys, 128-byte value payloads) |
| Form Factor | USB-A dongle, 65mm × 20mm × 12mm |
| Price Target | $257 USD including HSM and assembled firmware |

The HSM (ATECC608B) is write-once provisioned at the factory with a unique Ed25519 keypair. The private key never leaves the chip. Every trade execution log is signed by calling the chip's sign() command via I2C from the MCU.

### 1.2 The Two Node Archetypes

#### `CognitumHardwareNode` — "Hard SIM"

The Hard SIM is the physical Cognitum Seed USB device. It provides:

- **Hardware-enforced Ed25519 signing** — the private key is physically isolated from the host OS. A compromised host machine cannot forge trade signatures.
- **Local mempool pre-processing** — the MCU runs a lightweight filtering pass over incoming pending transaction hashes before forwarding to the swarm coordinator.
- **Tamper-evidence** — HSM devices log failed unlock attempts. If the device is physically attacked, the key is zeroed.
- **Host-agnostic** — the device exposes a simple serial JSON protocol. The host runs the `cognitum` CLI which speaks to the device over `/dev/ttyACM0` (Linux), `COM3` (Windows), or `/dev/cu.usbmodem*` (Mac).

**Pseudocode — hardware node initialization:**

```python
class CognitumHardwareNode:
    """
    Hard SIM node backed by physical Cognitum Seed USB device.
    All signing operations are delegated to the ATECC608B HSM via I2C.
    """

    def __init__(self, serial_port: str, baud: int = 115200):
        self.port = serial_port
        self.baud = baud
        self.node_id: str | None = None      # Ed25519 public key hex
        self.engram = EngramMemory(tier="hardware", capacity_l1=50,
                                   capacity_l2=1000, flash_backed=True)
        self._serial: Serial | None = None

    async def initialize(self) -> NodeIdentity:
        """Open serial connection, read public key from HSM, register with coordinator."""
        self._serial = await asyncio.to_thread(Serial, self.port, self.baud, timeout=2)
        pub_key_hex = await self._hsm_get_public_key()
        self.node_id = pub_key_hex
        identity = NodeIdentity(
            node_id=pub_key_hex,
            node_type="hardware",
            firmware_version=await self._get_firmware_version(),
            capabilities=["ed25519_hardware", "local_mempool", "engram_l1_l2_l3"],
        )
        await self._register_with_coordinator(identity)
        return identity

    async def sign_trade_log(self, log: TradeExecutionLog) -> SignedTradeLog:
        """Delegate signing to HSM. Returns signature bytes (64 bytes Ed25519)."""
        payload_bytes = log.canonical_bytes()  # deterministic serialization
        sig_hex = await self._hsm_sign(payload_bytes)
        return SignedTradeLog(log=log, signature=sig_hex, signer=self.node_id,
                              signing_method="ed25519_hardware_hsm")

    async def _hsm_sign(self, data: bytes) -> str:
        """Send SIGN command over serial, return 64-byte signature as hex."""
        cmd = {"cmd": "sign", "data": data.hex()}
        response = await self._serial_roundtrip(cmd)
        if response.get("status") != "ok":
            raise HSMSigningError(response.get("error", "unknown"))
        return response["signature"]

    async def run_event_loop(self):
        """
        Main async event loop. Idles in async sleep between events.
        Target: <1ms reflex from event receipt to signed action dispatch.
        Agent spawn time target: <50ms.
        """
        while True:
            event = await self._await_next_event()  # async wait — zero idle CPU
            if event.type == EventType.MEV_OPPORTUNITY:
                await self._handle_mev_opportunity(event)
            elif event.type == EventType.HEARTBEAT_REQUEST:
                await self._send_heartbeat()
            elif event.type == EventType.ENGRAM_QUERY:
                await self._handle_engram_query(event)
            # Event loop yields back to asyncio — no blocking sleep
```

#### `CognitumVirtualNode` — "eSIM / e-ware"

The Virtual Node is a downloadable software client (Mac / Win / Linux) that participates in the swarm using the host machine's CPU/GPU for compute and a software-implemented Ed25519 library for signing. The private key is stored encrypted in the OS keychain (macOS Keychain, Windows DPAPI, Linux libsecret).

**Pseudocode — virtual node initialization:**

```python
class CognitumVirtualNode:
    """
    eSIM / e-ware node. Runs entirely in software.
    Ed25519 signing uses cryptography.hazmat (Python) or @noble/ed25519 (JS).
    Private key protected by OS keychain; never written to disk in plaintext.
    """

    def __init__(self, config_path: str = "~/.cognitum/config.json"):
        self.config_path = os.path.expanduser(config_path)
        self.node_id: str | None = None
        self.private_key: bytes | None = None   # ephemeral in memory only
        self.engram = EngramMemory(tier="software", capacity_l1=50,
                                   capacity_l2=1000, flash_backed=False)
        self._stake_amount_nxvr: float = 0.0
        self._compute_credits: float = 0.0

    async def initialize(self) -> NodeIdentity:
        self.private_key = await self._load_or_generate_key()
        pub_key = ed25519_public_key_from_private(self.private_key)
        self.node_id = pub_key.hex()
        identity = NodeIdentity(
            node_id=self.node_id,
            node_type="virtual",
            firmware_version=VIRTUAL_NODE_VERSION,
            capabilities=["ed25519_software", "engram_l1_l2", "gpu_compute"],
        )
        await self._register_with_coordinator(identity)
        return identity

    async def sign_trade_log(self, log: TradeExecutionLog) -> SignedTradeLog:
        payload_bytes = log.canonical_bytes()
        sig = ed25519_sign(self.private_key, payload_bytes)  # in-memory, not hardware
        return SignedTradeLog(log=log, signature=sig.hex(), signer=self.node_id,
                              signing_method="ed25519_software_keychain")

    async def run_event_loop(self):
        """Identical contract to HardwareNode — coordinator is node-type-agnostic."""
        while True:
            event = await self._await_next_event()
            if event.type == EventType.MEV_OPPORTUNITY:
                await self._handle_mev_opportunity(event)
            elif event.type == EventType.HEARTBEAT_REQUEST:
                await self._send_heartbeat()
            elif event.type == EventType.COMPUTE_TASK:
                await self._handle_compute_task(event)
```

### 1.3 Trade Execution Log — Required Fields

Every trade execution event — regardless of node type, broker, or outcome — MUST be recorded with the following canonical structure before being signed. Partial logs are rejected by the coordinator.

```python
@dataclass
class TradeExecutionLog:
    """
    Canonical trade log. Must be fully populated before signing.
    canonical_bytes() produces a deterministic binary representation
    suitable for Ed25519 signing (no floats — all monetary values are
    stored as integer microunits: 1 USDT = 1_000_000 µUSDT).
    """
    # Identity
    log_id: str                  # UUID v4
    agent_id: str                # spawning agent identifier
    node_id: str                 # Ed25519 public key of the signing node

    # Timing (nanosecond Unix timestamp — no timezone ambiguity)
    timestamp_ns: int            # time.time_ns()

    # Action
    action: str                  # "BUY" | "SELL" | "SANDWICH" | "BACKRUN" |
                                 # "LIQUIDATION" | "CANCEL" | "MEV_BUNDLE_SUBMIT"
    strategy_type: str           # "sandwich" | "backrun" | "liquidation" | "arbitrage"

    # Asset (always USDT or USDC denominated)
    base_token: str              # e.g. "WETH", "ARB", "BTC"
    quote_token: str             # always "USDT" or "USDC"
    pair: str                    # e.g. "WETH/USDT"

    # Quantities (integer microunits)
    quantity_micro: int          # base token amount × 1_000_000
    price_micro_usdt: int        # price in µUSDT per base unit
    expected_profit_micro_usdt: int
    gas_cost_micro_usdt: int
    net_pnl_micro_usdt: int      # expected_profit - gas_cost

    # Execution
    broker: str                  # "flashbots" | "binance" | "kraken" | "tradier" | "ibkr"
    tx_hash: str | None          # on-chain tx hash once submitted; None pre-submit
    bundle_id: str | None        # Flashbots bundle UUID if applicable
    status: str                  # "pending" | "submitted" | "confirmed" | "failed" | "reverted"

    # MEV context
    target_tx_hash: str | None   # tx being sandwiched / backrun; None for non-MEV
    block_number_target: int | None

    def canonical_bytes(self) -> bytes:
        """
        Deterministic serialization for signing. JSON with sorted keys,
        UTF-8 encoded. Floats are forbidden — all monetary values are
        stored as integer microunits.
        """
        d = {k: v for k, v in self.__dict__.items()}
        return json.dumps(d, sort_keys=True, separators=(",", ":")).encode("utf-8")


@dataclass
class SignedTradeLog:
    log: TradeExecutionLog
    signature: str               # 64-byte Ed25519 signature, hex-encoded
    signer: str                  # Ed25519 public key hex (== log.node_id)
    signing_method: str          # "ed25519_hardware_hsm" | "ed25519_software_keychain"

    def verify(self) -> bool:
        return ed25519_verify(
            public_key=bytes.fromhex(self.signer),
            signature=bytes.fromhex(self.signature),
            message=self.log.canonical_bytes(),
        )
```

### 1.4 Event-Driven Agent Framework

The Cognitum node does not poll. It maintains a single `asyncio` event loop and receives events via:

- **WebSocket push** from the swarm coordinator (MEV opportunities, heartbeat requests, compute tasks)
- **Local serial interrupt** from the HSM (hardware node only — signing completion callback)
- **Engram cache miss** — triggers an async L3 lookup without blocking the event loop

**Performance targets:**

| Metric | Target | Mechanism |
|--------|--------|-----------|
| Event-to-signed-action latency | <1 ms | asyncio non-blocking dispatch, pre-cached Engram context |
| Agent spawn time | <50 ms | Pre-warmed agent pool, reuse across events |
| Idle CPU usage | ~0% | `await asyncio.sleep(0)` yields; no busy-wait |
| Idle power (hardware node) | <5 mW | MCU deep sleep between serial frames |

**Agent spawn mechanism:**

```python
class AgentPool:
    """Pre-warmed pool of MemPoolSniperAgent instances to hit the 50ms spawn target."""

    def __init__(self, size: int = 8):
        self._pool: asyncio.Queue[MemPoolSniperAgent] = asyncio.Queue()
        self._size = size

    async def initialize(self):
        for _ in range(self._size):
            agent = MemPoolSniperAgent()
            await agent.warm()   # pre-load Engram context, open connections
            await self._pool.put(agent)

    async def acquire(self) -> "MemPoolSniperAgent":
        """Returns a warm agent. Spawn a replacement in background."""
        agent = await self._pool.get()
        asyncio.create_task(self._replenish())  # non-blocking
        return agent

    async def _replenish(self):
        replacement = MemPoolSniperAgent()
        await replacement.warm()
        await self._pool.put(replacement)
```

---

## Pillar 2 — Amnesia-Free Memory (Engram)

### 2.1 The Problem with RAG

Standard retrieval-augmented generation (RAG) pipelines introduce three failure modes in a trading context:

1. **Semantic drift** — vector similarity is approximate. "WETH/USDT sandwich at block 19,543,210" might not retrieve the exact factual record; it retrieves whatever is semantically closest. For trading, you need the exact fact.
2. **Context dilution** — as retrieved chunks accumulate in a context window, older context is dropped. Multi-step reasoning over long time horizons degrades.
3. **Latency** — embedding model inference + ANN search adds 50–200 ms per lookup. Unacceptable for MEV.

### 2.2 Engram — Hash-Based Embedding Table

Engram replaces the RAG vector store with a deterministic **multiplicative XOR hash embedding table**. Every fact is stored at a key derived from its semantic fingerprint. Lookups are O(1) by design.

**Hash function:**

```python
def engram_hash(text: str) -> int:
    """
    Multiplicative XOR hash producing a 64-bit key.
    Deterministic: same text always produces the same key.
    Collision probability ≈ 1 / 2^64 per pair — acceptable for trading fact store.
    """
    # FNV-1a seed
    h = 14695981039346656037  # FNV offset basis (64-bit)
    for char in text.encode("utf-8"):
        h ^= char
        h = (h * 1099511628211) & 0xFFFFFFFFFFFFFFFF  # FNV prime, mask to 64-bit
    # Second XOR pass with golden ratio mixing for better distribution
    h ^= (h >> 33)
    h = (h * 0xFF51AFD7ED558CCD) & 0xFFFFFFFFFFFFFFFF
    h ^= (h >> 33)
    h = (h * 0xC4CEB9FE1A85EC53) & 0xFFFFFFFFFFFFFFFF
    h ^= (h >> 33)
    return h


def engram_key(concept: str, context_tag: str = "") -> int:
    """Composite key from concept + optional context tag (e.g. token pair, block range)."""
    composite = f"{concept}||{context_tag}"
    return engram_hash(composite)
```

### 2.3 Memory Tiers

```
┌─────────────────────────────────────────────────────────────┐
│                    ENGRAM MEMORY TIERS                      │
│                                                             │
│  L1 — HOT     (last 50 events)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Python dict (in-process)  O(1) hash lookup          │  │
│  │  Eviction: LRU after 50 entries                      │  │
│  │  Latency: <1 µs                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │ miss                            │
│                           ▼                                 │
│  L2 — WARM    (last 1000 events)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SQLite in-memory / mmap'd (per process)             │  │
│  │  Eviction: LRU after 1000 entries                    │  │
│  │  Latency: <100 µs                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │ miss                            │
│                           ▼                                 │
│  L3 — COLD    (persistent, unlimited)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hardware node: NOR flash on Cognitum Seed           │  │
│  │  Virtual node:  SQLite on local disk                 │  │
│  │  Latency: 1–5 ms (flash) / <1 ms (SSD)              │  │
│  │  Sync: coordinator replicates L3 across trusted peers│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Context-Aware Gating

Before an Engram record is injected into an agent's context window, it passes through a relevance gate. This prevents context bloat from unrelated historical facts.

```python
@dataclass
class EngramRecord:
    key: int                     # 64-bit hash key
    concept: str                 # human-readable concept label
    context_tag: str             # token pair, block range, strategy type, etc.
    value: dict                  # the fact payload
    # USDT anchoring — all monetary facts stored in USDT microunits
    price_anchor_usdt: int | None  # USDT price at time of storage (µUSDT)
    timestamp_ns: int
    access_count: int
    last_accessed_ns: int
    tier: str                    # "L1" | "L2" | "L3"


class EngramMemory:
    def __init__(self, tier: str, capacity_l1: int = 50,
                 capacity_l2: int = 1000, flash_backed: bool = False):
        self.capacity_l1 = capacity_l1
        self.capacity_l2 = capacity_l2
        self._l1: dict[int, EngramRecord] = {}          # hot cache
        self._l2: dict[int, EngramRecord] = {}          # warm cache
        self._l3_path = self._init_l3(flash_backed)     # persistent store

    def store(self, concept: str, value: dict, context_tag: str = "",
              price_anchor_usdt: int | None = None) -> int:
        key = engram_key(concept, context_tag)
        record = EngramRecord(
            key=key, concept=concept, context_tag=context_tag,
            value=value, price_anchor_usdt=price_anchor_usdt,
            timestamp_ns=time.time_ns(), access_count=0,
            last_accessed_ns=time.time_ns(), tier="L1",
        )
        self._l1_insert(record)
        return key

    def lookup(self, concept: str, context_tag: str = "",
               min_relevance: float = 0.0) -> EngramRecord | None:
        """
        O(1) lookup with context-aware gating.
        Returns None if record not found OR relevance score < min_relevance.
        """
        key = engram_key(concept, context_tag)
        record = (self._l1.get(key)
                  or self._l2.get(key)
                  or self._l3_lookup(key))
        if record is None:
            return None
        relevance = self._relevance_score(record)
        if relevance < min_relevance:
            return None     # gate: suppress stale / irrelevant memory
        record.access_count += 1
        record.last_accessed_ns = time.time_ns()
        self._promote_to_l1(record)
        return record

    def _relevance_score(self, record: EngramRecord) -> float:
        """
        Relevance score ∈ [0.0, 1.0].
        Decays with age and rises with access frequency.
        """
        age_seconds = (time.time_ns() - record.timestamp_ns) / 1e9
        recency = 1.0 / (1.0 + age_seconds / 3600)       # half-life ~1 hour
        frequency = min(1.0, record.access_count / 10.0)  # saturates at 10 accesses
        return 0.6 * recency + 0.4 * frequency

    def inject_context(self, agent_context: dict,
                       relevant_concepts: list[str],
                       context_tag: str = "",
                       min_relevance: float = 0.3) -> dict:
        """
        Inject relevant Engram records into agent context.
        Only records scoring above min_relevance are included.
        Returns a copy of agent_context augmented with 'engram_memory' key.
        """
        injected = []
        for concept in relevant_concepts:
            record = self.lookup(concept, context_tag, min_relevance)
            if record:
                injected.append({
                    "concept": record.concept,
                    "value": record.value,
                    "relevance": self._relevance_score(record),
                    "price_anchor_usdt": record.price_anchor_usdt,
                })
        result = dict(agent_context)
        result["engram_memory"] = injected
        return result
```

### 2.5 USDT/USDC Price Anchoring

Every stored fact that involves a monetary value is anchored to its USDT equivalent at storage time. This ensures that cross-epoch comparisons are meaningful regardless of asset price movements. Storage and retrieval always use integer microunits (1 USDT = 1,000,000 µUSDT) to avoid floating-point drift.

---

## Pillar 3 — God Mode MEV Data Stack

### 3.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    MEV DATA STACK (3 Tiers)                         │
│                                                                      │
│  TIER 1 — MEV ALPHA (primary)                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Source A: Flashbots MEV Relay — WebSocket streaming           │ │
│  │  Source B: Bitquery Ethereum Mempool GraphQL subscription      │ │
│  │  Source C: Private RPC (Infura/Alchemy Premium) eth_subscribe  │ │
│  │  Target:   pending swaps, sandwich windows, liquidation txs    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  TIER 2 — ON-CHAIN REAL-TIME (support)                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  DEX price feeds: Uniswap v3, Curve, Balancer AMM reserves     │ │
│  │  On-chain events: ERC-20 Transfer, Swap, Sync (via eth_logs)   │ │
│  │  Pool state: tick, sqrtPriceX96, liquidity (Uniswap v3)        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  TIER 3 — LEGACY OHLC (deprioritized)                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  CoinGecko REST / Binance OHLC                                 │ │
│  │  Used only for: backtesting, performance attribution           │ │
│  │  NOT used for live MEV decisions                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 MEV WebSocket Client

```python
# cognitum/mev_websocket.py

import asyncio
import json
import websockets
from dataclasses import dataclass
from typing import AsyncIterator, Callable

@dataclass
class PendingTransaction:
    tx_hash: str
    from_address: str
    to_address: str           # contract address (DEX router, etc.)
    input_data: str           # ABI-encoded calldata
    gas_price_gwei: float
    max_fee_per_gas_gwei: float | None
    value_wei: int
    nonce: int
    # Decoded context (populated by MEVDecoder after receipt)
    decoded_function: str | None = None    # e.g. "swapExactTokensForTokens"
    token_in: str | None = None
    token_out: str | None = None
    amount_in_micro_usdt: int | None = None


class FlashbotsMEVWebSocket:
    """
    Connects to Flashbots MEV-Share (or MEV-Boost relay) WebSocket endpoint.
    Streams pending transaction hints in real time.
    """

    FLASHBOTS_MEV_SHARE_WS = "wss://mev-share.flashbots.net"

    def __init__(self, on_pending_tx: Callable[[PendingTransaction], None],
                 private_rpc_fallback: str | None = None):
        self.on_pending_tx = on_pending_tx
        self.private_rpc = private_rpc_fallback
        self._running = False

    async def connect_and_stream(self):
        self._running = True
        while self._running:
            try:
                async with websockets.connect(self.FLASHBOTS_MEV_SHARE_WS,
                                               ping_interval=30,
                                               ping_timeout=10) as ws:
                    # Subscribe to pending tx hints
                    subscribe_msg = {
                        "jsonrpc": "2.0", "id": 1, "method": "mev_subscribe",
                        "params": ["pendingTransactions",
                                   {"builders": ["all"], "privacy": {"hints": ["calldata", "logs"]}}]
                    }
                    await ws.send(json.dumps(subscribe_msg))
                    async for raw_msg in ws:
                        msg = json.loads(raw_msg)
                        if "params" in msg and "result" in msg["params"]:
                            tx = self._parse_flashbots_hint(msg["params"]["result"])
                            if tx:
                                await self.on_pending_tx(tx)   # non-blocking callback
            except websockets.ConnectionClosed:
                await asyncio.sleep(1)   # brief reconnect delay
            except Exception as exc:
                # Log and attempt reconnect; never crash the event loop
                await asyncio.sleep(5)

    def _parse_flashbots_hint(self, hint: dict) -> PendingTransaction | None:
        try:
            return PendingTransaction(
                tx_hash=hint.get("hash", ""),
                from_address=hint.get("from", ""),
                to_address=hint.get("to", ""),
                input_data=hint.get("callData", "0x"),
                gas_price_gwei=float(hint.get("gasPrice", 0)) / 1e9,
                max_fee_per_gas_gwei=float(hint.get("maxFeePerGas", 0)) / 1e9
                                     if hint.get("maxFeePerGas") else None,
                value_wei=int(hint.get("value", 0), 16),
                nonce=int(hint.get("nonce", 0), 16),
            )
        except (KeyError, ValueError):
            return None


class BitqueryMempoolStream:
    """
    Bitquery GraphQL WebSocket subscription for Ethereum mempool.
    Provides richer decoded data than raw Flashbots hints.
    """

    BITQUERY_WS = "wss://streaming.bitquery.io/eap"
    SUBSCRIPTION = """
    subscription {
      EVM(mempool: true) {
        Transactions(
          where: {Transaction: {To: {in: [
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap v2 router
            "0xE592427A0AEce92De3Edee1F18E0157C05861564",  # Uniswap v3 router
            "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"   # Sushiswap router
          ]}}) {
            Transaction { Hash, From, To, Value, Gas, GasPrice, Nonce, Data }
            Block { Number }
          }
        }
      }
    }
    """

    def __init__(self, api_key: str, on_pending_tx: Callable):
        self.api_key = api_key
        self.on_pending_tx = on_pending_tx

    async def connect_and_stream(self):
        headers = {"Authorization": f"Bearer {self.api_key}"}
        while True:
            try:
                async with websockets.connect(self.BITQUERY_WS,
                                               additional_headers=headers) as ws:
                    await ws.send(json.dumps({
                        "type": "start", "id": "1",
                        "payload": {"query": self.SUBSCRIPTION}
                    }))
                    async for raw_msg in ws:
                        msg = json.loads(raw_msg)
                        # parse and emit PendingTransaction objects
                        for tx_data in (msg.get("payload", {})
                                            .get("data", {})
                                            .get("EVM", {})
                                            .get("Transactions", [])):
                            tx = self._parse(tx_data)
                            if tx:
                                await self.on_pending_tx(tx)
            except Exception:
                await asyncio.sleep(2)

    def _parse(self, data: dict) -> PendingTransaction | None:
        t = data.get("Transaction", {})
        try:
            return PendingTransaction(
                tx_hash=t["Hash"], from_address=t["From"], to_address=t["To"],
                input_data=t.get("Data", "0x"),
                gas_price_gwei=float(t.get("GasPrice", 0)) / 1e9,
                max_fee_per_gas_gwei=None,
                value_wei=int(t.get("Value", 0)),
                nonce=int(t.get("Nonce", 0)),
            )
        except (KeyError, ValueError):
            return None
```

### 3.3 MEV Opportunity Scoring

All token pairs are denominated in USDT or USDC. BTC base pairs are never used. All monetary values in the opportunity record are stored in integer microunits.

```python
@dataclass
class MEVOpportunity:
    """
    Scored MEV opportunity. Only opportunities with net_pnl_usdt > threshold
    are forwarded to execution agents.
    """
    opportunity_id: str           # UUID v4
    strategy_type: str            # "sandwich" | "backrun" | "liquidation" | "arbitrage"
    target_tx_hash: str           # the victim transaction
    block_number_target: int

    # Pair — always USDT or USDC quote
    base_token: str               # e.g. "WETH"
    quote_token: str              # "USDT" or "USDC" — never BTC
    dex_address: str              # Uniswap v3 pool, Curve pool, etc.

    # Financials (integer microunits: 1 USDT = 1_000_000)
    expected_profit_micro_usdt: int
    gas_cost_micro_usdt: int
    net_pnl_micro_usdt: int       # expected_profit - gas_cost

    # Derived floats for display only — never used in signing
    @property
    def expected_profit_usdt(self) -> float:
        return self.expected_profit_micro_usdt / 1_000_000

    @property
    def gas_cost_usdt(self) -> float:
        return self.gas_cost_micro_usdt / 1_000_000

    @property
    def net_pnl_usdt(self) -> float:
        return self.net_pnl_micro_usdt / 1_000_000

    confidence: float             # 0.0 – 1.0 (model confidence in profit estimate)
    time_sensitivity_ms: int      # milliseconds before opportunity window closes
    detected_at_ns: int           # time.time_ns() when detected


class MEVOpportunityScorer:
    """
    Scores a PendingTransaction against current on-chain state.
    Returns a MEVOpportunity if the opportunity exceeds the minimum profit threshold.
    """
    MIN_NET_PNL_MICRO_USDT = 5_000_000   # 5.00 USDT minimum net P&L

    def __init__(self, engram: EngramMemory, gas_oracle_url: str):
        self.engram = engram
        self.gas_oracle_url = gas_oracle_url

    async def score(self, tx: PendingTransaction,
                    pool_state: dict) -> MEVOpportunity | None:
        """
        Returns None if opportunity is below threshold or not scoreable.
        """
        strategy = self._classify_strategy(tx)
        if strategy is None:
            return None

        gas_cost = await self._estimate_gas_cost_micro_usdt(tx)
        expected_profit = self._estimate_profit(tx, pool_state, strategy)

        net_pnl = expected_profit - gas_cost
        if net_pnl < self.MIN_NET_PNL_MICRO_USDT:
            return None

        opp = MEVOpportunity(
            opportunity_id=str(uuid.uuid4()),
            strategy_type=strategy,
            target_tx_hash=tx.tx_hash,
            block_number_target=0,    # will be set by block monitor
            base_token=tx.token_in or "UNKNOWN",
            quote_token="USDT",
            dex_address=tx.to_address,
            expected_profit_micro_usdt=expected_profit,
            gas_cost_micro_usdt=gas_cost,
            net_pnl_micro_usdt=net_pnl,
            confidence=self._estimate_confidence(tx, pool_state, strategy),
            time_sensitivity_ms=12_000,   # ~1 Ethereum block at 12s
            detected_at_ns=time.time_ns(),
        )

        # Store in Engram for future agent context
        self.engram.store(
            concept=f"mev_opportunity_{strategy}",
            value=opp.__dict__,
            context_tag=f"{opp.base_token}/USDT",
            price_anchor_usdt=opp.net_pnl_micro_usdt,
        )

        return opp

    def _classify_strategy(self, tx: PendingTransaction) -> str | None:
        fn = tx.decoded_function or ""
        if "swap" in fn.lower() and tx.amount_in_micro_usdt \
                and tx.amount_in_micro_usdt > 10_000_000_000:  # >$10,000
            return "sandwich"
        if "liquidate" in fn.lower() or "liquidationCall" in fn.lower():
            return "liquidation"
        return None
```

---

## Pillar 4 — Decentralized Compute Swarm ($NXVR Tokenomics)

### 4.1 $NXVR Token Overview

$NXVR is the native utility token of the AIQTP swarm network.

| Property | Value |
|----------|-------|
| Name | AIQTP Nexus Token |
| Symbol | $NXVR |
| Chain | EVM-compatible (initially Ethereum L2 — Base or Arbitrum) |
| Initial Supply | 1,000,000,000 NXVR |
| Mining allocation | 40% (400M NXVR over 4 years, halving every 2 years) |
| Team / Reserve | 20% (4-year linear vest) |
| Ecosystem / DAO | 25% |
| Liquidity / Exchange | 15% |
| Stake to activate | Minimum 1,000 NXVR to activate a Virtual Node |
| Hardware node bonus | Cognitum Seed nodes receive 1.5x quality multiplier floor |

### 4.2 Compute Mining — How Nodes Earn

Nodes earn $NXVR by contributing two types of validated work to the network:

1. **Mempool Data Processing** — ingesting, filtering, and forwarding pending transaction data to the swarm coordinator. Measured in validated transactions per epoch.
2. **MEV Ops Validation** — receiving a forwarded MEV opportunity, independently verifying the profit estimate, and submitting a signed validation response.

**Epoch length:** 1 hour (3,600 seconds). Rewards are computed and distributed at epoch close.

### 4.3 Reward Formula

```
epoch_reward_nxvr = base_reward_nxvr
                    × (node_compute_share / total_network_compute)
                    × quality_multiplier

base_reward_nxvr      = total_mining_emission_this_epoch
                        (decreases with halving schedule)

node_compute_share    = (txs_processed_by_node × tx_weight)
                        + (mev_ops_validated_by_node × mev_weight)

total_network_compute = Σ(compute_share) across all active nodes

quality_multiplier    = f(uptime_score, validation_accuracy, latency_score)
```

**Quality multiplier breakdown:**

```python
def compute_quality_multiplier(
    uptime_pct: float,          # 0.0 – 1.0 (fraction of epoch online)
    validation_accuracy: float, # 0.0 – 1.0 (correct vs total validations)
    latency_score: float,       # 0.0 – 1.0 (1.0 = median latency, degrades above)
    is_hardware_node: bool,
) -> float:
    """
    Quality multiplier clamped to [0.0, 2.0].
    Hardware nodes receive a minimum floor of 1.5 to incentivize Cognitum Seed adoption.
    """
    raw = (
        0.4 * uptime_pct
        + 0.4 * validation_accuracy
        + 0.2 * latency_score
    )
    # Scale to [0.0, 2.0]
    multiplier = raw * 2.0
    # Hardware node floor
    if is_hardware_node:
        multiplier = max(multiplier, 1.5)
    return round(min(multiplier, 2.0), 4)
```

**Example calculation:**

| Node | Txs Processed | MEV Ops Validated | Uptime | Accuracy | Latency Score | Is Hardware | Quality Multiplier | Compute Share | Epoch Reward (NXVR) |
|------|--------------|-------------------|--------|----------|---------------|-------------|-------------------|---------------|---------------------|
| A (Hard SIM) | 42,000 | 180 | 100% | 98% | 0.95 | Yes | 1.87 | 42,180 | 0.31% × base |
| B (Virtual) | 28,000 | 95 | 87% | 94% | 0.82 | No | 1.51 | 28,095 | 0.21% × base |
| C (Virtual) | 5,000 | 10 | 40% | 71% | 0.60 | No | 0.62 | 5,010 | 0.02% × base |

### 4.4 Staking Mechanics

```python
class StakingManager:
    """
    On-chain stake tracking. Interacts with the NXVR smart contract via web3.py.
    """

    MINIMUM_VIRTUAL_STAKE_NXVR = 1_000
    MINIMUM_HARDWARE_STAKE_NXVR = 0     # Hardware nodes stake is waived

    async def stake(self, wallet_address: str, amount_nxvr: float) -> StakeReceipt:
        """
        Submit a stake transaction to the NXVR contract.
        Returns a StakeReceipt with the on-chain tx hash.
        Engram records the stake event for future agent context.
        """
        ...

    async def get_stake(self, wallet_address: str) -> float:
        """Returns current staked NXVR balance."""
        ...

    def is_eligible(self, wallet_address: str,
                    node_type: str) -> tuple[bool, str]:
        """Returns (is_eligible, reason). Used by coordinator on node registration."""
        stake = self.get_stake_sync(wallet_address)
        minimum = (self.MINIMUM_HARDWARE_STAKE_NXVR if node_type == "hardware"
                   else self.MINIMUM_VIRTUAL_STAKE_NXVR)
        if stake < minimum:
            return False, f"Insufficient stake: {stake} NXVR (min: {minimum})"
        return True, "ok"
```

### 4.5 Slashing Conditions

A node is subject to **slashing** (partial forfeiture of staked NXVR) under the following conditions:

| Condition | Severity | Slash Amount |
|-----------|----------|-------------|
| Offline for >4 continuous hours within an epoch | Minor | 1% of epoch reward forfeit |
| Submitting a validation response with an invalid Ed25519 signature | Major | 5% of staked NXVR |
| Forwarding stale mempool data (tx already mined, age >5 blocks) | Minor | 2% of epoch reward forfeit |
| Submitting fabricated MEV opportunity data (detected via peer cross-check) | Severe | 50% of staked NXVR + node ban |
| Repeated minor violations (>3 in a single epoch) | Escalated | 10% of staked NXVR |

```python
@dataclass
class SlashEvent:
    node_id: str
    timestamp_ns: int
    condition: str          # one of the condition strings above
    severity: str           # "minor" | "major" | "severe"
    slash_amount_nxvr: float
    evidence_tx_hash: str | None   # on-chain evidence if available
    resolved: bool = False

class SlashingArbiter:
    """
    Swarm coordinator component. Called after peer cross-validation detects anomalies.
    """

    async def evaluate(self, node_id: str, condition: str,
                       evidence: dict) -> SlashEvent | None:
        """
        Applies slashing rules. Returns None if condition does not meet threshold.
        All slash events are signed by the coordinator's Ed25519 key and
        recorded to Engram L3 + on-chain settlement log.
        """
        ...
```

---

## Dual-Track Deployment

### Track 1 — Hard SIM (Physical Cognitum Seed USB)

**User journey:**

1. Purchase Cognitum Seed ($257) from store.aiqtp.com
2. Device arrives factory-provisioned with unique Ed25519 keypair in HSM
3. Plug into any Mac / Win / Linux machine with `cognitum` CLI installed
4. CLI auto-detects device on `/dev/ttyACM0` or `COM3`
5. Run `cognitum start` — device registers with swarm coordinator using HSM-signed identity
6. Node begins processing mempool data immediately; earnings accrue each epoch
7. Run `cognitum earnings` to view accrued $NXVR

**Plug-and-play guarantee:** The firmware handles all MEV relay connections. The user never configures RPC endpoints, API keys, or signing logic — the device is self-contained.

### Track 2 — eSIM / e-ware (Virtual Node)

**User journey:**

1. Download Cognitum e-ware client from aiqtp.com/download (Mac `.dmg`, Win `.exe`, Linux `.AppImage`)
2. Install and launch. First-run wizard: connect wallet, generate Ed25519 identity (stored in OS keychain)
3. Stake minimum 1,000 NXVR via in-app wallet connector
4. Click "Activate Node" — software node registers with coordinator
5. Node runs as a background service (launchd / Windows Service / systemd)
6. CLI also available: `cognitum status`, `cognitum earnings`, `cognitum stake 5000`

### E-ware Client Orchestrator — CLI Command Reference

```
cognitum start                    Start the Cognitum node (hardware or virtual)
cognitum stop                     Gracefully stop the node
cognitum status                   Show node ID, stake, uptime, current epoch stats
cognitum stake <amount>           Stake <amount> NXVR to activate / increase stake
cognitum unstake <amount>         Unstake (subject to 7-day unbonding period)
cognitum earnings                 Show accrued and claimed $NXVR earnings
cognitum earnings --claim         Claim pending earnings to connected wallet
cognitum logs [--follow]          Stream local trade execution logs
cognitum verify-signature <file>  Verify a SignedTradeLog JSON file
cognitum upgrade                  Download and apply latest firmware (hardware node)
cognitum reset                    Factory reset virtual node (does NOT clear HSM keys)
```

**CLI implementation skeleton:**

```python
# cognitum/cli.py

import argparse
import asyncio
import sys

from cognitum.cognitum_nodes import CognitumHardwareNode, CognitumVirtualNode
from cognitum.compute_mining_worker import ComputeMiningWorker


async def cmd_start(args):
    node = await _resolve_node()
    worker = ComputeMiningWorker(node)
    print(f"[cognitum] Starting node {node.node_id[:16]}... (Ctrl+C to stop)")
    await worker.run_forever()


async def cmd_status(args):
    node = await _resolve_node()
    worker = ComputeMiningWorker(node)
    status = await worker.get_status()
    print(f"Node ID:        {status['node_id']}")
    print(f"Type:           {status['node_type']}")
    print(f"Uptime:         {status['uptime_pct']:.1%}")
    print(f"Staked NXVR:    {status['stake_nxvr']:,.2f}")
    print(f"Epoch earnings: {status['epoch_earnings_nxvr']:,.4f} NXVR")
    print(f"Total earned:   {status['total_earnings_nxvr']:,.4f} NXVR")
    print(f"Quality mult:   {status['quality_multiplier']:.4f}")


async def cmd_stake(args):
    amount = float(args.amount)
    node = await _resolve_node()
    receipt = await node.staking_manager.stake(node.wallet_address, amount)
    print(f"[cognitum] Stake submitted: {receipt.tx_hash}")


async def cmd_earnings(args):
    node = await _resolve_node()
    earnings = await node.staking_manager.get_pending_earnings(node.node_id)
    print(f"[cognitum] Pending: {earnings['pending_nxvr']:,.4f} NXVR")
    print(f"[cognitum] Claimed: {earnings['claimed_nxvr']:,.4f} NXVR")
    if args.claim:
        receipt = await node.staking_manager.claim_earnings(node.node_id)
        print(f"[cognitum] Claimed! TX: {receipt.tx_hash}")


async def _resolve_node():
    """Detect hardware node on serial port; fall back to virtual node."""
    import glob
    ports = glob.glob("/dev/ttyACM*") + glob.glob("/dev/cu.usbmodem*")
    if ports:
        node = CognitumHardwareNode(serial_port=ports[0])
    else:
        node = CognitumVirtualNode()
    await node.initialize()
    return node


def main():
    parser = argparse.ArgumentParser(prog="cognitum",
                                     description="AIQTP Cognitum Node CLI")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("start")
    subparsers.add_parser("stop")
    subparsers.add_parser("status")

    stake_p = subparsers.add_parser("stake")
    stake_p.add_argument("amount", type=float)

    earnings_p = subparsers.add_parser("earnings")
    earnings_p.add_argument("--claim", action="store_true")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    cmd_map = {
        "start": cmd_start,
        "status": cmd_status,
        "stake": cmd_stake,
        "earnings": cmd_earnings,
    }
    asyncio.run(cmd_map[args.command](args))


if __name__ == "__main__":
    main()
```

---

## File Map and Module Reference

All files live under `cognitum/` in the repository root.

```
cognitum/
├── __init__.py
├── cognitum_nodes.py          — CognitumHardwareNode, CognitumVirtualNode,
│                                NodeIdentity, AgentPool, TradeExecutionLog,
│                                SignedTradeLog
├── engram_memory.py           — EngramMemory, EngramRecord, engram_hash,
│                                engram_key
├── mempool_sniper_agent.py    — MemPoolSniperAgent, MEVOpportunityScorer,
│                                MEVOpportunity, PendingTransaction,
│                                MEVDecoder (ABI decoding)
├── mev_websocket.py           — FlashbotsMEVWebSocket, BitqueryMempoolStream,
│                                PrivateRPCMempoolClient
├── compute_mining_worker.py   — ComputeMiningWorker, StakingManager,
│                                SlashingArbiter, SlashEvent,
│                                EpochRewardCalculator
└── cli.py                     — cognitum CLI entrypoint (argparse)
```

### Module Responsibilities

**`cognitum_nodes.py`**
- Defines the two node archetypes and their shared interface (`BaseCognitumNode`)
- Contains `TradeExecutionLog` and `SignedTradeLog` with `canonical_bytes()` serialization
- Manages the `AgentPool` for sub-50ms agent spawn times
- Implements the async event loop with `EventType` dispatch

**`engram_memory.py`**
- Self-contained amnesia-free memory implementation
- No external ML dependencies — pure Python hash functions
- L1/L2 implemented as in-process Python dicts with LRU eviction
- L3 implemented as SQLite (virtual node) or flash NOR store (hardware node)
- Exports: `EngramMemory`, `EngramRecord`, `engram_hash`, `engram_key`

**`mempool_sniper_agent.py`**
- The primary execution agent — receives `MEVOpportunity`, constructs Flashbots bundle, submits
- Implements `MEVDecoder` (ABI decoding for Uniswap v2/v3, Curve, Sushiswap function selectors)
- `MEVOpportunityScorer` produces scored opportunities from raw pending transactions
- All monetary values in USDT microunits

**`mev_websocket.py`**
- Three WebSocket client implementations: Flashbots MEV-Share, Bitquery GraphQL, Private RPC
- Each implements `connect_and_stream()` — an infinite async loop with automatic reconnect
- All emit `PendingTransaction` objects to a shared `on_pending_tx` callback
- No shared mutable state between clients — each runs in its own `asyncio.Task`

**`compute_mining_worker.py`**
- Wraps a `BaseCognitumNode` into the swarm's compute accounting system
- `ComputeMiningWorker.run_forever()` — the top-level service loop
- `EpochRewardCalculator.compute_reward()` — pure function, fully testable
- `StakingManager` — web3.py interface to the NXVR ERC-20 staking contract
- `SlashingArbiter` — evaluates slash conditions and records events to Engram L3

**`cli.py`**
- `argparse`-based CLI; `cognitum` is the entrypoint (configured in `setup.py` / `pyproject.toml`)
- Thin layer over the underlying node and worker classes — no business logic in the CLI itself

---

## Data Structures Reference

### Core Type Hierarchy

```
BaseCognitumNode (abstract)
├── CognitumHardwareNode
└── CognitumVirtualNode

EngramMemory
└── EngramRecord (stored value)

PendingTransaction                 ← raw mempool input
    └── MEVOpportunity             ← scored output
        └── TradeExecutionLog      ← execution record
            └── SignedTradeLog     ← signed record (coordinator-accepted)

ComputeMiningWorker
├── StakingManager
├── SlashingArbiter
└── EpochRewardCalculator
```

### Key Numeric Conventions

| Quantity | Unit | Why |
|----------|------|-----|
| All monetary values (storage / signing) | Integer µUSDT (× 1,000,000) | No floating-point drift; safe for Ed25519 canonical bytes |
| All timestamps | Integer nanoseconds (`time.time_ns()`) | No timezone, no ambiguity, sub-millisecond resolution |
| Gas prices | Integer Gwei (× 1,000,000,000 from wei) | Avoid float |
| $NXVR amounts | float (display only) / `Decimal` for accounting | Token amounts tolerate float at 18-decimal ERC-20 precision |
| Engram hash keys | 64-bit unsigned int | Fits Python `int`; never negative |

---

## Integration with Existing Stack

The Cognitum swarm integrates with the existing AIQTP platform at three points:

### 1. Trading Service (aiqtp-trading-service on Render)

The existing broker router (`/brokers/*`) remains the execution endpoint for non-MEV trades. The `MemPoolSniperAgent` calls these endpoints for on-chain MEV execution when a Flashbots bundle is not applicable (e.g. CEX arbitrage after an on-chain event).

Relevant existing endpoints used by Cognitum agents:
- `POST /brokers/binance/order` — spot execution on Binance
- `POST /brokers/kraken/order` — spot execution on Kraken
- `GET  /brokers/tradier/quotes` — equity price confirmation

### 2. Core Brain Trading Worker (Render Worker)

The existing `trading_worker.py` loop will be extended with a Cognitum event publisher: when the worker detects a strategy signal, it publishes a `ComputeTask` event to the swarm coordinator, which fans it out to eligible nodes for parallel validation and execution.

### 3. Supabase Edge Functions + Database

`SignedTradeLog` records are written to the `trade_logs` table (Render PostgreSQL) with the `signature` and `signing_method` columns added. The Supabase real-time subscription on `trade_logs` drives the frontend dashboard — no change needed to the subscription logic.

### 4. Frontend (React / Vite on Vercel)

A new `SwarmStatus` dashboard component will be added under `src/pages/SwarmStatus.tsx`. It reads:
- Live node count from the swarm coordinator `/swarm/nodes` endpoint
- Epoch reward data from `/swarm/epoch`
- Personal node status from `/swarm/nodes/{node_id}`

The `VITE_RENDER_WORKER_URL` env var already points to the trading service — the swarm coordinator will be deployed on the same service under `/swarm/*`.

---

## Security Model

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Compromised host OS forges trade signatures (virtual node) | OS keychain encryption; private key never written to disk |
| Physical hardware node theft / key extraction | ATECC608B HSM: anti-tamper + key zeroing on attack detection |
| Sybil attack (fake nodes flood the swarm) | Minimum NXVR stake requirement; Ed25519 identity pinned to stake |
| Fabricated MEV opportunity data | Peer cross-validation: 3+ nodes must independently confirm opportunity before execution |
| Replay attack on signed trade logs | `timestamp_ns` + `log_id` (UUID v4) are part of the canonical bytes; coordinator deduplicates |
| Man-in-the-middle between node and coordinator | WSS (WebSocket over TLS); coordinator Ed25519 public key pinned in node firmware |
| Gas price manipulation during MEV bundle submission | Gas oracle cross-check against 3 sources before `gas_cost_micro_usdt` is finalized |

### Key Management Summary

```
Hardware Node:
  Private key → ATECC608B HSM (write-once, never readable)
  Public key  → coordinator registration + SignedTradeLog.signer

Virtual Node:
  Private key → OS keychain (macOS Keychain / Windows DPAPI / libsecret)
              → loaded into memory on node start, zeroed on stop
  Public key  → coordinator registration + SignedTradeLog.signer

Swarm Coordinator:
  Private key → Render environment variable (never in code)
  Public key  → distributed to all nodes in initial handshake
```

---

## Roadmap

### Phase 0 — Foundation (Current)
- [x] Existing trading service with broker integrations (Binance, Kraken, Tradier, IBKR)
- [x] Core brain trading worker with Render PostgreSQL
- [ ] This architecture document (SWARM_ARCHITECTURE.md)

### Phase 1 — Engram + MEV Websocket (Weeks 1–4)
- [ ] `cognitum/engram_memory.py` — full L1/L2/L3 implementation
- [ ] `cognitum/mev_websocket.py` — Flashbots MEV-Share + Bitquery connectors
- [ ] `cognitum/mempool_sniper_agent.py` — MEV decoder + opportunity scorer
- [ ] Unit tests for Engram hash correctness, MEV scoring, canonical bytes signing

### Phase 2 — Virtual Node + CLI (Weeks 5–8)
- [ ] `cognitum/cognitum_nodes.py` — CognitumVirtualNode fully implemented
- [ ] `cognitum/cli.py` — `cognitum start`, `status`, `earnings` commands
- [ ] `cognitum/compute_mining_worker.py` — epoch reward calculation (off-chain simulation)
- [ ] Swarm coordinator deployed on Render (new service: `aiqtp-swarm-coordinator`)
- [ ] Frontend `SwarmStatus` dashboard page

### Phase 3 — Hardware Node + $NXVR (Weeks 9–16)
- [ ] Cognitum Seed firmware (C/C++ on STM32H7 + ATECC608B integration)
- [ ] Serial protocol specification and Python host driver
- [ ] `CognitumHardwareNode` full implementation
- [ ] $NXVR ERC-20 contract deployed on Base (or Arbitrum)
- [ ] Staking contract deployed; `StakingManager` integration complete
- [ ] Slashing arbiter live with peer cross-validation

### Phase 4 — Swarm Scale + MEV Live (Weeks 17–24)
- [ ] Flashbots bundle submission live (testnet first, then mainnet)
- [ ] Sandwich / backrun / liquidation strategies validated on mainnet
- [ ] Cognitum Seed hardware production run (first 500 units)
- [ ] $NXVR liquidity pool established
- [ ] Swarm network target: 100+ active nodes

---

*This document is the authoritative architecture reference for the AIQTP Cognitum Swarm. All implementation decisions should be traceable to a pillar and section defined here. When implementation diverges from this blueprint, update this document first.*
