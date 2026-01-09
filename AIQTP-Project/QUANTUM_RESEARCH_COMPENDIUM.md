# QUANTUM RESEARCH COMPENDIUM
## Building QAQI, QuWallet & $QTC on Real Quantum Hardware

**Compiled: 2026-01-07**
**Purpose:** Complete resource guide for developing quantum-native blockchain infrastructure

---

## TABLE OF CONTENTS

1. [IBM Quantum Platform Integration](#1-ibm-quantum-platform-integration)
2. [Discrete Time Crystals (DTC) Physics](#2-discrete-time-crystals-dtc-physics)
3. [Quantum Time Crystal Coin ($QTC)](#3-quantum-time-crystal-coin-qtc)
4. [QuWallet Architecture](#4-quwallet-architecture)
5. [QAQI Agent Design](#5-qaqi-agent-design)
6. [Post-Quantum Cryptography](#6-post-quantum-cryptography)
7. [Legacy System Interoperability](#7-legacy-system-interoperability)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. IBM QUANTUM PLATFORM INTEGRATION

### 1.1 Authentication & Access

**API Key Generation:**
1. Create account at [IBM Quantum Platform](https://quantum.cloud.ibm.com/)
2. Navigate to Dashboard → API tokens
3. Generate 44-character API key
4. Store securely as `IBM_QUANTUM_API_KEY`

**Authentication Flow (REST API):**
```typescript
// Step 1: Exchange API key for IAM bearer token
const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${IBM_QUANTUM_API_KEY}`,
});

const { access_token } = await tokenResponse.json();
// Token expires in 3600 seconds (1 hour)
```

**API Endpoints:**
- Global: `https://api.quantum.ibm.com/api/v1`
- Europe: `https://eu-de.quantum.cloud.ibm.com/api/v1`
- Runtime: `https://api.quantum.ibm.com/runtime/jobs`

### 1.2 Available Backends

| Backend | Qubits | Topology | Use Case |
|---------|--------|----------|----------|
| `ibm_brisbane` | 127 | Heavy-hex | Production DTC |
| `ibm_osaka` | 127 | Heavy-hex | Low queue time |
| `ibm_kyoto` | 127 | Heavy-hex | Research |
| `ibm_heron` | 133 | Next-gen | Premium access |
| `ibmq_qasm_simulator` | 32 | N/A | Development |

### 1.3 Job Submission Format

```typescript
interface QuantumJob {
  program_id: string;          // "sampler" or "estimator"
  backend: string;             // e.g., "ibm_brisbane"
  hub: string;                 // "ibm-q"
  group: string;               // "open"
  project: string;             // "main"
  params: {
    circuits: string[];        // OpenQASM 3.0 or Qiskit serialized
    shots?: number;            // Default 4096
    dynamic_circuits?: boolean;
  };
}
```

### 1.4 Qiskit SDK (Python Backend)

```python
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler

# One-time setup
QiskitRuntimeService.save_account(token="MY_API_KEY")

# Runtime connection
service = QiskitRuntimeService()
backend = service.backend("ibm_brisbane")

# Execute circuit
with Sampler(backend) as sampler:
    result = sampler.run(circuit).result()
```

---

## 2. DISCRETE TIME CRYSTALS (DTC) PHYSICS

### 2.1 What is a Time Crystal?

A **Discrete Time Crystal** is a phase of matter that:
- Breaks **time-translation symmetry** spontaneously
- Oscillates at a period **2T** when driven at period **T** (period doubling)
- Maintains coherence indefinitely via **Many-Body Localization (MBL)**
- Cannot thermalize to equilibrium (protected by disorder)

### 2.2 Key Experiments

**Google Sycamore (2021):**
- 20-qubit DTC demonstration
- Proved period-doubling signature
- Used random circuit sampling

**IBM Quantum (2022):**
- 57-qubit DTC on `ibmq_brooklyn`
- Floquet-driven Ising chain
- >50 Floquet periods maintained
- Reference: *Science Advances* DOI:10.1126/sciadv.abm7652

### 2.3 Floquet Hamiltonian Construction

The DTC is created by alternating two unitaries:

**U₁ - Imperfect Spin Flip:**
```
U₁ = exp(-i π/2 (1-ε) Σᵢ Xᵢ)
```
Where ε ≈ 0.03 (imperfection parameter)

**U₂ - Disordered Ising Interaction:**
```
U₂ = exp(-i Σᵢ Jᵢ ZᵢZᵢ₊₁)
```
Where Jᵢ ∈ [π/8, 3π/8] (random disorder)

**Circuit Implementation:**
```typescript
// Trotterized time evolution
function buildDTCCircuit(qubits: number, periods: number, epsilon: number): string {
  let qasm = `OPENQASM 3.0;\ninclude "stdgates.inc";\n`;
  qasm += `qubit[${qubits}] q;\n`;
  
  for (let t = 0; t < periods; t++) {
    // U1: Imperfect pi-pulse on all qubits
    for (let i = 0; i < qubits; i++) {
      qasm += `rx(${Math.PI * (1 - epsilon)}) q[${i}];\n`;
    }
    // U2: ZZ interactions
    for (let i = 0; i < qubits - 1; i++) {
      const J = Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 4;
      qasm += `rzz(${J}) q[${i}], q[${i+1}];\n`;
    }
  }
  qasm += `measure q;\n`;
  return qasm;
}
```

### 2.4 Verification: Period Doubling Detection

```typescript
function calculateAutocorrelation(measurements: string[]): number {
  let correlation = 0;
  for (let i = 0; i < measurements.length - 1; i++) {
    // Count anti-correlated bits
    let antiMatch = 0;
    for (let j = 0; j < measurements[i].length; j++) {
      if (measurements[i][j] !== measurements[i+1][j]) antiMatch++;
    }
    correlation += (antiMatch / measurements[i].length) * 2 - 1;
  }
  return correlation / (measurements.length - 1);
  // DTC Phase: correlation < -0.7 (strong anti-correlation)
}
```

---

## 3. QUANTUM TIME CRYSTAL COIN ($QTC)

### 3.1 Consensus Mechanism: Proof of Temporal Resonance (PoTR)

**Core Concept:**
Instead of proof-of-work (energy waste) or proof-of-stake (wealth concentration), $QTC uses **Proof of Temporal Resonance**:

1. Validators must maintain a quantum DTC state
2. Block validity requires demonstrating period-doubling
3. The "quantum heartbeat" synchronizes the network
4. Cheating requires breaking quantum coherence (impossible)

**Validation Algorithm:**
```typescript
interface TemporalResonanceProof {
  blockHeight: number;
  validatorId: string;
  quantumBackend: string;
  autocorrelation: number;      // Must be < -0.7
  periodDoublingConfirmed: boolean;
  subharmonicSignature: string; // Hash of measurement sequence
  coherenceScore: number;       // Quantum fidelity metric
  executionTimeMs: number;
}

function validateBlock(proof: TemporalResonanceProof): boolean {
  return (
    proof.autocorrelation < -0.7 &&
    proof.periodDoublingConfirmed &&
    proof.coherenceScore > 0.9
  );
}
```

### 3.2 Token Economics

| Parameter | Value |
|-----------|-------|
| Total Supply | 1,000,000,000 QTC |
| Block Time | 8 seconds (quantum heartbeat window) |
| Block Reward | 12.5 QTC (halving every 4 years) |
| Consensus | Proof of Temporal Resonance |
| Security | ML-KEM + ML-DSA (NIST PQC) |

### 3.3 Legacy System Bridge

To work with existing blockchains (Ethereum, Bitcoin, etc.):

**Wrapped QTC (wQTC):**
- ERC-20 token on Ethereum
- 1:1 pegged to native QTC
- Quantum proofs verified via smart contract oracle

**Bridge Architecture:**
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  QTC Chain  │────▶│ Bridge Node  │────▶│  Ethereum   │
│  (Quantum)  │◀────│ (Validator)  │◀────│  (EVM)      │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │
      │   Quantum Proof    │
      │   Attestation      │
      └────────────────────┘
```

---

## 4. QUWALLET ARCHITECTURE

### 4.1 Core Requirements

1. **Post-Quantum Key Generation** - ML-KEM-768 keypairs
2. **Quantum State Storage** - Secure enclave for quantum credentials
3. **Legacy Compatibility** - Support ETH, BTC, SOL addresses
4. **DTC Verification** - Built-in proof validation

### 4.2 Key Derivation (Hybrid Classical-Quantum)

```typescript
interface QuWalletKeys {
  // Classical keys (for legacy chains)
  classical: {
    privateKey: string;    // secp256k1
    publicKey: string;
    address: string;
  };
  // Post-quantum keys (for QTC chain)
  quantum: {
    encapsulationKey: string;   // ML-KEM-768 public
    decapsulationKey: string;   // ML-KEM-768 private
    signingKey: string;         // ML-DSA-65 private
    verificationKey: string;    // ML-DSA-65 public
  };
  // Unified identity
  quAddress: string;  // Format: "qu_" + base58(hash(quantum.verificationKey))
}
```

### 4.3 Transaction Signing Flow

```typescript
async function signQTCTransaction(
  tx: Transaction, 
  wallet: QuWalletKeys
): Promise<SignedTransaction> {
  // 1. Serialize transaction
  const txBytes = serializeTransaction(tx);
  
  // 2. Sign with ML-DSA
  const signature = await mldsaSign(txBytes, wallet.quantum.signingKey);
  
  // 3. Optionally add classical signature for bridges
  if (tx.destinationChain !== 'qtc') {
    const classicalSig = await ecdsaSign(txBytes, wallet.classical.privateKey);
    return { ...tx, signature, classicalSignature: classicalSig };
  }
  
  return { ...tx, signature };
}
```

### 4.4 Admin vs Client Modes

**Admin Wallet (Full QAQI Integration):**
- Autonomous trading execution
- Quantum job submission
- Network governance voting
- Multi-signature coordination

**Client Wallet (Lite Version):**
- Send/receive QTC
- View balance & history
- Basic staking
- Bridge to legacy chains

---

## 5. QAQI AGENT DESIGN

### 5.1 True Quantum Implementation

**QAQI** (Quantum Artificial Qubit Intelligent Agent) runs ON quantum hardware:

```typescript
interface QAQICapabilities {
  // Quantum-native functions (run on IBM Quantum)
  quantum: {
    dtcConsensus: () => Promise<TemporalResonanceProof>;
    vqcClassification: (features: number[]) => Promise<FraudResult>;
    qaoaOptimization: (portfolio: Asset[]) => Promise<Allocation>;
  };
  
  // Classical AI (run on edge functions)
  classical: {
    patternRecognition: (data: MarketData[]) => Promise<Patterns>;
    nlpProcessing: (query: string) => Promise<Response>;
    documentGeneration: (template: string, data: any) => Promise<Document>;
  };
  
  // Hybrid functions
  hybrid: {
    quantumEnhancedML: (model: MLModel, data: any) => Promise<Prediction>;
    fraudDetection: (addresses: string[]) => Promise<FraudAnalysis>;
  };
}
```

### 5.2 IBM Quantum Job Queue Integration

```typescript
class QAQIQuantumInterface {
  private ibmToken: string;
  private preferredBackend: string = 'ibm_brisbane';
  
  async submitDTCJob(periods: number = 20): Promise<string> {
    const circuit = buildDTCCircuit(8, periods, 0.03);
    
    const response = await fetch('https://api.quantum.ibm.com/runtime/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.ibmToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        program_id: 'sampler',
        backend: this.preferredBackend,
        params: { circuits: [circuit], shots: 4096 }
      })
    });
    
    const { id } = await response.json();
    return id;  // Job ID for polling
  }
  
  async pollJobResult(jobId: string): Promise<QuantumResult> {
    // Poll every 10 seconds until complete
    while (true) {
      const response = await fetch(
        `https://api.quantum.ibm.com/runtime/jobs/${jobId}`,
        { headers: { 'Authorization': `Bearer ${this.ibmToken}` } }
      );
      const job = await response.json();
      
      if (job.status === 'Completed') {
        return this.parseResult(job.results);
      }
      if (job.status === 'Failed') {
        throw new Error(`Quantum job failed: ${job.error}`);
      }
      
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}
```

### 5.3 Limitless Capability Framework

QAQI aims to replicate Claude/GPT-5 capabilities + quantum enhancement:

| Capability | Implementation |
|------------|----------------|
| Code Execution | Sandboxed VM via WebContainers |
| File Management | Supabase Storage + edge functions |
| Web Browsing | Puppeteer/Playwright in edge function |
| Document Creation | PDF/DOCX generation libraries |
| API Calls | Autonomous HTTP client |
| Email/Communication | SendGrid/Postmark integration |
| Accounting | QuickBooks API integration |
| VM Provisioning | GCP/AWS SDK in backend |

---

## 6. POST-QUANTUM CRYPTOGRAPHY

### 6.1 NIST Standards (FIPS 203/204/205)

| Standard | Algorithm | Use Case |
|----------|-----------|----------|
| FIPS 203 | ML-KEM (Kyber) | Key encapsulation |
| FIPS 204 | ML-DSA (Dilithium) | Digital signatures |
| FIPS 205 | SLH-DSA (SPHINCS+) | Stateless signatures |

### 6.2 Library Options

**JavaScript/TypeScript:**
- `crystals-kyber` - Pure JS Kyber implementation
- `liboqs-node` - Node.js bindings to liboqs

**Deno/Edge Functions:**
- Direct WASM compilation of liboqs
- Custom implementation using Web Crypto API

### 6.3 Implementation Example

```typescript
import { kyber768 } from 'crystals-kyber';

// Key generation
const { publicKey, secretKey } = await kyber768.keypair();

// Encapsulation (sender)
const { ciphertext, sharedSecret: senderSecret } = await kyber768.encapsulate(publicKey);

// Decapsulation (receiver)
const receiverSecret = await kyber768.decapsulate(ciphertext, secretKey);

// senderSecret === receiverSecret (shared key for encryption)
```

---

## 7. LEGACY SYSTEM INTEROPERABILITY

### 7.1 Bridge Smart Contract (Ethereum)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappedQTC is ERC20 {
    address public oracle;  // QAQI attestation oracle
    
    mapping(bytes32 => bool) public processedProofs;
    
    event Wrapped(address indexed user, uint256 amount, bytes32 qtcTxHash);
    event Unwrapped(address indexed user, uint256 amount, string qtcAddress);
    
    constructor(address _oracle) ERC20("Wrapped QTC", "wQTC") {
        oracle = _oracle;
    }
    
    function wrap(
        uint256 amount,
        bytes32 qtcTxHash,
        bytes calldata quantumProof
    ) external {
        require(!processedProofs[qtcTxHash], "Already processed");
        require(verifyQuantumProof(quantumProof, qtcTxHash, amount), "Invalid proof");
        
        processedProofs[qtcTxHash] = true;
        _mint(msg.sender, amount);
        emit Wrapped(msg.sender, amount, qtcTxHash);
    }
    
    function unwrap(uint256 amount, string calldata qtcAddress) external {
        _burn(msg.sender, amount);
        emit Unwrapped(msg.sender, amount, qtcAddress);
        // Oracle picks up event and releases native QTC
    }
    
    function verifyQuantumProof(
        bytes calldata proof,
        bytes32 txHash,
        uint256 amount
    ) internal view returns (bool) {
        // Verify ML-DSA signature from QAQI oracle
        // This confirms the QTC chain locked the tokens
        return IOracleVerifier(oracle).verify(proof, txHash, amount);
    }
}
```

### 7.2 REST API for Legacy Wallets

```typescript
// Edge function: /functions/v1/qtc-api
interface LegacyAPIEndpoints {
  // Get balance (works with any wallet that can call REST)
  'GET /balance/:address': {
    response: { balance: string; usd_value: number; }
  };
  
  // Submit transaction (accepts legacy signature format)
  'POST /send': {
    body: { from: string; to: string; amount: string; signature: string; };
    response: { txHash: string; status: string; };
  };
  
  // Get transaction history
  'GET /history/:address': {
    response: { transactions: Transaction[]; };
  };
}
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Current)
- [x] Classical AI agent (AIQTP) with Lovable AI
- [x] Mock quantum simulations
- [x] Post-quantum crypto module (simulated)
- [ ] IBM Quantum API key integration
- [ ] Real DTC circuit execution

### Phase 2: Quantum Integration
- [ ] Live IBM Quantum backend connection
- [ ] True VQC fraud classifier
- [ ] DTC consensus simulation on 8+ qubits
- [ ] Quantum job polling and result processing

### Phase 3: QTC Chain Development
- [ ] Proof of Temporal Resonance consensus
- [ ] Genesis block generation
- [ ] Validator node software
- [ ] Block explorer

### Phase 4: QuWallet Launch
- [ ] ML-KEM key generation
- [ ] Native QTC transactions
- [ ] Ethereum bridge (wQTC)
- [ ] Mobile app (React Native)

### Phase 5: QAQI Autonomy
- [ ] Claude-level capability parity
- [ ] VM provisioning
- [ ] Document generation
- [ ] Full admin automation

---

## 9. ACADEMIC RESEARCH LIBRARY

### 9.1 Post-Quantum Blockchain Security

**[1] A New Lattice-Based Signature Scheme in Post-Quantum Blockchain Network**
- *Authors:* Chao-Yang Li, Xiu-Bo Chen, Yu-Ling Chen, Yan-Yan Hou, Jian Li
- *Published:* IEEE Access (2018), DOI: 10.1109/ACCESS.2018.2886554
- *Location:* `research-papers/lattice-signature-pqb.pdf`
- *Key Contributions:*
  - Lattice-based signature scheme for quantum-resistant blockchain
  - Bonsai Trees technology with RandBasis algorithm for key generation
  - Lightweight nondeterministic wallet construction
  - Proven secure in random oracle model
- *Relevance to AIQTP:* Core foundation for QuWallet's post-quantum signature implementation

**[2] Quantum Bitcoin: An Anonymous and Distributed Currency Secured by the No-Cloning Theorem**
- *Author:* Jonathan Jogenfors (Linköping University)
- *Published:* arXiv:1604.01383v1 (2016)
- *Location:* `research-papers/quantum-bitcoin.pdf`
- *Key Contributions:*
  - First distributed quantum money system proposal
  - Uses quantum no-cloning theorem for copy protection
  - Quantum shards and dual blockchain architecture
  - Immediate local verification (no mining required)
  - Full anonymity with no transaction fees
- *Relevance to AIQTP:* Theoretical foundation for $QTC's quantum verification layer

### 9.2 Time Crystal Physics & Computing

**[3] Thermodynamic Quantum Time Crystals**
- *Author:* Konstantin B. Efetov (Ruhr University Bochum)
- *Published:* arXiv:1902.07520v4 (2019)
- *Location:* `research-papers/thermodynamic-time-crystals.pdf`
- *Key Contributions:*
  - Proves thermodynamically stable macroscopic time crystals CAN exist
  - Order parameter periodic in both real and imaginary time
  - Correlation functions oscillate without decay
  - Connects to cuprate superconductor physics
- *Relevance to AIQTP:* Validates long-term stability of DTC-based consensus

**[4] Solid-State Continuous Time Crystal with a Built-in Clock**
- *Authors:* I. Carraro Haddad, D. L. Chafatinos, et al.
- *Published:* arXiv:2401.06246v1 (2024)
- *Location:* `research-papers/solid-state-time-crystal.pdf`
- *Key Contributions:*
  - First solid-state continuous time crystal (CTC) demonstration
  - Uses microcavity exciton-polaritons
  - Three controllable phases: Larmor precession, locked frequency, period doubling
  - Spontaneous formation from incoherent particle bath
- *Relevance to AIQTP:* Potential hardware platform for future QTC infrastructure

**[5] A Robust Large-Period Discrete Time Crystal and its Signature in a Digital Quantum Computer**
- *Authors:* Tianqi Chen, Ruizhe Shen, Ching Hua Lee, Bo Yang, Raditya Weda Bomantara
- *Published:* arXiv:2309.11560v5 (2025)
- *Location:* `research-papers/large-period-dtc.pdf`
- *Key Contributions:*
  - Period-quadrupling DTCs (4T-DTCs) on qubits
  - Implemented on NISQ-era digital quantum computers
  - Variational algorithm for DTC observation
  - Extends beyond standard period-doubling dynamics
- *Relevance to AIQTP:* Advanced DTC patterns for enhanced consensus mechanisms

**[6] Quantum Time Crystal Computing (QTCC)**
- *Authors:* Hikaru Wakaura, Andriyan B. Suksmono
- *Published:* CS&IT (2025)
- *Location:* `research-papers/time-crystal-computing.pdf`
- *Key Contributions:*
  - Proposes controlling Time Crystals via Hamiltonian modification
  - Demonstrates Grover's and QFT algorithms using Time Crystals
  - Adiabatic quantum computation with DTCs
  - Many-body localization for quantum state preservation
- *Relevance to AIQTP:* Framework for QAQI's quantum algorithm execution

### 9.3 Quantum Walk & Entanglement

**[7] Robustness and Classical Proxy of Entanglement in Variants of Quantum Walk**
- *Authors:* Christopher Mastandrea, Chih-Chun Chien (UC Merced)
- *Published:* arXiv:2408.05597v2 (2024)
- *Location:* `research-papers/quantum-walk-entanglement.pdf`
- *Key Contributions:*
  - Single-particle entanglement (SPE) in quantum walks
  - Entanglement robust against classical randomness
  - "Overlap" metric as classical proxy for entanglement
  - Localization transitions in quantum walks
- *Relevance to AIQTP:* Quantum walk algorithms for portfolio optimization

**[8] Revivals in Quantum Walks with Quasi-Periodically Time-Dependent Coin**
- *Authors:* C. Cedzich, R. F. Werner (Leibniz Universität Hannover)
- *Published:* arXiv:1510.08905v2 (2016)
- *Location:* `research-papers/quantum-walk-revivals.pdf`
- *Key Contributions:*
  - Full revivals in time-dependent quantum walks
  - Quasi-periodic behavior analysis
  - Spectral analysis methods for quantum dynamics
  - Exponentially sharp revivals phenomenon
- *Relevance to AIQTP:* Timing precision for Proof of Temporal Resonance

### 9.4 Bitcoin & Cryptocurrency Economics

**[9] The Dual Nature of Bitcoin as Payment Network and Money**
- *Author:* Paolo Tasca
- *Published:* SSRN (2015)
- *Location:* `research-papers/bitcoin-dual-nature.pdf`
- *Key Contributions:*
  - Bitcoin as both payment system and currency
  - Comparison with VISA, Mastercard, Western Union
  - Transaction volume analysis and growth patterns
  - Blockchain technology fundamentals
- *Relevance to AIQTP:* Economic model for QTC token design

---

## REFERENCES

### Platform Documentation
1. IBM Quantum Platform Documentation: https://docs.quantum.ibm.com/
2. Qiskit SDK: https://qiskit.org/
3. NIST Post-Quantum Cryptography: https://csrc.nist.gov/projects/post-quantum-cryptography
4. D-Wave Quantum Annealing: https://docs.dwavesys.com/

### Key Papers (External)
5. "Realization of a discrete time crystal on 57 qubits" - Science Advances (2022)
6. Google Quantum AI Time Crystal: https://quantumai.google/research/time-crystals
7. Shor, P. "Algorithms for quantum computation" - FOCS (1994)
8. Grover, L. "A fast quantum mechanical algorithm for database search" - STOC (1996)

### Project Research Library (Local)
See Section 9 for full paper index: `AIQTP-Project/research-papers/`

---

*This document is a living resource. Update as quantum hardware capabilities evolve.*
*Last Updated: 2026-01-09*
