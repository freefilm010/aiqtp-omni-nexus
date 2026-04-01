/**
 * usePortfolioPnL — FIFO PnL engine with fee + slippage + time-aware FX.
 *
 * Async computation: FX rates are resolved per-trade timestamp for
 * deterministic, audit-safe PnL reconstruction.
 */
import { useEffect, useState, useRef } from "react";
import { useTradeHistoryQuery } from "@/hooks/usePortfolioQuery";
import { useAssetValuation } from "@/hooks/useAssetValuation";
import { normalizeFeeToUsd } from "@/lib/normalizeFee";

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
  totalFeesPaid: number;
}

export interface PnLTotals {
  totalValue: number;
  totalCostBasis: number;
  totalUnrealized: number;
  totalRealized: number;
  totalUnrealizedPercent: number;
  totalFees: number;
}

const EMPTY_TOTALS: PnLTotals = {
  totalValue: 0, totalCostBasis: 0, totalUnrealized: 0,
  totalRealized: 0, totalUnrealizedPercent: 0, totalFees: 0,
};

export function usePortfolioPnL() {
  const { data: trades = [] } = useTradeHistoryQuery(500);
  const { getValuation } = useAssetValuation();
  const [assets, setAssets] = useState<PnLAsset[]>([]);
  const [totals, setTotals] = useState<PnLTotals>(EMPTY_TOTALS);
  const [isComputing, setIsComputing] = useState(false);
  const versionRef = useRef(0);

  useEffect(() => {
    if (trades.length === 0) {
      setAssets([]);
      setTotals(EMPTY_TOTALS);
      return;
    }

    const version = ++versionRef.current;
    setIsComputing(true);

    (async () => {
      const lotsMap = new Map<string, Lot[]>();
      const realizedMap = new Map<string, number>();
      const feesMap = new Map<string, number>();

      const chronological = [...trades].reverse();

      for (const t of chronological) {
        const symbol = t.symbol.replace(/\/.*$/, "").toUpperCase();
        const qty = Math.abs(t.quantity);
        const price = t.price;
        const slippagePct = t.slippagePct ?? 0;
        const isBuy = t.side === "buy";

        if (!lotsMap.has(symbol)) {
          lotsMap.set(symbol, []);
          realizedMap.set(symbol, 0);
          feesMap.set(symbol, 0);
        }

        // Time-aware fee normalization to USD
        const feeUsd = await normalizeFeeToUsd(t.fee ?? 0, "USD", t.createdAt);
        feesMap.set(symbol, (feesMap.get(symbol) ?? 0) + feeUsd);

        if (isBuy) {
          const effectivePrice = price * (1 + slippagePct) + (qty > 0 ? feeUsd / qty : 0);
          lotsMap.get(symbol)!.push({ qty, price: effectivePrice });
        } else {
          const effectivePrice = price * (1 - slippagePct);
          let sellQty = qty;
          const lots = lotsMap.get(symbol)!;
          let feeApplied = false;

          while (sellQty > 0 && lots.length > 0) {
            const lot = lots[0];
            const used = Math.min(lot.qty, sellQty);
            const sellFee = !feeApplied ? feeUsd : 0;
            feeApplied = true;
            const proceeds = used * effectivePrice - sellFee;
            const cost = used * lot.price;
            realizedMap.set(symbol, (realizedMap.get(symbol) ?? 0) + (proceeds - cost));
            lot.qty -= used;
            sellQty -= used;
            if (lot.qty <= 0) lots.shift();
          }
        }
      }

      // Stale check — abort if a newer computation started
      if (version !== versionRef.current) return;

      const computed: PnLAsset[] = [];

      for (const [symbol, lots] of lotsMap.entries()) {
        const totalQty = lots.reduce((s, l) => s + l.qty, 0);
        const totalCost = lots.reduce((s, l) => s + l.qty * l.price, 0);
        const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
        const realizedPnL = realizedMap.get(symbol) ?? 0;
        const totalFees = feesMap.get(symbol) ?? 0;

        if (totalQty <= 0) {
          if (Math.abs(realizedPnL) > 0.01) {
            computed.push({
              symbol, quantity: 0, avgCost, currentPrice: 0, currentValue: 0,
              unrealizedPnL: 0, unrealizedPnLPercent: 0,
              realizedPnL: Math.round(realizedPnL * 100) / 100,
              totalCostBasis: 0, totalReturnPercent: 0,
              totalFeesPaid: Math.round(totalFees * 100) / 100,
            });
          }
          continue;
        }

        const val = getValuation(symbol, totalQty);
        const costBasis = totalCost;
        const unrealized = val.priceUnavailable ? 0 : (val.priceUsd - avgCost) * totalQty;
        const unrealizedPct = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;
        const totalReturnPct = costBasis > 0 ? ((unrealized + realizedPnL) / costBasis) * 100 : 0;

        computed.push({
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
          totalFeesPaid: Math.round(totalFees * 100) / 100,
        });
      }

      computed.sort((a, b) => b.currentValue - a.currentValue);

      if (version !== versionRef.current) return;

      const tv = computed.reduce((s, a) => s + a.currentValue, 0);
      const tcb = computed.reduce((s, a) => s + a.totalCostBasis, 0);
      const tu = computed.reduce((s, a) => s + a.unrealizedPnL, 0);
      const tr = computed.reduce((s, a) => s + a.realizedPnL, 0);
      const tf = computed.reduce((s, a) => s + a.totalFeesPaid, 0);

      setAssets(computed);
      setTotals({
        totalValue: Math.round(tv * 100) / 100,
        totalCostBasis: Math.round(tcb * 100) / 100,
        totalUnrealized: Math.round(tu * 100) / 100,
        totalRealized: Math.round(tr * 100) / 100,
        totalUnrealizedPercent: tcb > 0 ? Math.round((tu / tcb) * 10000) / 100 : 0,
        totalFees: Math.round(tf * 100) / 100,
      });
      setIsComputing(false);
    })();
  }, [trades, getValuation]);

  return { assets, totals, isComputing };
}
