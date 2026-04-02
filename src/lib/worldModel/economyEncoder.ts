/**
 * Economy State Encoder
 * Compresses raw economy observables into a latent state vector z_t.
 * Inputs: market ticks, agent positions, faucet flows, risk metrics.
 * Output: fixed-size latent vector for transition model + regime detection.
 */

export interface EconomyObservation {
  /** Normalized price returns for tracked assets */
  priceReturns: number[];
  /** Aggregated agent PnL signals */
  agentPnls: number[];
  /** Faucet income rate (claims/min) */
  faucetIncomeRate: number;
  /** Total faucet liquidity injected this epoch */
  faucetLiquidityInjected: number;
  /** Current volatility estimate (rolling std) */
  volatility: number;
  /** Spread between bid/ask (market quality) */
  spreadBps: number;
  /** Order flow imbalance [-1, 1] */
  orderFlowImbalance: number;
  /** Systemic risk score [0, 1] */
  riskScore: number;
  /** Number of active agents */
  activeAgents: number;
  /** Epoch tick counter */
  tick: number;
}

export interface LatentState {
  z: number[];
  tick: number;
  timestamp: number;
}

const LATENT_DIM = 16;

/**
 * Simple learned encoder: projects observables into latent space
 * via a single-layer linear transform + tanh activation.
 * Weights are initialized randomly and updated via gradient signal.
 */
export class EconomyEncoder {
  private weights: number[][];
  private biases: number[];
  private inputDim: number;

  constructor() {
    this.inputDim = 10; // matches EconomyObservation field count
    this.weights = Array.from({ length: LATENT_DIM }, () =>
      Array.from({ length: this.inputDim }, () => (Math.random() - 0.5) * 0.1)
    );
    this.biases = Array.from({ length: LATENT_DIM }, () => (Math.random() - 0.5) * 0.01);
  }

  /** Flatten observation into raw feature vector */
  private toFeatureVector(obs: EconomyObservation): number[] {
    const avgReturn = obs.priceReturns.length > 0
      ? obs.priceReturns.reduce((a, b) => a + b, 0) / obs.priceReturns.length
      : 0;
    const avgPnl = obs.agentPnls.length > 0
      ? obs.agentPnls.reduce((a, b) => a + b, 0) / obs.agentPnls.length
      : 0;

    return [
      avgReturn,
      avgPnl,
      obs.faucetIncomeRate,
      obs.faucetLiquidityInjected,
      obs.volatility,
      obs.spreadBps / 100, // normalize
      obs.orderFlowImbalance,
      obs.riskScore,
      Math.log1p(obs.activeAgents) / 5, // soft normalize
      Math.sin(obs.tick * 0.01), // cyclical encoding
    ];
  }

  /** Encode observation → latent state z_t */
  encode(obs: EconomyObservation): LatentState {
    const x = this.toFeatureVector(obs);
    const z = this.weights.map((row, i) => {
      let sum = this.biases[i];
      for (let j = 0; j < this.inputDim; j++) {
        sum += row[j] * (x[j] ?? 0);
      }
      return Math.tanh(sum); // bounded [-1, 1]
    });

    return { z, tick: obs.tick, timestamp: Date.now() };
  }

  /** Update weights via simple gradient nudge (online learning) */
  nudgeWeights(predictionError: number[], learningRate = 0.001): void {
    for (let i = 0; i < LATENT_DIM; i++) {
      const err = predictionError[i] ?? 0;
      this.biases[i] -= learningRate * err;
      for (let j = 0; j < this.inputDim; j++) {
        this.weights[i][j] -= learningRate * err * 0.1;
      }
    }
  }

  get latentDim(): number {
    return LATENT_DIM;
  }
}
