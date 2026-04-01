/**
 * usePortfolioPnL — FIFO (First-In, First-Out) PnL engine.
 * Tax-grade lot tracking with unrealized/realized PnL and % returns.
 */
import { useMemo } from "react";
import { useTradeHistoryQuery } from "@/hooks/usePortfolioQuery";
import { useAssetValuation } from "@/hooks/useAssetValuation";

interface Lot {
  qty: number;
  price: number;
}

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
  totalReturnPercent: number;
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
    const lotsMap = new Map<string, Lot[]>();
    const realizedMap = new Map<string, number>();

    // Process trades chronologically (oldest first — trades come desc, reverse)
    const chronological = [...trades].reverse();

    for (const t of chronological) {
      const symbol = t.symbol.replace(/\/.*$/, "").toUpperCase();
      const qty = Math.abs(t.quantity);
      const price = t.price;
      const isBuy = t.side === "buy";

      if (!lotsMap.has(symbol)) {
        lotsMap.set(symbol, []);
        realizedMap.set(symbol, 0);
      }

      const lots = lotsMap.get(symbol)!;

      if (isBuy) {
        lots.push({ qty, price });
      } else {
        // FIFO: consume oldest lots first
        let sellQty = qty;
        while (sellQty > 0 && lots.length > 0) {
          const lot = lots[0];
          const used = Math.min(lot.qty, sellQty);
          const pnl = (price - lot.price) * used;
          realizedMap.set(symbol, (realizedMap.get(symbol) ?? 0) + pnl);
          lot.qty -= used;
          sellQty -= used;
          if (lot.qty <= 0) lots.shift();
        }
      }
    }

    const assets: PnLAsset[] = [];

    for (const [symbol, lots] of lotsMap.entries()) {
      const totalQty = lots.reduce((s, l) => s + l.qty, 0);
      const totalCost = lots.reduce((s, l) => s + l.qty * l.price, 0);
      const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
      const realizedPnL = realizedMap.get(symbol) ?? 0;

      if (totalQty <= 0) {
        if (Math.abs(realizedPnL) > 0.01) {
          assets.push({
            symbol, quantity: 0, avgCost, currentPrice: 0, currentValue: 0,
            unrealizedPnL: 0, unrealizedPnLPercent: 0,
            realizedPnL: Math.round(realizedPnL * 100) / 100,
            totalCostBasis: 0, totalReturnPercent: 0,
          });
        }
        continue;
      }

      const val = getValuation(symbol, totalQty);
      const costBasis = totalCost;
      const unrealized = val.priceUnavailable ? 0 : (val.priceUsd - avgCost) * totalQty;
      const unrealizedPct = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;
      const totalReturnPct = costBasis > 0 ? ((unrealized + realizedPnL) / costBasis) * 100 : 0;

      assets.push({
        symbol,
        quantity: totalQty,
        avgCost: Math.round(avgCost * 100) / 100,
        currentPrice: val.priceUsd,
        currentValue: Math.round(val.valueUsd * 100) / 100,
        unrealizedPnL: Math.round(unrealized * 100) / 100,
        unrealizedPnLPercent: Math.round(unrealizedPct * 100) / 100,
        realizedPnL: Math.round(realizedPnL * 100) / 100,
        totalCostBasis: Math.round(costBasis * 100) / 100,
        totalReturnPercent: Math.round(totalReturnPct * 100) / 100,
      });
    }

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
