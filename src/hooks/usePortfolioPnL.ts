/**
 * usePortfolioPnL — Weighted Average Cost (WAC) PnL engine.
 * Computes cost basis, unrealized PnL, and realized PnL from trade history.
 *
 * Trades are processed chronologically (oldest first).
 * Buy → increases position + adjusts WAC.
 * Sell → realizes PnL at (sell price − WAC) × qty.
 */
import { useMemo } from "react";
import { useTradeHistoryQuery } from "@/hooks/usePortfolioQuery";
import { useAssetValuation } from "@/hooks/useAssetValuation";

export interface PnLAsset {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  totalCostBasis: number;
}

export interface PnLTotals {
  totalValue: number;
  totalCostBasis: number;
  totalUnrealized: number;
  totalRealized: number;
  totalUnrealizedPercent: number;
}

export function usePortfolioPnL() {
  const { data: trades = [] } = useTradeHistoryQuery(500);
  const { getValuation } = useAssetValuation();

  return useMemo(() => {
    const map = new Map<string, { quantity: number; avgCost: number; realizedPnL: number }>();

    // Process trades chronologically (oldest first — trades come desc, reverse)
    const chronological = [...trades].reverse();

    for (const t of chronological) {
      const symbol = t.symbol.replace(/\/.*$/, "").toUpperCase(); // normalize "BTC/USDT" → "BTC"
      const qty = Math.abs(t.quantity);
      const price = t.price;
      const isBuy = t.side === "buy";

      if (!map.has(symbol)) {
        map.set(symbol, { quantity: 0, avgCost: 0, realizedPnL: 0 });
      }

      const pos = map.get(symbol)!;

      if (isBuy) {
        const totalCost = pos.avgCost * pos.quantity + price * qty;
        pos.quantity += qty;
        pos.avgCost = pos.quantity > 0 ? totalCost / pos.quantity : 0;
      } else {
        const sellQty = Math.min(qty, pos.quantity);
        if (sellQty > 0) {
          pos.realizedPnL += (price - pos.avgCost) * sellQty;
          pos.quantity -= sellQty;
          // avgCost stays the same for WAC
        }
      }
    }

    // Attach live prices and compute unrealized PnL
    const assets: PnLAsset[] = [];

    for (const [symbol, pos] of map.entries()) {
      if (pos.quantity <= 0) {
        // Closed position — only realized PnL matters
        if (Math.abs(pos.realizedPnL) > 0.01) {
          assets.push({
            symbol,
            quantity: 0,
            avgCost: pos.avgCost,
            currentPrice: 0,
            currentValue: 0,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            realizedPnL: Math.round(pos.realizedPnL * 100) / 100,
            totalCostBasis: 0,
          });
        }
        continue;
      }

      const val = getValuation(symbol, pos.quantity);

      const costBasis = pos.avgCost * pos.quantity;
      const unrealized = val.priceUnavailable ? 0 : (val.priceUsd - pos.avgCost) * pos.quantity;
      const unrealizedPercent = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;

      assets.push({
        symbol,
        quantity: pos.quantity,
        avgCost: Math.round(pos.avgCost * 100) / 100,
        currentPrice: val.priceUsd,
        currentValue: Math.round(val.valueUsd * 100) / 100,
        unrealizedPnL: Math.round(unrealized * 100) / 100,
        unrealizedPnLPercent: Math.round(unrealizedPercent * 100) / 100,
        realizedPnL: Math.round(pos.realizedPnL * 100) / 100,
        totalCostBasis: Math.round(costBasis * 100) / 100,
      });
    }

    // Sort by current value descending
    assets.sort((a, b) => b.currentValue - a.currentValue);

    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const totalCostBasis = assets.reduce((s, a) => s + a.totalCostBasis, 0);
    const totalUnrealized = assets.reduce((s, a) => s + a.unrealizedPnL, 0);
    const totalRealized = assets.reduce((s, a) => s + a.realizedPnL, 0);
    const totalUnrealizedPercent = totalCostBasis > 0 ? (totalUnrealized / totalCostBasis) * 100 : 0;

    const totals: PnLTotals = {
      totalValue: Math.round(totalValue * 100) / 100,
      totalCostBasis: Math.round(totalCostBasis * 100) / 100,
      totalUnrealized: Math.round(totalUnrealized * 100) / 100,
      totalRealized: Math.round(totalRealized * 100) / 100,
      totalUnrealizedPercent: Math.round(totalUnrealizedPercent * 100) / 100,
    };

    return { assets, totals };
  }, [trades, getValuation]);
}
