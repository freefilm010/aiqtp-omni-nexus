import { useQuery } from "@tanstack/react-query";

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const ENDPOINTS = [
  (s: string, i: string, l: number) =>
    `https://api.binance.com/api/v3/klines?symbol=${s}&interval=${i}&limit=${l}`,
  (s: string, i: string, l: number) =>
    `https://data-api.binance.vision/api/v3/klines?symbol=${s}&interval=${i}&limit=${l}`,
];

async function fetchCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  let lastErr: unknown;
  for (const build of ENDPOINTS) {
    try {
      const res = await fetch(build(symbol, interval, limit));
      if (!res.ok) throw new Error(`klines ${res.status}`);
      const rows = (await res.json()) as unknown[][];
      return rows.map((r) => ({
        timestamp: new Date(Number(r[0])),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
        volume: Number(r[5]),
      }));
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("market data unavailable");
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
