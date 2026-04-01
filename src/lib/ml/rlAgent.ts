/**
 * Reinforcement Learning Trading Agent
 * Tabular Q-learning with epsilon-greedy exploration.
 */

export type RLAction = 0 | 1 | 2; // 0 = HOLD, 1 = BUY, 2 = SELL

export const RL_ACTION_LABELS: Record<RLAction, string> = {
  0: "HOLD",
  1: "BUY",
  2: "SELL",
};

export interface RLConfig {
  alpha: number;       // learning rate
  gamma: number;       // discount factor
  epsilon: number;     // exploration rate
  epsilonDecay: number;
  epsilonMin: number;
}

const DEFAULT_CONFIG: RLConfig = {
  alpha: 0.1,
  gamma: 0.95,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  epsilonMin: 0.01,
};

export class RLAgent {
  private q: Record<string, [number, number, number]> = {};
  private config: RLConfig;
  private episodeCount = 0;

  constructor(config: Partial<RLConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private discretize(state: number[]): string {
    return state.map((v) => v.toFixed(2)).join(":");
  }

  private getQ(key: string): [number, number, number] {
    if (!this.q[key]) this.q[key] = [0, 0, 0];
    return this.q[key];
  }

  /** Choose action via epsilon-greedy policy. */
  act(state: number[]): RLAction {
    if (Math.random() < this.config.epsilon) {
      return Math.floor(Math.random() * 3) as RLAction;
    }
    const values = this.getQ(this.discretize(state));
    return values.indexOf(Math.max(...values)) as RLAction;
  }

  /** Q-learning update step. */
  learn(
    prevState: number[],
    action: RLAction,
    reward: number,
    nextState: number[]
  ): void {
    const pKey = this.discretize(prevState);
    const nKey = this.discretize(nextState);

    const pQ = this.getQ(pKey);
    const nQ = this.getQ(nKey);

    const maxNext = Math.max(...nQ);
    pQ[action] += this.config.alpha * (reward + this.config.gamma * maxNext - pQ[action]);
  }

  /** Call after each episode to decay exploration. */
  endEpisode(): void {
    this.episodeCount++;
    this.config.epsilon = Math.max(
      this.config.epsilonMin,
      this.config.epsilon * this.config.epsilonDecay
    );
  }

  // ── Serialization ──────────────────────────────────────────

  exportPolicy(): string {
    return JSON.stringify({
      q: this.q,
      config: this.config,
      episodeCount: this.episodeCount,
    });
  }

  importPolicy(json: string): void {
    const data = JSON.parse(json);
    this.q = data.q ?? {};
    this.config = { ...DEFAULT_CONFIG, ...data.config };
    this.episodeCount = data.episodeCount ?? 0;
  }

  get stats() {
    return {
      statesExplored: Object.keys(this.q).length,
      epsilon: this.config.epsilon,
      episodes: this.episodeCount,
    };
  }
}

// ── State Builder ────────────────────────────────────────────

/**
 * Build a discretized state vector from recent prices.
 * Returns [momentum_5, momentum_10, volatility, rsi_like].
 */
export function buildMarketState(prices: number[]): number[] {
  if (prices.length < 15) return [0, 0, 0, 0];

  const recent = prices.slice(-15);
  const returns = recent.slice(1).map((p, i) => (p - recent[i]) / recent[i]);

  const mom5 = returns.slice(-5).reduce((a, b) => a + b, 0);
  const mom10 = returns.slice(-10).reduce((a, b) => a + b, 0);

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const vol = Math.sqrt(
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
  );

  // Pseudo-RSI: fraction of positive returns in last 14
  const posCount = returns.filter((r) => r > 0).length;
  const rsiLike = posCount / returns.length;

  // Discretize to reduce state space
  return [
    Math.round(mom5 * 100) / 100,
    Math.round(mom10 * 100) / 100,
    Math.round(vol * 1000) / 1000,
    Math.round(rsiLike * 10) / 10,
  ];
}

// ── Training Loop Helper ─────────────────────────────────────

export interface TrainingResult {
  totalReward: number;
  trades: number;
  finalEquity: number;
}

/**
 * Composite reward function including faucet income and risk penalty.
 * total_reward = trading_pnl + faucet_income - risk_penalty
 */
export function computeReward(
  tradingPnl: number,
  faucetIncome: number = 0,
  riskExposure: number = 0,
  riskPenaltyWeight: number = 0.5
): number {
  const riskPenalty = riskExposure * riskPenaltyWeight;
  return tradingPnl + faucetIncome - riskPenalty;
}

/**
 * Run one training episode over a price series.
 * Now integrates faucet income shocks into the reward signal.
 */
export function trainEpisode(
  agent: RLAgent,
  prices: number[],
  initialCapital: number = 10_000,
  faucetIncomePerStep: number = 0
): TrainingResult {
  let cash = initialCapital;
  let position = 0;
  let totalReward = 0;
  let trades = 0;

  for (let i = 15; i < prices.length - 1; i++) {
    const state = buildMarketState(prices.slice(0, i + 1));
    const action = agent.act(state);

    const price = prices[i];
    const nextPrice = prices[i + 1];

    if (action === 1 && position === 0) {
      position = cash / price;
      cash = 0;
      trades++;
    } else if (action === 2 && position > 0) {
      cash = position * price;
      position = 0;
      trades++;
    }

    const portfolioNow = cash + position * price;
    const portfolioNext = cash + position * nextPrice;
    const tradingPnl = (portfolioNext - portfolioNow) / portfolioNow;

    // Stochastic faucet income (simulates external liquidity shocks)
    const faucetIncome = faucetIncomePerStep > 0
      ? faucetIncomePerStep * (0.5 + Math.random())
      : 0;

    // Risk exposure based on position concentration
    const riskExposure = position > 0 ? (position * price) / portfolioNow : 0;

    // Composite reward: trading + faucet - risk
    const reward = computeReward(tradingPnl, faucetIncome, riskExposure);

    const nextState = buildMarketState(prices.slice(0, i + 2));
    agent.learn(state, action, reward, nextState);

    totalReward += reward;
    cash += faucetIncome * portfolioNow; // Faucet income adds to cash
  }

  agent.endEpisode();

  const finalEquity = cash + position * prices[prices.length - 1];
  return { totalReward, trades, finalEquity };
}
