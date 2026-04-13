/**
 * useWebSocketPrices — Binance WebSocket for sub-second price updates.
 * Patches React Query cache directly for instant UI updates.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectBinanceStream, type MarketTick } from "@/lib/market/marketStream";

// Map Binance symbols to our internal symbols
const BINANCE_TO_SYMBOL: Record<string, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  SOLUSDT: "SOL",
  BNBUSDT: "BNB",
  XRPUSDT: "XRP",
  ADAUSDT: "ADA",
  DOGEUSDT: "DOGE",
  AVAXUSDT: "AVAX",
  DOTUSDT: "DOT",
  LINKUSDT: "LINK",
  MATICUSDT: "MATIC",
  UNIUSDT: "UNI",
  AAVEUSDT: "AAVE",
  ARBUSDT: "ARB",
  OPUSDT: "OP",
  LTCUSDT: "LTC",
  NEARUSDT: "NEAR",
  ATOMUSDT: "ATOM",
  FTMUSDT: "FTM",
  INJUSDT: "INJ",
  SUIUSDT: "SUI",
  APTUSDT: "APT",
  RNDRUSDT: "RNDR",
  FETUSDT: "FET",
  GRTUSDT: "GRT",
  FILUSDT: "FIL",
  PEPEUSDT: "PEPE",
  BONKUSDT: "BONK",
  WIFUSDT: "WIF",
};

const STREAMS = Object.keys(BINANCE_TO_SYMBOL).map(
  (s) => `${s.toLowerCase()}@trade`
);

const formatPrice = (price: number): string => {
  if (price >= 1000)
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
};

const formatVolume = (vol: number): string => {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
};

/**
 * Connects to Binance WebSocket and patches the marketPrices cache
 * in real-time. Batches updates every 250ms to prevent render thrash
 * while maintaining sub-second freshness.
 */
export function useWebSocketPrices() {
  const queryClient = useQueryClient();
  const bufferRef = useRef<Map<string, MarketTick>>(new Map());
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const flush = () => {
      if (bufferRef.current.size === 0) {
        rafRef.current = null;
        return;
      }

      const ticks = new Map(bufferRef.current);
      bufferRef.current.clear();
      rafRef.current = null;

      // Patch the React Query cache directly — no refetch needed
      queryClient.setQueryData(
        ["marketPrices"],
        (old: { priceMap: Record<string, any>; lastSyncError: string | null } | undefined) => {
          if (!old) return old;

          const updated = { ...old.priceMap };

          for (const [binanceSymbol, tick] of ticks) {
            const symbol = BINANCE_TO_SYMBOL[binanceSymbol];
            if (!symbol) continue;

            const existing = updated[symbol];
            const now = new Date();

            const entry = {
              symbol,
              name: existing?.name ?? symbol,
              price: formatPrice(tick.price),
              priceNumeric: tick.price,
              change: existing?.change ?? "+0.00%",
              changePercent: existing?.changePercent ?? 0,
              volume: existing?.volume ?? formatVolume(0),
              volumeNumeric: existing?.volumeNumeric ?? 0,
              marketCap: existing?.marketCap ?? 0,
              trend: existing?.trend ?? ("up" as const),
              lastUpdate: now,
            };

            updated[symbol] = entry;
            updated[`${symbol}/USD`] = entry;
          }

          return { priceMap: updated, lastSyncError: null };
        }
      );
    };

    const scheduleFlush = () => {
      if (!rafRef.current) {
        rafRef.current = setTimeout(flush, 250); // 250ms batching — 4 updates/sec
      }
    };

    const cleanup = connectBinanceStream({
      streams: STREAMS,
      onTick: (tick) => {
        bufferRef.current.set(tick.symbol, tick);
        scheduleFlush();
      },
      onError: (err) => {
        console.warn("[WebSocket] Binance stream error:", err);
      },
      onReconnect: () => {
        console.info("[WebSocket] Reconnecting to Binance...");
      },
      maxRetries: 20,
    });

    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
      cleanup();
    };
  }, [queryClient]);
}
