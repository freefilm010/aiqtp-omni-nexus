/**
 * Universe Generator AI
 * Dynamically creates, mutates, and evaluates new economic law sets.
 */

export interface EconomicLaws {
  id: string;
  inflationSensitivity: number;
  volatilityAmplifier: number;
  liquidityDecay: number;
  beliefFeedbackStrength: number;
  growthCeiling: number;
  crisisThreshold: number;
}

export interface UniverseFitness {
  lawsId: string;
  stability: number;      // lower crisis frequency
  growth: number;          // equity index growth
  resilience: number;      // recovery speed after shocks
  composite: number;
}

let universeSeq = 0;

export function generateRandomLaws(): EconomicLaws {
  return {
    id: `universe_${universeSeq++}`,
    inflationSensitivity: Math.random(),
    volatilityAmplifier: Math.random() * 2,
    liquidityDecay: Math.random() * 0.1,
    beliefFeedbackStrength: Math.random(),
    growthCeiling: 0.5 + Math.random() * 1.5,
    crisisThreshold: 0.3 + Math.random() * 0.7,
  };
}

export function mutateLaws(laws: EconomicLaws): EconomicLaws {
  const jitter = () => 1 + (Math.random() - 0.5) * 0.2;
  return {
    id: `universe_${universeSeq++}`,
    inflationSensitivity: Math.max(0, laws.inflationSensitivity * jitter()),
    volatilityAmplifier: Math.max(0, laws.volatilityAmplifier * jitter()),
    liquidityDecay: Math.max(0, laws.liquidityDecay * jitter()),
    beliefFeedbackStrength: Math.max(0, laws.beliefFeedbackStrength * jitter()),
    growthCeiling: Math.max(0.1, laws.growthCeiling * jitter()),
    crisisThreshold: clamp(laws.crisisThreshold * jitter(), 0.1, 1),
  };
}

export function crossoverLaws(a: EconomicLaws, b: EconomicLaws): EconomicLaws {
  const pick = () => Math.random() > 0.5;
  return {
    id: `universe_${universeSeq++}`,
    inflationSensitivity: pick() ? a.inflationSensitivity : b.inflationSensitivity,
    volatilityAmplifier: (a.volatilityAmplifier + b.volatilityAmplifier) / 2,
    liquidityDecay: pick() ? a.liquidityDecay : b.liquidityDecay,
    beliefFeedbackStrength: (a.beliefFeedbackStrength + b.beliefFeedbackStrength) / 2,
    growthCeiling: pick() ? a.growthCeiling : b.growthCeiling,
    crisisThreshold: (a.crisisThreshold + b.crisisThreshold) / 2,
  };
}

/** Evaluate universe fitness from a simulation run. */
export function evaluateFitness(
  lawsId: string,
  equityHistory: number[],
  crisisEvents: number
): UniverseFitness {
  const len = equityHistory.length;
  const growth = len > 1 ? (equityHistory[len - 1] - equityHistory[0]) / equityHistory[0] : 0;
  const stability = 1 / (1 + crisisEvents);

  // Resilience: how quickly equity recovers after dips
  let recoverySum = 0;
  let dips = 0;
  for (let i = 1; i < len; i++) {
    if (equityHistory[i] < equityHistory[i - 1] * 0.95) {
      dips++;
      // Look for recovery within next 10 ticks
      for (let j = i + 1; j < Math.min(i + 10, len); j++) {
        if (equityHistory[j] >= equityHistory[i - 1]) {
          recoverySum += 1 / (j - i);
          break;
        }
      }
    }
  }
  const resilience = dips > 0 ? recoverySum / dips : 1;

  return {
    lawsId,
    stability,
    growth: Math.max(0, growth),
    resilience,
    composite: stability * 0.3 + growth * 0.4 + resilience * 0.3,
  };
}

/** Evolve a population of universe laws toward optimal economic physics. */
export class UniverseEvolver {
  population: EconomicLaws[];

  constructor(size = 20) {
    this.population = Array.from({ length: size }, () => generateRandomLaws());
  }

  evolve(fitnessScores: Map<string, number>): EconomicLaws[] {
    const sorted = [...this.population].sort(
      (a, b) => (fitnessScores.get(b.id) ?? 0) - (fitnessScores.get(a.id) ?? 0)
    );

    const eliteCount = Math.max(2, Math.floor(sorted.length * 0.2));
    const elite = sorted.slice(0, eliteCount);
    const next: EconomicLaws[] = [...elite];

    while (next.length < this.population.length) {
      const parentA = elite[Math.floor(Math.random() * elite.length)];
      const parentB = elite[Math.floor(Math.random() * elite.length)];
      let child = crossoverLaws(parentA, parentB);
      if (Math.random() < 0.4) child = mutateLaws(child);
      next.push(child);
    }

    this.population = next;
    return this.population;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
