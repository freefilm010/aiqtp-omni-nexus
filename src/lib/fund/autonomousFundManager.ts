/**
 * Autonomous Fund Manager
 * Performance-weighted capital allocation with momentum + mean-reversion blend.
 */

export interface StrategyPerformance {
  strategyId: string;
  pnl: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
}

export interface Allocation {
  strategyId: string;
  weight: number;
  capitalUsd: number;
}

export class AutonomousFundManager {
  private scores: Map<string, number> = new Map();
  private readonly learningRate: number;
  private readonly minAllocation: number;

  constructor(
    strategyIds: string[],
    learningRate: number = 0.15,
    minAllocation: number = 0.02
  ) {
    this.learningRate = learningRate;
    this.minAllocation = minAllocation;
    for (const id of strategyIds) {
      this.scores.set(id, 1.0);
    }
  }

  /** Update internal scores based on latest performance. */
  update(performances: StrategyPerformance[]): void {
    for (const p of performances) {
      const prev = this.scores.get(p.strategyId) ?? 1.0;

      // Composite reward: PnL-weighted, penalize drawdown
      const reward =
        p.pnl * 0.5 +
        p.sharpe * 0.3 +
        p.winRate * 0.1 -
        p.maxDrawdown * 0.1;

      const updated = prev + this.learningRate * reward;
      this.scores.set(p.strategyId, Math.max(0.01, updated));
    }
  }

  /** Compute normalized capital allocation. */
  allocate(totalCapitalUsd: number): Allocation[] {
    const entries = [...this.scores.entries()];
    const total = entries.reduce((s, [, v]) => s + v, 0);

    return entries.map(([id, score]) => {
      const rawWeight = total > 0 ? score / total : 1 / entries.length;
      const weight = Math.max(this.minAllocation, rawWeight);
      return {
        strategyId: id,
        weight,
        capitalUsd: totalCapitalUsd * weight,
      };
    });
  }

  /** Run a full rebalance cycle. */
  rebalanceCycle(
    performances: StrategyPerformance[],
    totalCapitalUsd: number
  ): Allocation[] {
    this.update(performances);
    return this.allocate(totalCapitalUsd);
  }

  get currentScores(): Record<string, number> {
    return Object.fromEntries(this.scores);
  }
}
