/**
 * useRealtimeMarketPrices — debounced cache patching for market_prices.
 * Batches updates every 500ms to prevent render thrash.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeMarketPrices() {
  const queryClient = useQueryClient();
  const bufferRef = useRef(new Map<string, Record<string, unknown>>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const flush = () => {
      if (bufferRef.current.size === 0) return;

      // Invalidate the marketPrices query so useMarketPrices rebuilds from DB
      queryClient.invalidateQueries({ queryKey: ["marketPrices"] });
      bufferRef.current.clear();
      timeoutRef.current = null;
    };

    const scheduleFlush = () => {
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(flush, 500);
      }
    };

    const channel = supabase
      .channel(`market-prices-debounced-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "market_prices",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const coinId = String(row.coin_id ?? "");
          if (coinId) {
            bufferRef.current.set(coinId, row);
            scheduleFlush();
          }
        }
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
