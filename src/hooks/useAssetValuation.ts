import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMarketPrices } from "@/hooks/useMarketPrices";

const TESTNET_TOKENS = new Set([
  "TUSDC",
  "TUSDT",
  "TDAI",
  "TBUSD",
  "TETH",
  "TBTC",
  "TSOL",
  "TMATIC",
  "TAVAX",
  "TUNI",
  "TAAVE",
  "TLINK",
]);

const STABLECOINS = new Set(["USDC", "USDT", "DAI", "BUSD"]);

/** USDT is pegged ~1:1 to USD */
const USDT_USD_RATIO = 1.0;

interface PlatformTokenFeed {
  price: number;
  change24h: number | null;
}

export interface AssetValuation {
  symbol: string;
  quantity: number;
  priceUsd: number;
  valueUsd: number;
  valueUsdt: number;
  change24h: number | null;
  isLive: boolean;
  /** true when price feed exists but data is older than 5 minutes */
  isStale: boolean;
  /** true when no price data exists at all (not testnet, not stablecoin fallback) */
  priceUnavailable: boolean;
  /** true when this is a testnet/faucet token with $0 value */
  isTestnet: boolean;
}

/**
 * Converts any asset quantity to USD and USDT values using real-time market prices.
 * Falls back to platform token prices for non-listed tokens.
 */
export function useAssetValuation() {
  const { getPrice, isLive, loading } = useMarketPrices(30000);
  const [platformTokenPrices, setPlatformTokenPrices] = useState<Record<string, PlatformTokenFeed>>({});

  const loadPlatformTokenPrices = useCallback(async () => {
    try {
      const [tokensRes, feedsRes] = await Promise.all([
        supabase.from("platform_tokens").select("id, symbol").eq("is_active", true),
        supabase
          .from("token_price_feeds")
          .select("token_id, price, change_24h_percent, last_updated")
          .eq("base_currency", "USD"),
      ]);

      if (tokensRes.error || feedsRes.error) return;

      const symbolById = new Map<string, string>(
        (tokensRes.data ?? []).map((token) => [token.id, token.symbol.toUpperCase()])
      );

      const latestBySymbol: Record<string, PlatformTokenFeed & { updatedAt: number }> = {};

      for (const feed of feedsRes.data ?? []) {
        const symbol = symbolById.get(String(feed.token_id ?? ""));
        if (!symbol) continue;

        const updatedAt = feed.last_updated ? new Date(feed.last_updated).getTime() : 0;
        const current = latestBySymbol[symbol];

        if (!current || updatedAt >= current.updatedAt) {
          latestBySymbol[symbol] = {
            price: Number(feed.price ?? 0),
            change24h: feed.change_24h_percent == null ? null : Number(feed.change_24h_percent),
            updatedAt,
          };
        }
      }

      setPlatformTokenPrices(
        Object.fromEntries(
          Object.entries(latestBySymbol).map(([symbol, feed]) => [
            symbol,
            { price: feed.price, change24h: feed.change24h },
          ])
        )
      );
    } catch {
      setPlatformTokenPrices({});
    }
  }, []);

  useEffect(() => {
    loadPlatformTokenPrices();

    const channel = supabase
      .channel("platform-token-prices-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "token_price_feeds" },
        () => {
          loadPlatformTokenPrices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPlatformTokenPrices]);

  const getValuation = useCallback(
    (symbol: string, quantity: number): AssetValuation => {
      const upper = symbol.toUpperCase();
      
      // Testnet tokens (t-prefixed) have $0 value — they are not real assets
      if (TESTNET_TOKENS.has(upper)) {
        return { symbol: upper, quantity, priceUsd: 0, valueUsd: 0, valueUsdt: 0, change24h: null, isLive: false, isStale: false, priceUnavailable: false, isTestnet: true };
      }

      const marketPrice = getPrice(upper);
      const platformTokenPrice = platformTokenPrices[upper];

      let priceUsd = 0;
      let change24h: number | null = null;
      let live = false;

      if (marketPrice) {
        priceUsd = marketPrice.priceNumeric;
        change24h = marketPrice.changePercent;
        live = isLive;
      } else if (platformTokenPrice) {
        priceUsd = platformTokenPrice.price;
        change24h = platformTokenPrice.change24h;
        live = true;
      }

      // Stablecoins default to $1
      if (STABLECOINS.has(upper) && priceUsd === 0) {
        priceUsd = 1;
      }

      const valueUsd = quantity * priceUsd;
      const valueUsdt = valueUsd / USDT_USD_RATIO;

      return { symbol: upper, quantity, priceUsd, valueUsd, valueUsdt, change24h, isLive: live };
    },
    [getPrice, isLive, platformTokenPrices]
  );

  const getPortfolioValuation = useCallback(
    (holdings: Record<string, number>): { items: AssetValuation[]; totalUsd: number; totalUsdt: number } => {
      const items = Object.entries(holdings).map(([symbol, qty]) => getValuation(symbol, qty));
      const totalUsd = items.reduce((s, v) => s + v.valueUsd, 0);
      const totalUsdt = items.reduce((s, v) => s + v.valueUsdt, 0);
      return { items, totalUsd, totalUsdt };
    },
    [getValuation]
  );

  return { getValuation, getPortfolioValuation, loading };
}

/** Format USD value compactly */
export const formatUsdValue = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value > 0) return `$${value.toFixed(4)}`;
  return "$0.00";
};

/** Format quantity based on magnitude */
export const formatQuantity = (qty: number): string => {
  if (qty >= 1_000_000) return `${(qty / 1_000_000).toFixed(2)}M`;
  if (qty >= 10_000) return `${(qty / 1_000).toFixed(1)}K`;
  if (qty >= 1) return qty.toFixed(2);
  if (qty >= 0.001) return qty.toFixed(4);
  return qty.toFixed(6);
};
