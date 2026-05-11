/**
 * quantumApi.ts — Client for the AIQTP Quantum AI Agent on Render.
 * v2.0 — Heron-aware backends, ZNE, fraud detection, risk profiling, bond optimization.
 */

const BASE = ((import.meta.env.VITE_QUANTUM_AGENT_URL as string | undefined) ?? "https://aiqtp-quantum-agent.onrender.com").replace(/\/$/, "");

async function _post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Quantum Agent ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

async function _get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Quantum Agent ${path}: ${res.status}`);
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuantumBackend {
  name: string;
  family: string;
  qubits: number;
  type: "real" | "simulator";
  layer_fidelity: number;
  eplg: number;
  t1_us: number | null;
  t2_us: number | null;
  clops: number;
  two_qubit_error: number;
  recommended: boolean;
  available: boolean;
}

export interface QuantumRunResult {
  counts: Record<string, number>;
  backend: string;
  shots: number;
  simulated: boolean;
  zne_applied?: boolean;
  elapsed_ms?: number;
  job_id?: string;
}

export interface OptimizeResult {
  assets: string[];
  weights: number[];
  expected_return: number;
  sharpe_ratio: number;
  quantum_depth: number;
  simulated: boolean;
  backend?: string;
  elapsed_ms?: number;
}

export interface FraudDetectResult {
  fraud_probability: number;
  is_fraud: boolean;
  threshold: number;
  confidence: number;
  feature_importances: number[];
  n_features_used: number;
  shots: number;
  simulated: boolean;
  method: string;
  elapsed_ms?: number;
}

export interface RiskProfileResult {
  var_pct: number;
  var_usd: number;
  cvar_pct: number;
  cvar_usd: number;
  portfolio_volatility: number;
  confidence_level: number;
  horizon_days: number;
  positions_analyzed: number;
  quantum_speedup: {
    classical_samples: number;
    quantum_samples: number;
    speedup_factor: number;
  };
  method: string;
  simulated: boolean;
  elapsed_ms?: number;
}

export interface BondOptimizeResult {
  bonds: Array<{ name: string; weight: number; yield: number; duration: number; rating: string }>;
  portfolio_yield: number;
  portfolio_duration: number;
  target_duration: number;
  duration_gap: number;
  yield_floor_met: boolean;
  quantum_depth: number;
  simulated: boolean;
  method: string;
  elapsed_ms?: number;
}

// ── Backend discovery ─────────────────────────────────────────────────────────

export async function getBackends(): Promise<{
  backends: QuantumBackend[];
  best_backend: string;
  ibm_configured: boolean;
}> {
  return _get("/quantum/backends");
}

// ── Core circuit execution ────────────────────────────────────────────────────

export async function runCircuit(params: {
  circuit: string;
  backend?: string;
  shots?: number;
  qubits?: number;
  job_name?: string;
  use_zne?: boolean;
}): Promise<QuantumRunResult> {
  return _post("/quantum/run", {
    circuit:   params.circuit,
    backend:   params.backend  ?? "auto",
    shots:     params.shots    ?? 1024,
    qubits:    params.qubits   ?? 4,
    job_name:  params.job_name ?? "aiqtp_job",
    use_zne:   params.use_zne  ?? false,
  });
}

// ── Portfolio optimization ────────────────────────────────────────────────────

export async function optimizePortfolio(params: {
  assets: string[];
  returns: number[];
  risk_tolerance?: number;
  p?: number;
  use_zne?: boolean;
}): Promise<OptimizeResult> {
  return _post("/quantum/optimize", {
    assets:         params.assets,
    returns:        params.returns,
    risk_tolerance: params.risk_tolerance ?? 0.5,
    p:              params.p ?? 2,
    use_zne:        params.use_zne ?? false,
  });
}

// ── Entropy measurement ───────────────────────────────────────────────────────

export async function measureEntropy(params: { n_qubits?: number; shots?: number }) {
  return _post("/quantum/entropy", {
    n_qubits: params.n_qubits ?? 4,
    shots:    params.shots    ?? 512,
  });
}

// ── Quantum fraud detection ───────────────────────────────────────────────────

export async function detectFraud(params: {
  features: number[];
  threshold?: number;
  shots?: number;
}): Promise<FraudDetectResult> {
  return _post("/quantum/fraud-detect", {
    features:  params.features,
    threshold: params.threshold ?? 0.5,
    shots:     params.shots     ?? 1024,
  });
}

// ── Quantum risk profiling ────────────────────────────────────────────────────

export async function profileRisk(params: {
  positions: Array<{ symbol: string; weight: number; volatility: number }>;
  confidence?: number;
  horizon_days?: number;
  portfolio_value?: number;
}): Promise<RiskProfileResult> {
  return _post("/quantum/risk-profile", {
    positions:       params.positions,
    confidence:      params.confidence      ?? 0.95,
    horizon_days:    params.horizon_days    ?? 1,
    portfolio_value: params.portfolio_value ?? 100000,
  });
}

// ── Quantum bond optimization ─────────────────────────────────────────────────

export async function optimizeBonds(params: {
  bonds: Array<{ name: string; yield: number; duration: number; rating: string }>;
  target_duration?: number;
  min_yield?: number;
  p?: number;
}): Promise<BondOptimizeResult> {
  return _post("/quantum/bond-optimize", {
    bonds:            params.bonds,
    target_duration:  params.target_duration ?? 5.0,
    min_yield:        params.min_yield       ?? 0.02,
    p:                params.p               ?? 2,
  });
}

// ── Local JS fallback simulation ──────────────────────────────────────────────

export function localSimulate(qubits: number, shots: number): QuantumRunResult {
  const n = 2 ** qubits;
  const counts: Record<string, number> = {};
  let remaining = shots;
  for (let i = 0; i < n - 1; i++) {
    const c = Math.floor(Math.random() * (remaining / (n - i) * 2));
    const key = i.toString(2).padStart(qubits, "0");
    counts[key] = c;
    remaining -= c;
  }
  counts[(n - 1).toString(2).padStart(qubits, "0")] = Math.max(0, remaining);
  return { counts, backend: "local_js_simulator", shots, simulated: true };
}
