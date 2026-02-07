import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface KrakenTickerQuote {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  volume: number;
  lastUpdate: Date;
}

const DEFAULT_SYMBOLS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "AVAX/USDT",
  "LINK/USDT",
  "DOGE/USDT",
] as const;

export function useKrakenTickers(symbols: string[] = [...DEFAULT_SYMBOLS], pollMs = 12_000) {
  const [tickers, setTickers] = useState<Record<string, KrakenTickerQuote>>({});
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const fetchAll = async () => {
      const results: Record<string, KrakenTickerQuote> = {};

      for (const sym of symbols) {
        try {
          const { data, error } = await supabase.functions.invoke("ccxt-trading", {
            body: { action: "fetch_ticker", exchange: "kraken", symbol: sym },
          });

          if (cancelled || !mountedRef.current) return;

          if (!error && data?.success && data?.data) {
            const t = data.data;
            results[sym] = {
              symbol: sym,
              lastPrice: Number(t.last) || 0,
              priceChangePercent: Number(t.changePercent) || 0,
              volume: Number(t.volume) || 0,
              lastUpdate: new Date(),
            };
          }
        } catch {
          // skip
        }
      }

      if (cancelled || !mountedRef.current) return;

      setTickers((prev) => ({ ...prev, ...results }));
      setConnected(Object.keys(results).length > 0);
    };

    fetchAll();
    timerRef.current = window.setInterval(fetchAll, Math.max(5_000, pollMs));

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [symbols.join("|"), pollMs]);

  return { tickers, connected };
}
