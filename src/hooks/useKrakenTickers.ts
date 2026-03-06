import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface KrakenTickerQuote {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  volume: number;
  marketCap: number;
  lastUpdate: Date;
}

// ──────────────────────────────────────────────────────────────
// FULLY DATABASE-DRIVEN TICKER SYSTEM
// No hardcoded symbol limits. Pulls ALL coins from the DB.
// ──────────────────────────────────────────────────────────────

/**
 * Live ticker hook — pulls prices from the database (market_prices table)
 * and refreshes via the market-data-sync edge function.
 *
 * @param filterSymbols  Optional array of "BTC/USDT"-style symbols to filter.
 *                       If omitted, returns ALL coins in the database.
 * @param pollMs         Polling interval (default 45s, min 15s).
 */
export function useKrakenTickers(
  filterSymbols?: string[],
  pollMs = 45_000
) {
  const [tickers, setTickers] = useState<Record<string, KrakenTickerQuote>>({});
  const [connected, setConnected] = useState(false);
  const [totalCoins, setTotalCoins] = useState(0);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const lastEdgeFetchRef = useRef(0);

  // ── DB-first: load ALL prices from market_prices ──
  const loadFromDB = useCallback(async () => {
    try {
      // Query all prices, ordered by market cap
      const { data, error } = await supabase
        .from("market_prices")
        .select(`
          coin_id,
          price_usd,
          price_change_percentage_24h,
          total_volume,
          market_cap,
          last_updated
        `)
        .order("market_cap", { ascending: false, nullsFirst: false })
        .limit(1000);

      if (error || !data || data.length === 0) return false;

      // Also get the symbol mapping from market_coins
      const coinIds = data.map(r => r.coin_id);
      const { data: coins } = await supabase
        .from("market_coins")
        .select("id, symbol")
        .in("id", coinIds);

      const symbolMap: Record<string, string> = {};
      if (coins) {
        for (const c of coins) {
          symbolMap[c.id] = c.symbol?.toUpperCase() || c.id.toUpperCase();
        }
      }

      if (!mountedRef.current) return false;

      const result: Record<string, KrakenTickerQuote> = {};

      for (const row of data) {
        const baseSymbol = symbolMap[row.coin_id] || row.coin_id.toUpperCase();
        const pairSymbol = `${baseSymbol}/USDT`;

        // If filtering, skip non-matching
        if (filterSymbols && filterSymbols.length > 0) {
          if (!filterSymbols.includes(pairSymbol)) continue;
        }

        result[pairSymbol] = {
          symbol: pairSymbol,
          lastPrice: Number(row.price_usd) || 0,
          priceChangePercent: Number(row.price_change_percentage_24h) || 0,
          volume: Number(row.total_volume) || 0,
          marketCap: Number(row.market_cap) || 0,
          lastUpdate: new Date(row.last_updated || Date.now()),
        };
      }

      setTickers(prev => ({ ...prev, ...result }));
      setTotalCoins(Object.keys(result).length);
      setConnected(Object.keys(result).length > 0);
      return true;
    } catch {
      return false;
    }
  }, [filterSymbols?.join("|")]);

  // ── Refresh prices via edge function (server-side CoinGecko proxy) ──
  const refreshFromEdge = useCallback(async () => {
    const now = Date.now();
    // Don't hit the edge function more than once per 30s
    if (now - lastEdgeFetchRef.current < 30_000) return;
    lastEdgeFetchRef.current = now;

    try {
      // Get top coin IDs from market_coins to refresh
      const { data: topCoins } = await supabase
        .from("market_coins")
        .select("id")
        .eq("is_active", true)
        .order("market_cap_rank", { ascending: true, nullsFirst: false })
        .limit(500);

      if (!topCoins || topCoins.length === 0) return;

      const allIds = topCoins.map(c => c.id);

      // Batch into groups of 50
      for (let i = 0; i < allIds.length; i += 50) {
        if (!mountedRef.current) return;

        const batch = allIds.slice(i, i + 50);
        try {
          await supabase.functions.invoke("market-data-sync", {
            body: { action: "get_price", params: { coinIds: batch } },
          });
        } catch {
          // Rate limited or error — continue with DB data
          break;
        }

        // Small delay between batches to avoid rate limits
        if (i + 50 < allIds.length) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      // Reload from DB after edge function updates
      if (mountedRef.current) {
        await loadFromDB();
      }
    } catch {
      // Edge function unavailable — DB data still serves
    }
  }, [loadFromDB]);

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      // 1. Immediate: load from DB cache (instant)
      const hasData = await loadFromDB();

      // 2. Background: refresh via edge function
      if (mountedRef.current) {
        refreshFromEdge();
      }
    };

    init();

    // Poll: reload from DB periodically, refresh from edge less frequently
    let pollCount = 0;
    timerRef.current = window.setInterval(() => {
      pollCount++;
      loadFromDB();
      // Refresh from edge every 3rd poll
      if (pollCount % 3 === 0) {
        refreshFromEdge();
      }
    }, Math.max(15_000, pollMs));

    return () => {
      mountedRef.current = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [loadFromDB, refreshFromEdge, pollMs]);

  return { tickers, connected, totalCoins };
}
