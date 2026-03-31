import { useCallback, useMemo } from "react";
import { useMarketPrices } from "@/hooks/useMarketPrices";

/** Simulated prices for platform-only tokens that aren't on CoinGecko */
const PLATFORM_TOKEN_PRICES: Record<string, number> = {
  QTC: 0.85,
  AIQ: 0.42,
  NXS: 0.015,
  QAQI: 0.31,
  AIQTP: 0.18,
};

/** USDT is pegged ~1:1 to USD */
const USDT_USD_RATIO = 1.0;

export interface AssetValuation {
  symbol: string;
  quantity: number;
  priceUsd: number;
  valueUsd: number;
  valueUsdt: number;
  change24h: number | null;
  isLive: boolean;
}

/**
 * Converts any asset quantity to USD and USDT values using real-time market prices.
 * Falls back to platform token prices for non-listed tokens.
 */
export function useAssetValuation() {
  const { getPrice, isLive, loading } = useMarketPrices(30000);

  const getValuation = useCallback(
    (symbol: string, quantity: number): AssetValuation => {
      const upper = symbol.toUpperCase();
      
      // Testnet tokens (t-prefixed) have $0 value — they are not real assets
      if (upper.startsWith('T') && upper.length > 1 && ['TUSDC','TUSDT','TDAI','TBUSD','TETH','TBTC','TSOL','TMATIC','TAVAX','TUNI','TAAVE','TLINK'].includes(upper)) {
        return { symbol: upper, quantity, priceUsd: 0, valueUsd: 0, valueUsdt: 0, change24h: null, isLive: false };
      }

      const marketPrice = getPrice(upper);

      let priceUsd = 0;
      let change24h: number | null = null;
      let live = false;

      if (marketPrice) {
        priceUsd = marketPrice.priceNumeric;
        change24h = marketPrice.changePercent;
        live = isLive;
      } else if (PLATFORM_TOKEN_PRICES[upper] !== undefined) {
        priceUsd = PLATFORM_TOKEN_PRICES[upper];
        live = false;
      }

      // Stablecoins default to $1
      if (['USDC', 'USDT', 'DAI', 'BUSD'].includes(upper) && priceUsd === 0) {
        priceUsd = 1;
      }

      const valueUsd = quantity * priceUsd;
      const valueUsdt = valueUsd / USDT_USD_RATIO;

      return { symbol: upper, quantity, priceUsd, valueUsd, valueUsdt, change24h, isLive: live };
    },
    [getPrice, isLive]
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
