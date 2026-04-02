/**
 * Foresight Planner
 * Uses the world model to simulate multiple future trajectories,
 * evaluate candidate action sequences, and select the best plan.
 * This is the "imagination" layer — agents think before acting.
 */

import type { LatentState } from "./economyEncoder";
import type { TransitionModel, AgentAction } from "./transitionModel";
import type { RegimeLatentSpace } from "./regimeLatentSpace";

export interface Plan {
  actions: AgentAction[];
  expectedReward: number;
  riskScore: number;
  regimeAwareness: string;
  confidence: number;
  trajectoryLength: number;
}

export interface PlannerConfig {
  /** Number of random action sequences to sample */
  numCandidates: number;
  /** Planning horizon (steps into future) */
  horizon: number;
  /** Risk aversion coefficient [0, 1] */
  riskAversion: number;
  /** Discount factor for future rewards */
  gamma: number;
}

const DEFAULT_CONFIG: PlannerConfig = {
  numCandidates: 32,
  horizon: 8,
  riskAversion: 0.3,
  gamma: 0.95,
};

export class ForesightPlanner {
  private config: PlannerConfig;
  private planHistory: Plan[] = [];

  constructor(config?: Partial<PlannerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate the best action plan by simulating futures.
   * Cross-Entropy Method (CEM) style: sample → evaluate → select elite → refine.
   */
  plan(
    currentState: LatentState,
    transitionModel: TransitionModel,
    regimeDetector: RegimeLatentSpace,
    agentId: string
  ): Plan {
    const { numCandidates, horizon, riskAversion, gamma } = this.config;

    // Phase 1: Generate random candidate action sequences
    const candidates: AgentAction[][] = Array.from({ length: numCandidates }, () =>
      Array.from({ length: horizon }, () => this.randomAction(agentId))
    );

    // Phase 2: Evaluate each candidate via world model rollout
    const evaluations = candidates.map(actionSeq => {
      const { trajectory, confidences } = transitionModel.rollout(
        currentState,
        actionSeq.map(a => [a]), // wrap each action
        horizon
      );

      // Compute expected reward from trajectory
      let totalReward = 0;
      let totalRisk = 0;

      for (let t = 0; t < trajectory.length - 1; t++) {
        const z = trajectory[t + 1];
        const discount = Math.pow(gamma, t);

        // Extract reward signals from latent state
        // dim 0 ≈ return, dim 1 ≈ agent pnl, dim 7 ≈ risk
        const returnSignal = z[0] ?? 0;
        const pnlSignal = z[1] ?? 0;
        const riskSignal = Math.abs(z[7] ?? 0);
        const faucetSignal = z[2] ?? 0;

        const stepReward = (returnSignal * 0.4 + pnlSignal * 0.3 + faucetSignal * 0.3) * discount;
        const stepRisk = riskSignal * discount;

        totalReward += stepReward;
        totalRisk += stepRisk;
      }

      // Risk-adjusted score
      const score = totalReward - riskAversion * totalRisk;
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0.5;

      return { actionSeq, score, totalReward, totalRisk, avgConfidence, trajectory };
    });

    // Phase 3: Select best plan
    evaluations.sort((a, b) => b.score - a.score);
    const best = evaluations[0];

    // Feed terminal state to regime detector for awareness
    const terminalZ = best.trajectory[best.trajectory.length - 1];
    if (terminalZ) {
      regimeDetector.observe(terminalZ, currentState.tick + horizon);
    }
    const regime = regimeDetector.detect();

    const plan: Plan = {
      actions: best.actionSeq,
      expectedReward: best.totalReward,
      riskScore: best.totalRisk,
      regimeAwareness: regime.regimeLabel,
      confidence: best.avgConfidence,
      trajectoryLength: best.trajectory.length,
    };

    this.planHistory.push(plan);
    if (this.planHistory.length > 100) {
      this.planHistory = this.planHistory.slice(-50);
    }

    return plan;
  }

  /** Generate random action for sampling */
  private randomAction(agentId: string): AgentAction {
    return {
      agentId,
      direction: (Math.random() - 0.5) * 2, // [-1, 1]
      sizeFraction: Math.random() * 0.3, // [0, 0.3] conservative sizing
    };
  }

  /** Get planning performance stats */
  getStats(): {
    avgExpectedReward: number;
    avgConfidence: number;
    avgRisk: number;
    plansGenerated: number;
  } {
    const recent = this.planHistory.slice(-20);
    if (recent.length === 0) return { avgExpectedReward: 0, avgConfidence: 0, avgRisk: 0, plansGenerated: 0 };
    return {
      avgExpectedReward: recent.reduce((s, p) => s + p.expectedReward, 0) / recent.length,
      avgConfidence: recent.reduce((s, p) => s + p.confidence, 0) / recent.length,
      avgRisk: recent.reduce((s, p) => s + p.riskScore, 0) / recent.length,
      plansGenerated: this.planHistory.length,
    };
  }

  updateConfig(updates: Partial<PlannerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
