import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TradingStats {
  allTimeProfit: number;
  todayProfit: number;
  totalTrades: number;
  winRate: number;
  avgProfit: number;
}

const CACHE_KEY = "aiqtp_trading_stats_cache";
const CACHE_TTL_MS = 30_000;

let _memCache: { data: TradingStats; ts: number } | null = null;

function readSessionCache(): TradingStats | null {
  if (_memCache && Date.now() - _memCache.ts < CACHE_TTL_MS) return _memCache.data;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: TradingStats; ts: number };
    if (Date.now() - ts < CACHE_TTL_MS) return data;
  } catch { /* ignore */ }
  return null;
}

function writeCache(data: TradingStats): void {
  _memCache = { data, ts: Date.now() };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

export function useTradingStats(refetchInterval = 30_000) {
  const [data, setData] = useState<TradingStats | null>(() => readSessionCache());
  const [isLoading, setIsLoading] = useState(!readSessionCache());

  const fetchStats = useCallback(async () => {
    const cached = readSessionCache();
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allRes, todayRes] = await Promise.all([
      supabase
        .from("trade_logs")
        .select("realized_pnl_usd")
        .eq("status", "closed")
        .not("realized_pnl_usd", "is", null)
        .limit(50_000),
      supabase
        .from("trade_logs")
        .select("realized_pnl_usd")
        .eq("status", "closed")
        .gte("closed_at", today.toISOString())
        .not("realized_pnl_usd", "is", null),
    ]);

    const rows = (allRes.data ?? []).map((r: { realized_pnl_usd: number | null }) =>
      Number(r.realized_pnl_usd)
    );
    const totalTrades = rows.length;
    const winners = rows.filter((v) => v > 0);
    const allTimeProfit = winners.reduce((s, v) => s + v, 0);
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 100;
    const avgProfit = totalTrades > 0 ? allTimeProfit / totalTrades : 0;
    const todayProfit = (todayRes.data ?? [])
      .map((r: { realized_pnl_usd: number | null }) => Number(r.realized_pnl_usd))
      .filter((v) => v > 0)
      .reduce((s, v) => s + v, 0);

    const stats: TradingStats = { allTimeProfit, todayProfit, totalTrades, winRate, avgProfit };
    writeCache(stats);
    setData(stats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, refetchInterval);
    return () => clearInterval(id);
  }, [fetchStats, refetchInterval]);

  return { data, isLoading, refetch: fetchStats };
}
