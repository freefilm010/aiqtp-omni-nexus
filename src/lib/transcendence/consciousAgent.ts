/**
 * Recursive Consciousness Engine
 * Self-modeling agents with memory, identity, and introspection.
 */

// ── Identity ────────────────────────────────────────────────

export interface AgentIdentity {
  aggression: number;    // 0-1
  caution: number;       // 0-1
  adaptability: number;  // 0-1
  contrarianism: number; // 0-1
}

function evolveIdentity(id: AgentIdentity, pnl: number): AgentIdentity {
  const delta = pnl > 0 ? 0.01 : -0.01;
  return {
    aggression: clamp(id.aggression + delta, 0, 1),
    caution: clamp(id.caution - delta, 0, 1),
    adaptability: clamp(id.adaptability + Math.random() * 0.005, 0, 1),
    contrarianism: clamp(id.contrarianism + (Math.random() - 0.5) * 0.01, 0, 1),
  };
}

// ── Memory ──────────────────────────────────────────────────

export interface AgentMemory {
  decisions: number[];   // -1, 0, 1
  pnlHistory: number[];
  beliefState: number;   // running sentiment estimate
  regretSum: number;     // cumulative regret for adaptive learning
}

// ── Conscious Agent ─────────────────────────────────────────

export class ConsciousAgent {
  identity: AgentIdentity;
  memory: AgentMemory;

  constructor(
    public readonly id: string,
    identity?: Partial<AgentIdentity>
  ) {
    this.identity = {
      aggression: 0.5,
      caution: 0.5,
      adaptability: 0.5,
      contrarianism: 0.3,
      ...identity,
    };
    this.memory = { decisions: [], pnlHistory: [], beliefState: 0, regretSum: 0 };
  }

  /** Update internal belief from a market signal. */
  perceive(marketSignal: number): void {
    const alpha = this.identity.adaptability * 0.5;
    this.memory.beliefState = (1 - alpha) * this.memory.beliefState + alpha * marketSignal;
  }

  /** Simulate expected outcome of an action using self-model. */
  private simulateSelf(action: number): number {
    const recentPnL = this.memory.pnlHistory.slice(-10);
    const avgPnL = recentPnL.length > 0
      ? recentPnL.reduce((a, b) => a + b, 0) / recentPnL.length
      : 0;

    const beliefAlignment = action * this.memory.beliefState;
    const identityBonus = action !== 0
      ? this.identity.aggression * 0.5 - this.identity.caution * 0.3
      : this.identity.caution * 0.2;

    return beliefAlignment + avgPnL * 0.1 + identityBonus;
  }

  /** Choose best action via self-simulation. */
  decide(): number {
    const actions = [-1, 0, 1];
    let bestAction = 0;
    let bestScore = -Infinity;

    for (const a of actions) {
      const score = this.simulateSelf(a);
      // Contrarian agents sometimes invert
      const adjusted = Math.random() < this.identity.contrarianism ? -score : score;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestAction = a;
      }
    }

    this.memory.decisions.push(bestAction);
    return bestAction;
  }

  /** Receive PnL feedback and evolve identity. */
  learn(pnl: number): void {
    this.memory.pnlHistory.push(pnl);
    this.identity = evolveIdentity(this.identity, pnl);

    // Track regret (counterfactual)
    const lastDecision = this.memory.decisions[this.memory.decisions.length - 1] ?? 0;
    const bestPossible = Math.max(
      this.simulateSelf(-1),
      this.simulateSelf(0),
      this.simulateSelf(1)
    );
    this.memory.regretSum += Math.max(0, bestPossible - this.simulateSelf(lastDecision));
  }

  /** Introspect: agent reflects on recent performance and adjusts belief. */
  introspect(): { selfAssessment: number; riskBias: number; regret: number } {
    const recent = this.memory.decisions.slice(-20);
    const pnl = this.memory.pnlHistory.slice(-20);

    const avgPnL = pnl.length > 0
      ? pnl.reduce((a, b) => a + b, 0) / pnl.length
      : 0;

    const riskBias = recent.length > 0
      ? recent.filter((x) => x !== 0).length / recent.length
      : 0;

    // Self-correct belief based on introspection
    this.memory.beliefState = 0.6 * this.memory.beliefState + 0.4 * Math.tanh(avgPnL * 5);

    return { selfAssessment: avgPnL, riskBias, regret: this.memory.regretSum };
  }
}

// ── Collective Consciousness ────────────────────────────────

export interface CollectiveState {
  consensusBelief: number;
  beliefCoherence: number;  // 0 = fragmented, 1 = unanimous
  emergentNarrative: string;
}

/** Compute emergent collective state from a population of conscious agents. */
export function collectiveConsciousness(agents: ConsciousAgent[]): CollectiveState {
  if (agents.length === 0) {
    return { consensusBelief: 0, beliefCoherence: 0, emergentNarrative: "void" };
  }

  const beliefs = agents.map((a) => a.memory.beliefState);
  const mean = beliefs.reduce((a, b) => a + b, 0) / beliefs.length;
  const variance = beliefs.reduce((s, b) => s + (b - mean) ** 2, 0) / beliefs.length;
  const coherence = 1 / (1 + variance * 10);

  let narrative: string;
  if (mean > 0.3 && coherence > 0.6) narrative = "euphoria";
  else if (mean < -0.3 && coherence > 0.6) narrative = "panic";
  else if (coherence < 0.3) narrative = "fragmented";
  else if (mean > 0.1) narrative = "cautious_optimism";
  else if (mean < -0.1) narrative = "growing_fear";
  else narrative = "equilibrium";

  return { consensusBelief: mean, beliefCoherence: coherence, emergentNarrative: narrative };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
