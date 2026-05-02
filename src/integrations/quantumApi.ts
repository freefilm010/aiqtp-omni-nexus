/**
 * quantumApi.ts — Client for the AIQTP Quantum AI Agent on Render.
 *
 * Set VITE_QUANTUM_AGENT_URL to your quantum agent Render URL.
 * Falls back to Supabase quantum-compute edge function, then to local simulation.
 */

const BASE = (import.meta.env.VITE_QUANTUM_AGENT_URL as string | undefined)?.replace(/\/$/, "");

async function _post(path: string, body: unknown) {
  if (!BASE) throw new Error("VITE_QUANTUM_AGENT_URL not configured");
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

export interface QuantumRunResult {
  counts: Record<string, number>;
  backend: string;
  shots: number;
  simulated: boolean;
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
}

export async function runCircuit(params: {
  circuit: string;
  backend?: string;
  shots?: number;
  qubits?: number;
  job_name?: string;
}): Promise<QuantumRunResult> {
  return _post("/quantum/run", {
    circuit: params.circuit,
    backend: params.backend ?? "local_simulator",
    shots:   params.shots   ?? 1024,
    qubits:  params.qubits  ?? 4,
    job_name: params.job_name ?? "aiqtp_job",
  });
}

export async function optimizePortfolio(params: {
  assets: string[];
  returns: number[];
  risk_tolerance?: number;
  p?: number;
}): Promise<OptimizeResult> {
  return _post("/quantum/optimize", {
    assets:         params.assets,
    returns:        params.returns,
    risk_tolerance: params.risk_tolerance ?? 0.5,
    p:              params.p ?? 1,
  });
}

export async function measureEntropy(params: { n_qubits?: number; shots?: number }) {
  return _post("/quantum/entropy", {
    n_qubits: params.n_qubits ?? 4,
    shots:    params.shots    ?? 512,
  });
}

/** Local fallback simulation used when no backend is reachable. */
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
