/**
 * Token Data Access Layer
 * Handles platform_tokens and token_price_feeds.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ServiceResult, PlatformToken, TokenPriceFeed } from "./types";

/** Fetch all active platform tokens. */
export async function getActivePlatformTokens(): Promise<ServiceResult<PlatformToken[]>> {
  const { data, error } = await supabase
    .from("platform_tokens")
    .select("id, symbol, name, is_active")
    .eq("is_active", true);

  if (error) return { data: null, error: error.message };

  return {
    data: (data ?? []).map((t) => ({
      id: t.id,
      symbol: String(t.symbol).toUpperCase(),
      name: t.name,
      isActive: t.is_active ?? true,
    })),
    error: null,
  };
}

/** Fetch USD price feeds for all platform tokens. Returns a map of SYMBOL → feed. */
export async function getPlatformTokenPrices(): Promise<ServiceResult<Record<string, TokenPriceFeed>>> {
  const [tokensRes, feedsRes] = await Promise.all([
    supabase.from("platform_tokens").select("id, symbol").eq("is_active", true),
    supabase.from("token_price_feeds").select("token_id, price, change_24h_percent, last_updated").eq("base_currency", "USD"),
  ]);

  if (tokensRes.error) return { data: null, error: tokensRes.error.message };
  if (feedsRes.error) return { data: null, error: feedsRes.error.message };

  const symbolById = new Map<string, string>(
    (tokensRes.data ?? []).map((t) => [t.id, String(t.symbol).toUpperCase()])
  );

  const result: Record<string, TokenPriceFeed> = {};

  for (const feed of feedsRes.data ?? []) {
    const symbol = symbolById.get(String(feed.token_id ?? ""));
    if (!symbol) continue;

    const updatedAt = feed.last_updated ? new Date(feed.last_updated).getTime() : 0;
    const existing = result[symbol];

    if (!existing || updatedAt >= new Date(existing.lastUpdated).getTime()) {
      result[symbol] = {
        tokenId: String(feed.token_id),
        symbol,
        price: Number(feed.price ?? 0),
        change24hPercent: feed.change_24h_percent != null ? Number(feed.change_24h_percent) : null,
        lastUpdated: feed.last_updated ?? new Date().toISOString(),
      };
    }
  }

  return { data: result, error: null };
}
