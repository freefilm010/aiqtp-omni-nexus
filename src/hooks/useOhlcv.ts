import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Candles come from the platform venue through the backend. No third-party feeds. */
async function fetchCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const { data, error } = await supabase.functions.invoke("ccxt-trading", {
    body: { action: "fetch_ohlcv", symbol, timeframe: interval, limit },
  });
  if (error) throw error;
  if (!data?.success || !Array.isArray(data?.data)) {
    throw new Error(data?.error || "market data unavailable");
  }
  return (data.data as any[]).map((r) => ({
    timestamp: new Date(Number(r.timestamp)),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  }));
}

/** Real exchange OHLCV. No synthetic fallback — an error surfaces as an error. */
export function useOhlcv(symbol: string, interval = "1h", limit = 300) {
  return useQuery({
    queryKey: ["ohlcv", symbol, interval, limit],
    queryFn: () => fetchCandles(symbol, interval, limit),
    staleTime: 5_000,
    refetchInterval: 30_000,
  });
}
