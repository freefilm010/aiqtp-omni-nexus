/**
 * Self-Writing Economy Engine
 * Rules, strategies, and governance evolve at runtime.
 */

// ── Rule Engine ─────────────────────────────────────────────

export interface EconomicRules {
  inflationSensitivity: number;
  volatilityFeedback: number;
  liquidityCreationRate: number;
  panicAmplification: number;
  meanReversionStrength: number;
}

export class RuleEngine {
  rules: EconomicRules;
  ruleHistory: EconomicRules[] = [];

  constructor(initial: EconomicRules) {
    this.rules = { ...initial };
    this.ruleHistory.push({ ...initial });
  }

  /** Mutate rules based on system stress and performance. */
  mutate(systemStress: number, performance: number): EconomicRules {
    const drift = (Math.random() - 0.5) * systemStress * 0.1;

    this.rules.inflationSensitivity = bound(this.rules.inflationSensitivity + drift, 0.001, 2);
    this.rules.volatilityFeedback = bound(this.rules.volatilityFeedback + performance * 0.01, 0.001, 3);
    this.rules.liquidityCreationRate = bound(this.rules.liquidityCreationRate - systemStress * 0.005, 0.001, 1);
    this.rules.panicAmplification = bound(this.rules.panicAmplification + systemStress * 0.02, 0.001, 5);
    this.rules.meanReversionStrength = bound(
      this.rules.meanReversionStrength + (Math.random() - 0.5) * 0.01, 0.001, 2
    );

    this.ruleHistory.push({ ...this.rules });
    if (this.ruleHistory.length > 200) this.ruleHistory.shift();

    return { ...this.rules };
  }

  /** Restore rules from a snapshot. */
  restore(snapshot: EconomicRules): void {
    this.rules = { ...snapshot };
  }

  get drift(): number {
    const h = this.ruleHistory;
    if (h.length < 2) return 0;
    const first = h[0];
    const last = h[h.length - 1];
    return Object.keys(first).reduce((sum, k) => {
      const key = k as keyof EconomicRules;
      return sum + Math.abs(last[key] - first[key]);
    }, 0);
  }
}

// ── Live Strategy Compiler ──────────────────────────────────

export interface CompiledStrategy {
  aggressiveness: number;
  riskBudget: number;
  momentumWeight: number;
  contrarian: boolean;
}

export function compileStrategy(
  belief: number,
  volatility: number,
  pastPnL: number
): CompiledStrategy {
  return {
    aggressiveness: Math.tanh(belief + pastPnL * 0.5),
    riskBudget: bound(volatility * (1 - Math.abs(pastPnL)), 0.01, 1),
    momentumWeight: belief * volatility,
    contrarian: pastPnL < -0.1 && Math.random() > 0.6,
  };
}

// ── Runtime Governance ──────────────────────────────────────

export interface GovernanceState {
  maxLeverage: number;
  agentPopulation: number;
  volatilityCap: number;
  mutationRate: number;
}

export class Governance {
  state: GovernanceState;

  constructor(initial?: Partial<GovernanceState>) {
    this.state = {
      maxLeverage: 3,
      agentPopulation: 1000,
      volatilityCap: 2,
      mutationRate: 0.3,
      ...initial,
    };
  }

  evolve(crisisLevel: number, stability: number): GovernanceState {
    if (crisisLevel > 0.7) {
      this.state.maxLeverage = bound(this.state.maxLeverage * 0.9, 1, 10);
      this.state.volatilityCap = bound(this.state.volatilityCap * 0.8, 0.5, 5);
      this.state.mutationRate = bound(this.state.mutationRate * 0.8, 0.05, 1);
    }

    if (stability > 0.8) {
      this.state.agentPopulation = Math.min(5000, this.state.agentPopulation + 50);
      this.state.maxLeverage = bound(this.state.maxLeverage * 1.05, 1, 10);
      this.state.mutationRate = bound(this.state.mutationRate * 1.05, 0.05, 1);
    }

    return { ...this.state };
  }
}

// ── Safety: Invariants ──────────────────────────────────────

export interface Invariants {
  maxLeverageCap: number;
  minLiquidity: number;
  maxVolatility: number;
  minPrice: number;
}

export function enforceInvariants(
  state: Record<string, number>,
  invariants: Invariants
): Record<string, number> {
  const patched = { ...state };
  if ("leverage" in patched) patched.leverage = Math.min(patched.leverage, invariants.maxLeverageCap);
  if ("liquidity" in patched) patched.liquidity = Math.max(patched.liquidity, invariants.minLiquidity);
  if ("volatility" in patched) patched.volatility = Math.min(patched.volatility, invariants.maxVolatility);
  if ("price" in patched) patched.price = Math.max(patched.price, invariants.minPrice);
  return patched;
}

// ── Safety: Drift Detector ──────────────────────────────────

export class DriftDetector {
  private history: number[] = [];

  push(metric: number): void {
    this.history.push(metric);
    if (this.history.length > 100) this.history.shift();
  }

  instabilityScore(): number {
    if (this.history.length < 3) return 0;
    const mean = this.history.reduce((a, b) => a + b, 0) / this.history.length;
    const variance = this.history.reduce((a, b) => a + (b - mean) ** 2, 0) / this.history.length;
    return Math.sqrt(variance) * Math.abs(mean);
  }

  isUnstable(threshold = 10): boolean {
    return this.instabilityScore() > threshold;
  }
}

// ── Safety: Circuit Breaker ─────────────────────────────────

export class SafetyCircuitBreaker {
  private lastSafeState: unknown = null;
  private frozen = false;
  private tripCount = 0;

  snapshot(state: unknown): void {
    this.lastSafeState = structuredClone(state);
  }

  evaluate(riskScore: number, threshold = 10): void {
    if (riskScore > threshold) {
      this.frozen = true;
      this.tripCount++;
    }
  }

  recover<T>(): T | null {
    if (this.frozen && this.lastSafeState != null) {
      this.frozen = false;
      return structuredClone(this.lastSafeState) as T;
    }
    return null;
  }

  isFrozen(): boolean {
    return this.frozen;
  }

  get trips(): number {
    return this.tripCount;
  }
}

function bound(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
