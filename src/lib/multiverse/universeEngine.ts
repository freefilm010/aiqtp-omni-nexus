/**
 * Multi-Universe Economic Simulation
 * Parallel economic realities with different financial physics.
 */

export interface UniverseLaws {
  name: string;
  inflationVolatility: number;
  riskAversion: number;
  liquidityCycleSpeed: number;
  shockRate: number;
  growthPotential: number;
}

export interface UniverseState {
  inflation: number;
  liquidity: number;
  equityIndex: number;
  bondIndex: number;
  cryptoIndex: number;
  crisisLevel: number;
  tick: number;
}

export class EconomicUniverse {
  state: UniverseState;

  constructor(public laws: UniverseLaws) {
    this.state = {
      inflation: 0.02,
      liquidity: 1.0,
      equityIndex: 100,
      bondIndex: 100,
      cryptoIndex: 100,
      crisisLevel: 0,
      tick: 0,
    };
  }

  step(): UniverseState {
    const s = this.state;
    const l = this.laws;
    const noise = () => (Math.random() - 0.5) * 2;

    // Exogenous shock
    const shock = Math.random() < l.shockRate ? noise() * 0.3 : 0;

    s.inflation += noise() * l.inflationVolatility;
    s.inflation = Math.max(-0.05, Math.min(0.2, s.inflation));

    s.liquidity += Math.sin(s.tick * l.liquidityCycleSpeed * 0.1) * 0.02 + noise() * 0.01;
    s.liquidity = Math.max(0.1, Math.min(2.0, s.liquidity));

    const growthForce = (s.liquidity - s.inflation * 10) * (1 - l.riskAversion) * l.growthPotential;

    s.equityIndex += growthForce + shock * 100;
    s.bondIndex += (0.05 - s.inflation) * 10 + noise();
    s.cryptoIndex += (s.liquidity - 1) * 20 + shock * 150 + noise() * 3;

    // Crisis emerges from internal dynamics
    s.crisisLevel = Math.max(0, Math.min(1,
      (s.inflation > 0.08 ? 0.3 : 0) +
      (s.liquidity < 0.4 ? 0.4 : 0) +
      (s.equityIndex < 50 ? 0.3 : 0)
    ));

    // Crisis feedback loop
    if (s.crisisLevel > 0.5) {
      s.equityIndex *= 0.98;
      s.cryptoIndex *= 0.96;
      s.liquidity *= 0.99;
    }

    s.tick++;
    return { ...s };
  }

  reset(): void {
    this.state = {
      inflation: 0.02, liquidity: 1.0, equityIndex: 100,
      bondIndex: 100, cryptoIndex: 100, crisisLevel: 0, tick: 0,
    };
  }
}

// ── Preset Universes ────────────────────────────────────────

export const PRESET_UNIVERSES: UniverseLaws[] = [
  { name: "Stable Capitalism", inflationVolatility: 0.005, riskAversion: 0.6, liquidityCycleSpeed: 0.05, shockRate: 0.02, growthPotential: 1.0 },
  { name: "Crypto Wild West", inflationVolatility: 0.1, riskAversion: 0.15, liquidityCycleSpeed: 0.3, shockRate: 0.15, growthPotential: 2.0 },
  { name: "Debt Spiral", inflationVolatility: 0.03, riskAversion: 0.85, liquidityCycleSpeed: 0.01, shockRate: 0.08, growthPotential: 0.3 },
  { name: "Post-Scarcity", inflationVolatility: 0.001, riskAversion: 0.3, liquidityCycleSpeed: 0.02, shockRate: 0.005, growthPotential: 1.5 },
  { name: "Stagflation Hell", inflationVolatility: 0.08, riskAversion: 0.7, liquidityCycleSpeed: 0.03, shockRate: 0.1, growthPotential: 0.2 },
];

// ── Meta-Investor ───────────────────────────────────────────

export interface UniverseAllocation {
  universeName: string;
  weight: number;
  score: number;
}

export class MetaInvestor {
  /** Evaluate and allocate capital across universes. */
  allocate(universes: EconomicUniverse[]): UniverseAllocation[] {
    const scored = universes.map((u) => {
      const s = u.state;
      const returnEstimate = (s.equityIndex + s.cryptoIndex) / 200;
      const risk = s.crisisLevel + Math.abs(s.inflation) + (1 - s.liquidity) * 0.5;
      const score = risk > 0.01 ? returnEstimate / risk : returnEstimate * 100;
      return { universeName: u.laws.name, score: Math.max(0.01, score) };
    });

    const total = scored.reduce((s, u) => s + u.score, 0);

    return scored.map((u) => ({
      ...u,
      weight: total > 0 ? u.score / total : 1 / scored.length,
    }));
  }
}

// ── Emergent Crisis Engine ──────────────────────────────────

export function induceCrisis(universe: EconomicUniverse): { triggered: boolean; severity: number } {
  const s = universe.state;
  const stress =
    (s.inflation > 0.06 ? s.inflation * 3 : 0) +
    (s.liquidity < 0.5 ? (1 - s.liquidity) * 2 : 0) +
    Math.random() * universe.laws.shockRate;

  if (stress > 1.0) {
    const severity = Math.min(1, stress - 1);
    s.equityIndex *= 1 - severity * 0.3;
    s.cryptoIndex *= 1 - severity * 0.5;
    s.crisisLevel = Math.min(1, s.crisisLevel + severity * 0.5);
    s.liquidity *= 1 - severity * 0.1;
    return { triggered: true, severity };
  }

  return { triggered: false, severity: 0 };
}
