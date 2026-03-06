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
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT",
  "AVAX/USDT", "LINK/USDT", "DOGE/USDT", "DOT/USDT", "MATIC/USDT",
  "UNI/USDT", "ATOM/USDT", "FIL/USDT", "LTC/USDT", "NEAR/USDT",
  "APT/USDT", "ARB/USDT", "OP/USDT", "AAVE/USDT", "MKR/USDT",
  "ALGO/USDT", "XLM/USDT", "ICP/USDT", "HBAR/USDT", "VET/USDT",
  "SAND/USDT", "MANA/USDT", "FTM/USDT", "RUNE/USDT", "INJ/USDT",
] as const;

const CG_ID_MAP: Record<string, string> = {
  "BTC/USDT": "bitcoin", "ETH/USDT": "ethereum", "SOL/USDT": "solana",
  "XRP/USDT": "ripple", "ADA/USDT": "cardano", "AVAX/USDT": "avalanche-2",
  "LINK/USDT": "chainlink", "DOGE/USDT": "dogecoin", "DOT/USDT": "polkadot",
  "MATIC/USDT": "matic-network", "UNI/USDT": "uniswap", "ATOM/USDT": "cosmos",
  "FIL/USDT": "filecoin", "LTC/USDT": "litecoin", "NEAR/USDT": "near",
  "APT/USDT": "aptos", "ARB/USDT": "arbitrum", "OP/USDT": "optimism",
  "AAVE/USDT": "aave", "MKR/USDT": "maker", "ALGO/USDT": "algorand",
  "XLM/USDT": "stellar", "ICP/USDT": "internet-computer", "HBAR/USDT": "hedera-hashgraph",
  "VET/USDT": "vechain", "SAND/USDT": "the-sandbox", "MANA/USDT": "decentraland",
  "FTM/USDT": "fantom", "RUNE/USDT": "thorchain", "INJ/USDT": "injective-protocol",
};

/**
 * Live ticker hook — batches all symbols into a single CoinGecko request
 * to avoid rate-limiting. BTCC API is deprecated (closed Feb 2026).
 */
export function useKrakenTickers(symbols: string[] = [...DEFAULT_SYMBOLS], pollMs = 15_000) {
  const [tickers, setTickers] = useState<Record<string, KrakenTickerQuote>>({});
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const fetchAll = async () => {
      // Build a single batched CoinGecko request for all symbols
      const ids = symbols
        .map((s) => CG_ID_MAP[s])
        .filter(Boolean);

      if (ids.length === 0) return;

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        );
        if (!res.ok) return;
        const json = await res.json();

        if (cancelled || !mountedRef.current) return;

        const results: Record<string, KrakenTickerQuote> = {};
        for (const sym of symbols) {
          const cgId = CG_ID_MAP[sym];
          const d = cgId ? json[cgId] : null;
          if (d) {
            results[sym] = {
              symbol: sym,
              lastPrice: Number(d.usd) || 0,
              priceChangePercent: Number(d.usd_24h_change) || 0,
              volume: Number(d.usd_24h_vol) || 0,
              lastUpdate: new Date(),
            };
          }
        }

        setTickers((prev) => ({ ...prev, ...results }));
        setConnected(Object.keys(results).length > 0);
      } catch {
        // Network error — keep previous data
      }
    };

    fetchAll();
    timerRef.current = window.setInterval(fetchAll, Math.max(10_000, pollMs));

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [symbols.join("|"), pollMs]);

  return { tickers, connected };
}
