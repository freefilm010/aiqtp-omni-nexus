/**
 * Execution Planner
 * Bridges strategy engine signals with market-impact-aware execution.
 */

import type { TradeSignal, StrategyContext } from "./strategyEngine";
import { StrategyEngine } from "./strategyEngine";
import { estimateMarketImpact, type OrderBook } from "@/lib/market/orderBookSimulator";

export interface ExecutionPlan {
  signal: TradeSignal;
  estimatedPrice: number;
  slippagePct: number;
  liquidityOk: boolean;
}

/**
 * Run strategy tick → enrich signals with market-impact estimates.
 */
export function generateExecutionPlan(
  engine: StrategyEngine,
  ctx: StrategyContext,
  books: Record<string, OrderBook>
): ExecutionPlan[] {
  const signals = engine.tick(ctx);

  return signals.map((signal) => {
    const book = books[signal.symbol];

    if (!book) {
      return {
        signal,
        estimatedPrice: ctx.prices[signal.symbol] ?? 0,
        slippagePct: 0,
        liquidityOk: false,
      };
    }

    const side = signal.action === "BUY" ? "buy" : "sell";
    const impact = estimateMarketImpact(book, side, signal.size);

    return {
      signal,
      estimatedPrice: impact.avgExecutionPrice,
      slippagePct: impact.slippagePct,
      liquidityOk: impact.unfilledQty === 0,
    };
  });
}
