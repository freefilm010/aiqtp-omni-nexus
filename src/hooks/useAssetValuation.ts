import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { tokenService } from "@/lib/data";

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
  lastUpdated: string | null;
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
      const result = await tokenService.getPlatformTokenPrices();
      if (result.error || !result.data) {
        setPlatformTokenPrices({});
        return;
      }

      setPlatformTokenPrices(
        Object.fromEntries(
          Object.entries(result.data).map(([symbol, feed]) => [
            symbol,
            { price: feed.price, change24h: feed.change24hPercent },
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
      const priceUnavailable = priceUsd === 0 && !STABLECOINS.has(upper);

      // Detect staleness: if last market price update is older than 5 minutes
      let isStale = false;
      if (marketPrice) {
        const lastUpdate = marketPrice.lastUpdate;
        if (lastUpdate && (Date.now() - new Date(lastUpdate).getTime()) > 5 * 60 * 1000) {
          isStale = true;
        }
      }

      return { symbol: upper, quantity, priceUsd, valueUsd, valueUsdt, change24h, isLive: live, isStale, priceUnavailable, isTestnet: false };
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
