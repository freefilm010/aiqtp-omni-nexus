/**
 * useWebSocketPrices — Polls Binance via edge function every 2s for near-real-time prices.
 * Direct WebSocket to Binance is blocked by browser CSP, so we proxy through edge functions.
 * Patches React Query cache directly for instant UI updates.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BINANCE_TO_SYMBOL: Record<string, string> = {
  BTCUSDT: "BTC", ETHUSDT: "ETH", SOLUSDT: "SOL", BNBUSDT: "BNB",
  XRPUSDT: "XRP", ADAUSDT: "ADA", DOGEUSDT: "DOGE", AVAXUSDT: "AVAX",
  DOTUSDT: "DOT", LINKUSDT: "LINK", MATICUSDT: "MATIC", UNIUSDT: "UNI",
  AAVEUSDT: "AAVE", ARBUSDT: "ARB", OPUSDT: "OP", LTCUSDT: "LTC",
  NEARUSDT: "NEAR", ATOMUSDT: "ATOM", FTMUSDT: "FTM", INJUSDT: "INJ",
  SUIUSDT: "SUI", APTUSDT: "APT", RNDRUSDT: "RNDR", FETUSDT: "FET",
  GRTUSDT: "GRT", FILUSDT: "FIL", PEPEUSDT: "PEPE", BONKUSDT: "BONK",
  WIFUSDT: "WIF",
};

const formatPrice = (price: number): string => {
  if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const POLL_INTERVAL = 2000; // 2 seconds

export function useWebSocketPrices() {
  const queryClient = useQueryClient();
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchPrices = async () => {
      if (!activeRef.current) return;

      try {
        const { data, error } = await supabase.functions.invoke("binance-prices", {
          body: {},
        });

        if (error || !data?.prices) {
          console.warn("[PriceFeed] Edge function error:", error);
          return;
        }

        const now = new Date();

        queryClient.setQueryData(
          ["marketPrices"],
          (old: { priceMap: Record<string, any>; lastSyncError: string | null } | undefined) => {
            if (!old) return old;
            const updated = { ...old.priceMap };

            for (const tick of data.prices) {
              const symbol = BINANCE_TO_SYMBOL[tick.symbol];
              if (!symbol) continue;

              const existing = updated[symbol];
              const changePercent = tick.change24h ?? existing?.changePercent ?? 0;
              const changeStr = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;

              const entry = {
                symbol,
                name: existing?.name ?? symbol,
                price: formatPrice(tick.price),
                priceNumeric: tick.price,
                change: changeStr,
                changePercent,
                volume: tick.volume ? formatVolume(tick.volume) : existing?.volume ?? "$0",
                volumeNumeric: tick.volume ?? existing?.volumeNumeric ?? 0,
                marketCap: existing?.marketCap ?? 0,
                trend: changePercent >= 0 ? "up" as const : "down" as const,
                lastUpdate: now,
                high24h: tick.high24h ?? existing?.high24h,
                low24h: tick.low24h ?? existing?.low24h,
              };

              updated[symbol] = entry;
              updated[`${symbol}/USD`] = entry;
            }

            return { priceMap: updated, lastSyncError: null };
          }
        );
      } catch (err) {
        console.warn("[PriceFeed] Fetch error:", err);
      }

      if (activeRef.current) {
        timer = setTimeout(fetchPrices, POLL_INTERVAL);
      }
    };

    // Start after a brief delay to let initial data load
    timer = setTimeout(fetchPrices, 1000);

    return () => {
      activeRef.current = false;
      if (timer) clearTimeout(timer);
    };
  }, [queryClient]);
}
