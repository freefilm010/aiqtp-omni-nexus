/**
 * Market Data Access Layer
 * Central service for market_prices queries.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ServiceResult, MarketPrice } from "./types";

/** Fetch all market prices (latest snapshot). */
export async function getAllMarketPrices(): Promise<ServiceResult<MarketPrice[]>> {
  const { data, error } = await supabase
    .from("market_prices")
    .select("*")
    .order("market_cap", { ascending: false, nullsFirst: false }) as any;

  if (error) return { data: null, error: error.message };

  const prices: MarketPrice[] = (data ?? []).map((row: any) => ({
    coinId: row.coin_id,
    symbol: row.symbol ?? null,
    priceUsd: Number(row.price_usd) || 0,
    marketCap: row.market_cap ? Number(row.market_cap) : null,
    volume: row.total_volume ? Number(row.total_volume) : null,
    change24h: row.price_change_percentage_24h != null ? Number(row.price_change_percentage_24h) : null,
    change7d: row.price_change_percentage_7d != null ? Number(row.price_change_percentage_7d) : null,
    high24h: row.high_24h ? Number(row.high_24h) : null,
    low24h: row.low_24h ? Number(row.low_24h) : null,
    lastUpdated: row.last_updated ?? row.created_at,
  }));

  return { data: prices, error: null };
}

/** Fetch a single market price by coin_id (e.g. "bitcoin"). */
export async function getMarketPrice(coinId: string): Promise<ServiceResult<MarketPrice | null>> {
  const { data, error } = await supabase
    .from("market_prices")
    .select("*")
    .eq("coin_id", coinId)
    .maybeSingle() as any;

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return {
    data: {
      coinId: data.coin_id,
      symbol: data.symbol ?? null,
      priceUsd: Number(data.price_usd) || 0,
      marketCap: data.market_cap ? Number(data.market_cap) : null,
      volume: data.total_volume ? Number(data.total_volume) : null,
      change24h: data.price_change_percentage_24h != null ? Number(data.price_change_percentage_24h) : null,
      change7d: data.price_change_percentage_7d != null ? Number(data.price_change_percentage_7d) : null,
      high24h: data.high_24h ? Number(data.high_24h) : null,
      low24h: data.low_24h ? Number(data.low_24h) : null,
      lastUpdated: data.last_updated ?? data.created_at,
    },
    error: null,
  };
}

/** Check if market data is stale (older than threshold). */
export function isMarketDataStale(lastUpdated: string, thresholdMs = 5 * 60 * 1000): boolean {
  return (Date.now() - new Date(lastUpdated).getTime()) > thresholdMs;
}
