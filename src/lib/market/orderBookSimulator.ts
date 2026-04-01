/**
 * Order Book Simulation & Market Impact Model
 * Liquidity-aware execution pricing with depth analysis.
 */

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface MarketImpactResult {
  avgExecutionPrice: number;
  bestPrice: number;
  worstFillPrice: number;
  slippagePct: number;
  totalCost: number;
  filledQty: number;
  unfilledQty: number;
  levelsConsumed: number;
}

/**
 * Estimate market impact by walking through order book depth.
 */
export function estimateMarketImpact(
  book: OrderBook,
  side: "buy" | "sell",
  quantity: number
): MarketImpactResult {
  const levels = side === "buy" ? book.asks : book.bids;

  if (levels.length === 0) {
    return {
      avgExecutionPrice: 0,
      bestPrice: 0,
      worstFillPrice: 0,
      slippagePct: 0,
      totalCost: 0,
      filledQty: 0,
      unfilledQty: quantity,
      levelsConsumed: 0,
    };
  }

  let remaining = quantity;
  let totalCost = 0;
  let worstFillPrice = levels[0].price;
  let levelsConsumed = 0;

  for (const level of levels) {
    if (remaining <= 0) break;

    const used = Math.min(level.size, remaining);
    totalCost += used * level.price;
    worstFillPrice = level.price;
    remaining -= used;
    levelsConsumed++;
  }

  const filledQty = quantity - remaining;
  const avgExecutionPrice = filledQty > 0 ? totalCost / filledQty : 0;
  const bestPrice = levels[0].price;
  const slippagePct =
    bestPrice > 0 ? (avgExecutionPrice - bestPrice) / bestPrice : 0;

  return {
    avgExecutionPrice,
    bestPrice,
    worstFillPrice,
    slippagePct: side === "sell" ? -slippagePct : slippagePct,
    totalCost,
    filledQty,
    unfilledQty: remaining,
    levelsConsumed,
  };
}

/**
 * Generate a synthetic order book for simulation / backtesting.
 */
export function generateSyntheticBook(
  midPrice: number,
  spreadPct: number = 0.001,
  depth: number = 20,
  avgSize: number = 10
): OrderBook {
  const halfSpread = midPrice * spreadPct * 0.5;
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  for (let i = 0; i < depth; i++) {
    const offset = halfSpread + midPrice * 0.0002 * i;
    const sizeJitter = 0.5 + Math.random();

    asks.push({
      price: +(midPrice + offset).toFixed(8),
      size: +(avgSize * sizeJitter).toFixed(4),
    });

    bids.push({
      price: +(midPrice - offset).toFixed(8),
      size: +(avgSize * sizeJitter).toFixed(4),
    });
  }

  return { bids, asks, timestamp: Date.now() };
}

/**
 * Compute liquidity score (0-1) for a given trade size.
 * 1 = easily absorbed, 0 = would move market significantly.
 */
export function liquidityScore(
  book: OrderBook,
  side: "buy" | "sell",
  quantity: number
): number {
  const impact = estimateMarketImpact(book, side, quantity);
  if (impact.filledQty === 0) return 0;

  const fillRatio = impact.filledQty / quantity;
  const slippagePenalty = Math.max(0, 1 - Math.abs(impact.slippagePct) * 100);

  return +(fillRatio * slippagePenalty).toFixed(4);
}
