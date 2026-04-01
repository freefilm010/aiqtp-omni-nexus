/**
 * Pluggable Strategy Engine
 * DSL-style interface for building and running trading strategies.
 */

// ── Types ────────────────────────────────────────────────────────

export type TradeAction = "BUY" | "SELL" | "HOLD";

export interface TradeSignal {
  symbol: string;
  action: TradeAction;
  size: number;
  confidence: number; // 0-1
  reason?: string;
}

export interface StrategyContext {
  symbols: string[];
  /** symbol → recent close prices (newest last) */
  history: Record<string, number[]>;
  /** symbol → current price */
  prices: Record<string, number>;
  /** current portfolio positions */
  positions: Record<string, number>;
  timestamp: number;
}

export interface Strategy {
  readonly name: string;
  onTick(ctx: StrategyContext): TradeSignal[];
}

// ── Engine ───────────────────────────────────────────────────────

export class StrategyEngine {
  private strategy: Strategy;

  constructor(strategy: Strategy) {
    this.strategy = strategy;
  }

  /** Process a single market tick and return trade signals. */
  tick(ctx: StrategyContext): TradeSignal[] {
    return this.strategy.onTick(ctx).filter((s) => s.action !== "HOLD");
  }

  get strategyName(): string {
    return this.strategy.name;
  }
}

// ── Built-in Strategies ──────────────────────────────────────────

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Simple Moving-Average Crossover */
export const maCrossoverStrategy: Strategy = {
  name: "MA Crossover (5/20)",
  onTick(ctx) {
    const signals: TradeSignal[] = [];

    for (const symbol of ctx.symbols) {
      const prices = ctx.history[symbol];
      if (!prices || prices.length < 20) continue;

      const fast = avg(prices.slice(-5));
      const slow = avg(prices.slice(-20));
      const prevFast = avg(prices.slice(-6, -1));
      const prevSlow = avg(prices.slice(-21, -1));

      if (prevFast <= prevSlow && fast > slow) {
        signals.push({ symbol, action: "BUY", size: 1, confidence: 0.7, reason: "Golden cross" });
      } else if (prevFast >= prevSlow && fast < slow) {
        signals.push({ symbol, action: "SELL", size: 1, confidence: 0.7, reason: "Death cross" });
      }
    }

    return signals;
  },
};

/** Mean-Reversion (Bollinger Band bounce) */
export const meanReversionStrategy: Strategy = {
  name: "Mean Reversion (BB)",
  onTick(ctx) {
    const signals: TradeSignal[] = [];

    for (const symbol of ctx.symbols) {
      const prices = ctx.history[symbol];
      if (!prices || prices.length < 20) continue;

      const window = prices.slice(-20);
      const mean = avg(window);
      const variance = window.reduce((s, p) => s + (p - mean) ** 2, 0) / window.length;
      const std = Math.sqrt(variance);

      const current = prices[prices.length - 1];
      const zScore = std > 0 ? (current - mean) / std : 0;

      if (zScore < -2) {
        signals.push({ symbol, action: "BUY", size: 1, confidence: 0.6, reason: `z=${zScore.toFixed(2)} oversold` });
      } else if (zScore > 2) {
        signals.push({ symbol, action: "SELL", size: 1, confidence: 0.6, reason: `z=${zScore.toFixed(2)} overbought` });
      }
    }

    return signals;
  },
};

/** Momentum (Rate of Change) */
export const momentumStrategy: Strategy = {
  name: "Momentum (ROC-14)",
  onTick(ctx) {
    const signals: TradeSignal[] = [];
    const lookback = 14;

    for (const symbol of ctx.symbols) {
      const prices = ctx.history[symbol];
      if (!prices || prices.length < lookback + 1) continue;

      const current = prices[prices.length - 1];
      const past = prices[prices.length - 1 - lookback];
      const roc = (current - past) / past;

      if (roc > 0.05) {
        signals.push({ symbol, action: "BUY", size: 1, confidence: 0.65, reason: `ROC ${(roc * 100).toFixed(1)}%` });
      } else if (roc < -0.05) {
        signals.push({ symbol, action: "SELL", size: 1, confidence: 0.65, reason: `ROC ${(roc * 100).toFixed(1)}%` });
      }
    }

    return signals;
  },
};
