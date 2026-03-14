import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketPrice {
  symbol: string;
  name: string;
  price: string;
  priceNumeric: number;
  change: string;
  changePercent: number;
  volume: string;
  volumeNumeric: number;
  marketCap: number;
  trend: "up" | "down";
  lastUpdate: Date;
}

// Symbol to CoinGecko ID mapping
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDC: "usd-coin",
  USDT: "tether",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  MATIC: "matic-network",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  PEPE: "pepe",
  BONK: "bonk",
  WIF: "dogwifcoin",
  LTC: "litecoin",
  NEAR: "near",
  ATOM: "cosmos",
  FTM: "fantom",
  INJ: "injective-protocol",
  SUI: "sui",
  APT: "aptos",
  RNDR: "render-token",
  FET: "fetch-ai",
  GRT: "the-graph",
  FIL: "filecoin",
};

const MIN_POLL_MS = 30_000;
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 2 * 60_000;

// Cross-hook memory to prevent spamming the provider when multiple widgets mount.
let lastGoodPriceMap: Record<string, MarketPrice> = {};
let cooldownUntilTs = 0;

const formatPrice = (price: number): string => {
  if (price >= 1000)
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
};

const formatVolume = (vol: number): string => {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
};

type MarketPricesResult = {
  priceMap: Record<string, MarketPrice>;
  lastSyncError: string | null;
};

const titleizeCoinId = (coinId: string) =>
  coinId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const buildPriceMapFromDbRows = (rows: any[]): Record<string, MarketPrice> => {
  const priceMap: Record<string, MarketPrice> = {};

  for (const row of rows) {
    const coinId = String(row.coin_id ?? "");
    const mappedSymbol = Object.entries(COINGECKO_IDS).find(([, id]) => id === coinId)?.[0];

    const symbol = String((row.market_coins?.symbol ?? mappedSymbol ?? "UNKNOWN")).toUpperCase();
    const name = String(row.market_coins?.name ?? (coinId ? titleizeCoinId(coinId) : symbol));

    const priceUsd = Number(row.price_usd ?? 0);
    const change = Number(row.price_change_percentage_24h ?? 0);
    const vol = Number(row.total_volume ?? 0);
    const marketCap = Number(row.market_cap ?? 0);

    priceMap[symbol] = {
      symbol,
      name,
      price: formatPrice(priceUsd),
      priceNumeric: priceUsd,
      change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
      changePercent: change,
      volume: formatVolume(vol),
      volumeNumeric: vol,
      marketCap,
      trend: change >= 0 ? "up" : "down",
      lastUpdate: new Date(row.last_updated || Date.now()),
    };

    // Compatibility key used across the app
    priceMap[`${symbol}/USD`] = priceMap[symbol];
  }

  return priceMap;
};

const fetchFromDatabase = async (): Promise<Record<string, MarketPrice> | null> => {
  try {
    const { data: cachedPrices, error } = await supabase
      .from("market_prices")
      .select(
        `
        coin_id,
        price_usd,
        price_change_percentage_24h,
        total_volume,
        market_cap,
        last_updated,
        market_coins(symbol, name)
      `
      )
      .in("coin_id", Object.values(COINGECKO_IDS))
      .order("market_cap", { ascending: false, nullsFirst: false });

    if (error) return null;
    if (!cachedPrices || cachedPrices.length === 0) return null;

    const mapped = buildPriceMapFromDbRows(cachedPrices);
    return Object.keys(mapped).length > 0 ? mapped : null;
  } catch {
    return null;
  }
};

const fetchFromAPI = async (): Promise<
  | { ok: true; priceMap: Record<string, MarketPrice> }
  | { ok: false; error: string; rateLimited: boolean; retryAfterMs?: number }
> => {
  try {
    const coinIds = Object.values(COINGECKO_IDS).slice(0, 20);

    const { data, error } = await supabase.functions.invoke("market-data-sync", {
      body: {
        action: "get_price",
        params: { coinIds },
      },
    });

    // If the backend returns non-2xx, supabase-js surfaces it as `error`
    if (error) {
      const msg = error.message || "Failed to fetch prices";
      const rateLimited = /429/.test(msg) || /rate limit/i.test(msg);
      return { ok: false, error: msg, rateLimited };
    }

    if (!data?.success || !data?.prices) {
      const msg = String(data?.error || "Failed to fetch prices");
      const rateLimited = Boolean(data?.rateLimited) || /429/.test(msg) || /rate limit/i.test(msg);
      const retryAfterMs = typeof data?.retryAfterMs === "number" ? data.retryAfterMs : undefined;
      return { ok: false, error: msg, rateLimited, retryAfterMs };
    }

    const priceMap: Record<string, MarketPrice> = {};

    for (const [coinId, priceData] of Object.entries(data.prices) as [string, any][]) {
      const symbol = Object.entries(COINGECKO_IDS).find(([, id]) => id === coinId)?.[0];
      if (!symbol) continue;

      const change = Number(priceData.usd_24h_change ?? 0);
      const priceUsd = Number(priceData.usd ?? 0);
      const vol = Number(priceData.usd_24h_vol ?? 0);
      const marketCap = Number(priceData.usd_market_cap ?? 0);

      priceMap[symbol] = {
        symbol,
        name: titleizeCoinId(coinId),
        price: formatPrice(priceUsd),
        priceNumeric: priceUsd,
        change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        changePercent: change,
        volume: formatVolume(vol),
        volumeNumeric: vol,
        marketCap,
        trend: change >= 0 ? "up" : "down",
        lastUpdate: new Date(),
      };

      priceMap[`${symbol}/USD`] = priceMap[symbol];
    }

    return { ok: true, priceMap };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch prices";
    const rateLimited = /429/.test(msg) || /rate limit/i.test(msg);
    return { ok: false, error: msg, rateLimited };
  }
};

const loadMarketPrices = async (): Promise<MarketPricesResult> => {
  const dbMap = await fetchFromDatabase();
  if (dbMap && Object.keys(dbMap).length > 0) {
    lastGoodPriceMap = dbMap;
    cooldownUntilTs = 0;
    return { priceMap: dbMap, lastSyncError: null };
  }

  const now = Date.now();
  if (now < cooldownUntilTs) {
    const seconds = Math.max(1, Math.ceil((cooldownUntilTs - now) / 1000));
    return {
      priceMap: lastGoodPriceMap,
      lastSyncError: `Rate limited — retrying in ${seconds}s`,
    };
  }

  const api = await fetchFromAPI();

  if (api.ok) {
    if (Object.keys(api.priceMap).length > 0) lastGoodPriceMap = api.priceMap;
    cooldownUntilTs = 0;
    return { priceMap: lastGoodPriceMap, lastSyncError: null };
  } else {
    const failure = api as {
      ok: false;
      error: string;
      rateLimited: boolean;
      retryAfterMs?: number;
    };

    if (failure.rateLimited) {
      cooldownUntilTs = now + (failure.retryAfterMs ?? DEFAULT_RATE_LIMIT_COOLDOWN_MS);
    }

    return {
      priceMap: lastGoodPriceMap,
      lastSyncError: failure.error,
    };
  }
};

export const useMarketPrices = (pollIntervalMs: number = 30000) => {
  const [isLive, setIsLive] = useState(true);

  const effectivePollInterval = useMemo(
    () => Math.max(MIN_POLL_MS, pollIntervalMs),
    [pollIntervalMs]
  );

  const query = useQuery({
    queryKey: ["marketPrices"],
    queryFn: loadMarketPrices,
    enabled: isLive,
    refetchInterval: isLive ? effectivePollInterval : false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const prices = query.data?.priceMap ?? lastGoodPriceMap;
  const lastSyncError = query.data?.lastSyncError ?? null;
  const loading = query.isLoading;

  const getPrice = useCallback(
    (symbol: string): MarketPrice | undefined => {
      const normalizedSymbol = symbol.toUpperCase().replace("/USD", "");
      return prices[normalizedSymbol] || prices[symbol];
    },
    [prices]
  );

  const getAllPrices = useCallback((): MarketPrice[] => {
    const seen = new Set<string>();
    return Object.values(prices).filter((p) => {
      if (seen.has(p.symbol) || p.symbol.includes("/")) return false;
      seen.add(p.symbol);
      return true;
    });
  }, [prices]);

  const toggleLive = () => setIsLive((v) => !v);

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    prices,
    getPrice,
    getAllPrices,
    isLive,
    toggleLive,
    lastSyncError,
    loading,
    refresh,
  };
};

