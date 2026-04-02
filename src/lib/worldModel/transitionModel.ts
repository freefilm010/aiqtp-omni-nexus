/**
 * Transition Model: P(z_{t+1} | z_t, actions)
 * Predicts next latent economy state given current state + agent actions.
 * Used for multi-step foresight planning.
 */

import type { LatentState } from "./economyEncoder";

export interface AgentAction {
  agentId: string;
  /** Normalized action: -1 = max sell, 0 = hold, +1 = max buy */
  direction: number;
  /** Size as fraction of portfolio [0,1] */
  sizeFraction: number;
}

export interface TransitionPrediction {
  nextState: number[];
  confidence: number;
  predictionError?: number;
}

const LATENT_DIM = 16;
const ACTION_DIM = 4; // compressed action summary

export class TransitionModel {
  /** Transition weights: z_{t+1} = tanh(W_z * z_t + W_a * a_t + b) */
  private Wz: number[][];
  private Wa: number[][];
  private bias: number[];
  private predictionHistory: { predicted: number[]; actual: number[] }[] = [];

  constructor() {
    this.Wz = Array.from({ length: LATENT_DIM }, () =>
      Array.from({ length: LATENT_DIM }, (_, j) =>
        // Initialize near identity for z→z (smooth transitions)
        j === Array.from({ length: LATENT_DIM }).indexOf(undefined) ? 0.9 : (Math.random() - 0.5) * 0.05
      )
    );
    // Fix identity initialization
    for (let i = 0; i < LATENT_DIM; i++) {
      this.Wz[i][i] = 0.9 + (Math.random() - 0.5) * 0.05;
    }
    this.Wa = Array.from({ length: LATENT_DIM }, () =>
      Array.from({ length: ACTION_DIM }, () => (Math.random() - 0.5) * 0.1)
    );
    this.bias = Array.from({ length: LATENT_DIM }, () => 0);
  }

  /** Compress multiple agent actions into fixed-size summary */
  private compressActions(actions: AgentAction[]): number[] {
    if (actions.length === 0) return [0, 0, 0, 0];
    const n = actions.length;
    const avgDir = actions.reduce((s, a) => s + a.direction, 0) / n;
    const avgSize = actions.reduce((s, a) => s + a.sizeFraction, 0) / n;
    const consensus = Math.abs(avgDir); // 1 = all agree, 0 = split
    const intensity = avgSize * n; // total market impact
    return [avgDir, avgSize, consensus, Math.tanh(intensity / 10)];
  }

  /** Predict next latent state */
  predict(currentState: LatentState, actions: AgentAction[]): TransitionPrediction {
    const z = currentState.z;
    const a = this.compressActions(actions);

    const nextZ = Array.from({ length: LATENT_DIM }, (_, i) => {
      let sum = this.bias[i];
      for (let j = 0; j < LATENT_DIM; j++) {
        sum += this.Wz[i][j] * (z[j] ?? 0);
      }
      for (let j = 0; j < ACTION_DIM; j++) {
        sum += this.Wa[i][j] * (a[j] ?? 0);
      }
      return Math.tanh(sum);
    });

    // Confidence based on prediction history accuracy
    const recentErrors = this.predictionHistory.slice(-20);
    const avgError = recentErrors.length > 0
      ? recentErrors.reduce((s, r) => {
          const e = r.predicted.reduce((se, p, i) => se + Math.abs(p - (r.actual[i] ?? 0)), 0) / LATENT_DIM;
          return s + e;
        }, 0) / recentErrors.length
      : 0.5;

    return {
      nextState: nextZ,
      confidence: Math.max(0, 1 - avgError),
    };
  }

  /** Multi-step rollout: simulate N steps into the future */
  rollout(
    initialState: LatentState,
    actionSequence: AgentAction[][],
    steps: number
  ): { trajectory: number[][]; confidences: number[] } {
    const trajectory: number[][] = [initialState.z];
    const confidences: number[] = [];
    let current: LatentState = { ...initialState };

    for (let t = 0; t < Math.min(steps, actionSequence.length); t++) {
      const pred = this.predict(current, actionSequence[t]);
      trajectory.push(pred.nextState);
      confidences.push(pred.confidence);
      current = { z: pred.nextState, tick: current.tick + 1, timestamp: Date.now() };
    }

    return { trajectory, confidences };
  }

  /** Update model with actual observed next state (online learning) */
  update(predicted: number[], actual: number[], learningRate = 0.002): number[] {
    const errors = predicted.map((p, i) => p - (actual[i] ?? 0));

    this.predictionHistory.push({ predicted, actual });
    if (this.predictionHistory.length > 200) {
      this.predictionHistory = this.predictionHistory.slice(-100);
    }

    // Gradient update on bias (simplified — full backprop not needed for online)
    for (let i = 0; i < LATENT_DIM; i++) {
      this.bias[i] -= learningRate * errors[i];
    }

    return errors;
  }

  /** Get model accuracy metrics */
  getAccuracy(): { meanAbsError: number; samples: number } {
    const recent = this.predictionHistory.slice(-50);
    if (recent.length === 0) return { meanAbsError: 1, samples: 0 };
    const totalError = recent.reduce((s, r) => {
      return s + r.predicted.reduce((se, p, i) => se + Math.abs(p - (r.actual[i] ?? 0)), 0) / LATENT_DIM;
    }, 0);
    return { meanAbsError: totalError / recent.length, samples: recent.length };
  }
}
