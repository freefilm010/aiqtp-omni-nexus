/**
 * World-Model Transformer Agent
 * Predicts future market states internally, then chooses actions
 * based on imagined trajectories rather than reactive signals.
 */

export interface WorldState {
  price: number;
  momentum: number;
  volatility: number;
}

export interface WorldPrediction {
  nextPrice: number;
  nextMomentum: number;
  nextVolatility: number;
  confidence: number;
}

export class WorldModelAgent {
  id: string;
  private history: WorldState[] = [];
  private maxHistory = 50;
  private weights = { price: 0.6, momentum: 0.3, volatility: 0.1 };
  private predictionError = 0;
  pnl = 0;
  trades = 0;

  constructor(id: string) {
    this.id = id;
    // randomize weights slightly per agent
    this.weights.price += (Math.random() - 0.5) * 0.2;
    this.weights.momentum += (Math.random() - 0.5) * 0.2;
    this.weights.volatility += (Math.random() - 0.5) * 0.1;
  }

  observe(state: WorldState): void {
    this.history.push(state);
    if (this.history.length > this.maxHistory) this.history.shift();
  }

  predict(): WorldPrediction | null {
    if (this.history.length < 5) return null;
    const last = this.history[this.history.length - 1];
    const recentPrices = this.history.slice(-5).map(s => s.price);
    const trend = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const delta = last.price - trend;

    return {
      nextPrice: last.price + delta * this.weights.price,
      nextMomentum: last.momentum * this.weights.momentum + delta * 0.01,
      nextVolatility: Math.abs(delta) * this.weights.volatility + last.volatility * 0.3,
      confidence: Math.max(0, 1 - this.predictionError * 0.1),
    };
  }

  act(): "BUY" | "SELL" | "HOLD" {
    const pred = this.predict();
    if (!pred) return "HOLD";

    const last = this.history[this.history.length - 1];
    if (pred.nextPrice > last.price * 1.005) return "BUY";
    if (pred.nextPrice < last.price * 0.995) return "SELL";
    return "HOLD";
  }

  /** Update world model based on actual next state (online learning) */
  learn(actualNext: WorldState): void {
    const pred = this.predict();
    if (!pred) return;

    const error = Math.abs(pred.nextPrice - actualNext.price);
    this.predictionError = this.predictionError * 0.9 + error * 0.1;

    // Simple gradient-free weight adjustment
    const lr = 0.001;
    this.weights.price -= (pred.nextPrice > actualNext.price ? 1 : -1) * lr;
    this.weights.momentum -= (pred.nextMomentum > actualNext.momentum ? 1 : -1) * lr * 0.5;
  }

  getState() {
    return {
      id: this.id,
      pnl: this.pnl,
      trades: this.trades,
      predictionError: this.predictionError,
      weights: { ...this.weights },
      confidence: this.predict()?.confidence ?? 0,
    };
  }
}
