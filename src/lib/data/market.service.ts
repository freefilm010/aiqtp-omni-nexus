/**
 * Market Data Access Layer
 * Central service for market_prices queries.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ServiceResult, MarketPrice, MarketPriceRow } from "./types";

function toMarketPrice(row: MarketPriceRow): MarketPrice {
  return {
    coinId: row.coin_id,
    symbol: null, // market_prices table has no symbol column; use coin_id mapping
    priceUsd: Number(row.price_usd) || 0,
    marketCap: row.market_cap ? Number(row.market_cap) : null,
    volume: row.total_volume ? Number(row.total_volume) : null,
    change24h: row.price_change_percentage_24h != null ? Number(row.price_change_percentage_24h) : null,
    change7d: row.price_change_percentage_7d != null ? Number(row.price_change_percentage_7d) : null,
    high24h: row.high_24h ? Number(row.high_24h) : null,
    low24h: row.low_24h ? Number(row.low_24h) : null,
    lastUpdated: row.last_updated ?? "",
  };
}

/** Fetch all market prices (latest snapshot). */
export async function getAllMarketPrices(): Promise<ServiceResult<MarketPrice[]>> {
  const { data, error } = await supabase
    .from("market_prices")
    .select("*")
    .order("market_cap", { ascending: false, nullsFirst: false });

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map(toMarketPrice), error: null };
}

/** Fetch a single market price by coin_id (e.g. "bitcoin"). */
export async function getMarketPrice(coinId: string): Promise<ServiceResult<MarketPrice | null>> {
  const { data, error } = await supabase
    .from("market_prices")
    .select("*")
    .eq("coin_id", coinId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: toMarketPrice(data), error: null };
}

/** Check if market data is stale (older than threshold). */
export function isMarketDataStale(lastUpdated: string, thresholdMs = 5 * 60 * 1000): boolean {
  return (Date.now() - new Date(lastUpdated).getTime()) > thresholdMs;
}
