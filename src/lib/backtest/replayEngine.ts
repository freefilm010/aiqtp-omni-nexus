/**
 * Backtest Replay Engine
 * Replays trades against price history to produce equity curve, drawdown, and stats.
 * Runs entirely client-side — no server needed.
 */

export interface BacktestTrade {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fee: number;
  timestamp: string;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  equityCurve: EquityPoint[];
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  tradeCount: number;
  winRate: number;
  sharpeRatio: number;
}

interface Position {
  qty: number;
  avgCost: number;
}

export function runBacktest(
  trades: BacktestTrade[],
  initialCapital: number = 10000
): BacktestResult {
  const positions = new Map<string, Position>();
  let cash = initialCapital;
  let peakEquity = initialCapital;
  let maxDrawdown = 0;
  let wins = 0;
  let losses = 0;

  const curve: EquityPoint[] = [];
  const dailyReturns: number[] = [];
  let prevEquity = initialCapital;

  // Sort chronologically
  const sorted = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const t of sorted) {
    const qty = Math.abs(t.quantity);
    const pos = positions.get(t.symbol) ?? { qty: 0, avgCost: 0 };

    if (t.side === "buy") {
      const cost = qty * t.price + t.fee;
      const newQty = pos.qty + qty;
      pos.avgCost = newQty > 0
        ? (pos.avgCost * pos.qty + cost) / newQty
        : 0;
      pos.qty = newQty;
      cash -= cost;
    } else {
      const sellQty = Math.min(qty, pos.qty);
      if (sellQty > 0) {
        const proceeds = sellQty * t.price - t.fee;
        const costBasis = sellQty * pos.avgCost;
        const pnl = proceeds - costBasis;
        if (pnl > 0) wins++;
        else if (pnl < 0) losses++;
        cash += proceeds;
        pos.qty -= sellQty;
      }
    }

    positions.set(t.symbol, pos);

    // Compute portfolio equity (cash + positions at last trade price)
    let positionsValue = 0;
    for (const [, p] of positions) {
      positionsValue += p.qty * (t.price); // simplified: use last trade price
    }
    const equity = cash + positionsValue;

    // Track drawdown
    if (equity > peakEquity) peakEquity = equity;
    const dd = peakEquity > 0 ? (peakEquity - equity) / peakEquity : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;

    // Daily return
    const ret = prevEquity > 0 ? (equity - prevEquity) / prevEquity : 0;
    dailyReturns.push(ret);
    prevEquity = equity;

    curve.push({
      timestamp: t.timestamp,
      equity: Math.round(equity * 100) / 100,
      drawdown: Math.round(dd * 10000) / 100,
    });
  }

  const finalEquity = curve.length > 0 ? curve[curve.length - 1].equity : initialCapital;
  const totalReturn = finalEquity - initialCapital;
  const totalReturnPercent = initialCapital > 0 ? (totalReturn / initialCapital) * 100 : 0;
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  // Sharpe ratio (annualized, assuming ~252 trading days)
  const meanReturn = dailyReturns.length > 0
    ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length
    : 0;
  const variance = dailyReturns.length > 1
    ? dailyReturns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (dailyReturns.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    equityCurve: curve,
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
    maxDrawdownPercent: Math.round(maxDrawdown * 10000) / 100,
    tradeCount: sorted.length,
    winRate: Math.round(winRate * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
  };
}
