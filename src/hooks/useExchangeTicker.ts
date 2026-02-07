import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ExchangeTicker = {
  last: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
  changePercent: number;
  timestamp?: number;
};

export function useExchangeTicker(params: {
  exchange: "binance" | "kraken";
  symbol: string;
  pollMs?: number;
}) {
  const { exchange, symbol, pollMs = 10_000 } = params;

  const [ticker, setTicker] = useState<ExchangeTicker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdatedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("ccxt-trading", {
          body: { action: "fetch_ticker", exchange, symbol },
        });

        if (cancelled) return;
        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || "Failed to fetch ticker");

        const t = data.data;
        const next: ExchangeTicker = {
          last: Number(t.last ?? 0),
          high: Number(t.high ?? 0),
          low: Number(t.low ?? 0),
          volume: Number(t.volume ?? 0),
          quoteVolume: Number(t.quoteVolume ?? 0),
          changePercent: Number(t.changePercent ?? 0),
          timestamp: Number(t.timestamp ?? Date.now()),
        };

        if (!Number.isFinite(next.last) || next.last <= 0) {
          throw new Error("Ticker response missing last price");
        }

        lastUpdatedAtRef.current = Date.now();
        setTicker(next);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to fetch ticker");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    run();
    const id = window.setInterval(run, Math.max(2500, pollMs));

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [exchange, symbol, pollMs]);

  const lastUpdatedAt = lastUpdatedAtRef.current;
  const isLive = lastUpdatedAt ? Date.now() - lastUpdatedAt < pollMs * 2.5 : false;

  return { ticker, loading, error, lastUpdatedAt, isLive };
}
