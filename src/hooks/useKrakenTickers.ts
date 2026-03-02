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

/**
 * Live ticker hook — uses BTCC exchange (user's configured API keys)
 * with Binance as automatic fallback for public market data.
 */
export function useKrakenTickers(symbols: string[] = [...DEFAULT_SYMBOLS], pollMs = 12_000) {
  const [tickers, setTickers] = useState<Record<string, KrakenTickerQuote>>({});
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const fetchOne = async (sym: string): Promise<KrakenTickerQuote | null> => {
      // Try BTCC first (user's configured exchange)
      try {
        const btccSymbol = sym.replace("/", "");
        const { data, error } = await supabase.functions.invoke("btcc-trading", {
          body: { action: "fetch_ticker", market: "spot", symbol: btccSymbol },
        });

        if (!error && data?.success && data?.data) {
          const t = data.data;
          return {
            symbol: sym,
            lastPrice: Number(t.last) || 0,
            priceChangePercent: Number(t.changePercent) || 0,
            volume: Number(t.volume) || 0,
            lastUpdate: new Date(),
          };
        }
      } catch {
        // BTCC failed, fall through to Binance
      }

      // Fallback: CoinGecko public API (no geo-restrictions, no key required)
      try {
        const cgId: Record<string, string> = {
          "BTC/USDT": "bitcoin", "ETH/USDT": "ethereum", "SOL/USDT": "solana",
          "XRP/USDT": "ripple", "ADA/USDT": "cardano", "AVAX/USDT": "avalanche-2",
          "LINK/USDT": "chainlink", "DOGE/USDT": "dogecoin",
        };
        const id = cgId[sym];
        if (id) {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
          );
          if (res.ok) {
            const json = await res.json();
            const d = json[id];
            if (d) {
              return {
                symbol: sym,
                lastPrice: Number(d.usd) || 0,
                priceChangePercent: Number(d.usd_24h_change) || 0,
                volume: Number(d.usd_24h_vol) || 0,
                lastUpdate: new Date(),
              };
            }
          }
        }
      } catch {
        // skip
      }

      return null;
    };

    const fetchAll = async () => {
      const results: Record<string, KrakenTickerQuote> = {};

      // Fetch all symbols in parallel
      const promises = symbols.map(async (sym) => {
        const result = await fetchOne(sym);
        if (result && !cancelled && mountedRef.current) {
          results[sym] = result;
        }
      });

      await Promise.all(promises);

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
