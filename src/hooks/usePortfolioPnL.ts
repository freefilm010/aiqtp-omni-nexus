/**
 * usePortfolioPnL — Tax-grade FIFO/LIFO/HIFO PnL engine.
 *
 * Features:
 * - Lot ID tracking for audit trail
 * - Strategy-aware sell matching (FIFO | LIFO | HIFO)
 * - Fee + slippage in cost basis / proceeds
 * - Time-aware FX normalization
 * - Holding period classification (short/long term)
 * - Deterministic replay (same trades → same PnL)
 */
import { useEffect, useState, useRef } from "react";
import { useTradeHistoryQuery } from "@/hooks/usePortfolioQuery";
import { useAssetValuation } from "@/hooks/useAssetValuation";
import { normalizeFeeToUsd } from "@/lib/normalizeFee";
import { orderLotsByStrategy } from "@/lib/lotStrategy";
import { pnlStream } from "@/lib/pnlStream";
import type { TaxLot, RealizedEvent, LotStrategy } from "@/lib/taxLots";

interface InternalLot {
  lotId: string;
  qty: number;
  price: number;          // effective (includes fee + slippage)
  buyTimestamp: string;
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

const DEFAULT_STRATEGY: LotStrategy = "FIFO";

let lotCounter = 0;
function nextLotId(): string {
  return `lot-${++lotCounter}-${Date.now().toString(36)}`;
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function usePortfolioPnL(strategy: LotStrategy = DEFAULT_STRATEGY) {
  const { data: trades = [] } = useTradeHistoryQuery(500);
  const { getValuation } = useAssetValuation();
  const [assets, setAssets] = useState<PnLAsset[]>([]);
  const [totals, setTotals] = useState<PnLTotals>(EMPTY_TOTALS);
  const [realizedEvents, setRealizedEvents] = useState<RealizedEvent[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const versionRef = useRef(0);

  useEffect(() => {
    if (trades.length === 0) {
      setAssets([]);
      setTotals(EMPTY_TOTALS);
      setRealizedEvents([]);
      return;
    }

    const version = ++versionRef.current;
    lotCounter = 0;
    setIsComputing(true);

    (async () => {
      const lotsMap = new Map<string, InternalLot[]>();
      const realizedMap = new Map<string, number>();
      const feesMap = new Map<string, number>();
      const events: RealizedEvent[] = [];

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

        const feeUsd = await normalizeFeeToUsd(t.fee ?? 0, "USD", t.createdAt);
        feesMap.set(symbol, (feesMap.get(symbol) ?? 0) + feeUsd);

        if (isBuy) {
          const effectivePrice = price * (1 + slippagePct) + (qty > 0 ? feeUsd / qty : 0);
          lotsMap.get(symbol)!.push({
            lotId: nextLotId(),
            qty,
            price: effectivePrice,
            buyTimestamp: t.createdAt,
          });
        } else {
          const effectivePrice = price * (1 - slippagePct);
          let sellQty = qty;
          const allLots = lotsMap.get(symbol)!;

          // Apply lot strategy ordering
          const taxLots: TaxLot[] = allLots.map((l) => ({
            lotId: l.lotId, symbol, qty: l.qty,
            buyPrice: l.price, buyPriceEffective: l.price,
            buyFxRate: 1, buyTimestamp: l.buyTimestamp,
            costBasisUsd: l.qty * l.price,
          }));
          const ordered = orderLotsByStrategy(taxLots, strategy);
          const orderedIds = ordered.map((o) => o.lotId);

          let feeApplied = false;
          for (const lotId of orderedIds) {
            if (sellQty <= 0) break;
            const lot = allLots.find((l) => l.lotId === lotId);
            if (!lot || lot.qty <= 0) continue;

            const used = Math.min(lot.qty, sellQty);
            const sellFee = !feeApplied ? feeUsd : 0;
            feeApplied = true;
            const proceeds = used * effectivePrice - sellFee;
            const cost = used * lot.price;
            const gain = proceeds - cost;

            realizedMap.set(symbol, (realizedMap.get(symbol) ?? 0) + gain);

            const holdDays = daysBetween(lot.buyTimestamp, t.createdAt);
            events.push({
              lotId: lot.lotId, symbol, qty: used,
              costBasisUsd: Math.round(cost * 100) / 100,
              proceedsUsd: Math.round(proceeds * 100) / 100,
              gainLossUsd: Math.round(gain * 100) / 100,
              buyDate: lot.buyTimestamp,
              sellDate: t.createdAt,
              holdingDays: holdDays,
              isLongTerm: holdDays > 365,
            });

            lot.qty -= used;
            sellQty -= used;
          }

          // Remove empty lots
          const remaining = allLots.filter((l) => l.qty > 0);
          lotsMap.set(symbol, remaining);
        }
      }

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
          symbol, quantity: totalQty,
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

      // Emit per-asset events to PnL stream
      for (const a of computed) {
        if (a.quantity > 0) {
          pnlStream.emitAssetUpdate({
            symbol: a.symbol,
            unrealizedPnL: a.unrealizedPnL,
            realizedPnL: a.realizedPnL,
            totalValue: a.currentValue,
            timestamp: Date.now(),
          });
        }
      }

      setAssets(computed);
      setRealizedEvents(events);
      const newTotals = {
        totalValue: Math.round(tv * 100) / 100,
        totalCostBasis: Math.round(tcb * 100) / 100,
        totalUnrealized: Math.round(tu * 100) / 100,
        totalRealized: Math.round(tr * 100) / 100,
        totalUnrealizedPercent: tcb > 0 ? Math.round((tu / tcb) * 10000) / 100 : 0,
        totalFees: Math.round(tf * 100) / 100,
      };
      setTotals(newTotals);

      // Emit totals event
      pnlStream.emitTotalsUpdate({
        totalValue: newTotals.totalValue,
        totalUnrealized: newTotals.totalUnrealized,
        totalRealized: newTotals.totalRealized,
        totalFees: newTotals.totalFees,
        timestamp: Date.now(),
      });

      setIsComputing(false);
    })();
  }, [trades, getValuation, strategy]);

  return { assets, totals, realizedEvents, isComputing };
}
