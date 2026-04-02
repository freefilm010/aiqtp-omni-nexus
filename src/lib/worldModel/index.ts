/**
 * World Model — Unified Intelligence Layer
 * Connects encoder, transition model, regime detection,
 * foresight planning, and collusion detection into a
 * single coherent system that plugs into the EventBus.
 */

export { EconomyEncoder, type EconomyObservation, type LatentState } from "./economyEncoder";
export { TransitionModel, type AgentAction, type TransitionPrediction } from "./transitionModel";
export { RegimeLatentSpace, type RegimeCluster, type RegimeDetection } from "./regimeLatentSpace";
export { ForesightPlanner, type Plan, type PlannerConfig } from "./foresightPlanner";
export { CollusionDetector, type CollusionAlert } from "./collusionDetector";

import { EconomyEncoder, type EconomyObservation } from "./economyEncoder";
import { TransitionModel, type AgentAction } from "./transitionModel";
import { RegimeLatentSpace } from "./regimeLatentSpace";
import { ForesightPlanner } from "./foresightPlanner";
import { CollusionDetector } from "./collusionDetector";

export interface WorldModelMetrics {
  encoder: { latentDim: number };
  transition: { meanAbsError: number; samples: number };
  regime: { current: string; confidence: number; clusterCount: number; transitionProb: number };
  planner: { avgReward: number; avgConfidence: number; plansGenerated: number };
  collusion: { totalAlerts: number; criticalCount: number; trackedAgents: number };
}

export class WorldModel {
  readonly encoder: EconomyEncoder;
  readonly transition: TransitionModel;
  readonly regime: RegimeLatentSpace;
  readonly planner: ForesightPlanner;
  readonly collusion: CollusionDetector;

  constructor() {
    this.encoder = new EconomyEncoder();
    this.transition = new TransitionModel();
    this.regime = new RegimeLatentSpace();
    this.planner = new ForesightPlanner();
    this.collusion = new CollusionDetector();
  }

  /** Full perception → prediction → planning loop */
  step(observation: EconomyObservation, agentActions: AgentAction[]): {
    latentState: number[];
    regime: string;
    regimeConfidence: number;
    predictionError: number[];
  } {
    // 1. Encode
    const state = this.encoder.encode(observation);

    // 2. Regime detection
    this.regime.observe(state.z, state.tick);

    // 3. Predict next state
    const prediction = this.transition.predict(state, agentActions);

    // 4. Record agent actions for collusion detection
    for (const action of agentActions) {
      const reward = action.direction * (observation.priceReturns[0] ?? 0);
      this.collusion.recordAction(action.agentId, action.direction, reward);
    }

    // 5. Get regime info
    const regimeInfo = this.regime.detect();

    return {
      latentState: state.z,
      regime: regimeInfo.regimeLabel,
      regimeConfidence: regimeInfo.confidence,
      predictionError: prediction.nextState.map((v, i) => v - (state.z[i] ?? 0)),
    };
  }

  /** Generate an optimal action plan for an agent */
  generatePlan(observation: EconomyObservation, agentId: string) {
    const state = this.encoder.encode(observation);
    return this.planner.plan(state, this.transition, this.regime, agentId);
  }

  /** Get comprehensive metrics */
  getMetrics(): WorldModelMetrics {
    const regimeInfo = this.regime.detect();
    const plannerStats = this.planner.getStats();
    const collusionSummary = this.collusion.getSummary();
    const transitionAcc = this.transition.getAccuracy();

    return {
      encoder: { latentDim: this.encoder.latentDim },
      transition: transitionAcc,
      regime: {
        current: regimeInfo.regimeLabel,
        confidence: regimeInfo.confidence,
        clusterCount: regimeInfo.clusters.length,
        transitionProb: regimeInfo.transitionProbability,
      },
      planner: {
        avgReward: plannerStats.avgExpectedReward,
        avgConfidence: plannerStats.avgConfidence,
        plansGenerated: plannerStats.plansGenerated,
      },
      collusion: {
        totalAlerts: collusionSummary.totalAlerts,
        criticalCount: collusionSummary.criticalCount,
        trackedAgents: collusionSummary.trackedAgents,
      },
    };
  }
}

// Singleton
let worldModelInstance: WorldModel | null = null;
export function getWorldModel(): WorldModel {
  if (!worldModelInstance) worldModelInstance = new WorldModel();
  return worldModelInstance;
}
