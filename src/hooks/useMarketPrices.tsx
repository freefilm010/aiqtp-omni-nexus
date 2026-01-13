import { useEffect, useMemo, useState, useCallback } from "react";
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

const formatPrice = (price: number): string => {
  if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export const useMarketPrices = (pollIntervalMs: number = 30000) => {
  const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
  const [isLive, setIsLive] = useState(true);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const effectivePollInterval = useMemo(
    () => Math.max(30000, pollIntervalMs), // Min 30s to respect rate limits
    [pollIntervalMs]
  );

  const fetchFromDatabase = useCallback(async () => {
    try {
      // First try to get cached prices from database
      const { data: cachedPrices, error } = await supabase
        .from('market_prices')
        .select(`
          coin_id,
          price_usd,
          price_change_percentage_24h,
          total_volume,
          market_cap,
          last_updated,
          market_coins!inner(symbol, name)
        `)
        .in('coin_id', Object.values(COINGECKO_IDS))
        .order('market_cap', { ascending: false, nullsFirst: false });

      if (!error && cachedPrices && cachedPrices.length > 0) {
        const priceMap: Record<string, MarketPrice> = {};
        
        for (const row of cachedPrices) {
          const coinData = row.market_coins as any;
          const symbol = coinData?.symbol || 'UNKNOWN';
          const change = row.price_change_percentage_24h || 0;
          
          priceMap[symbol] = {
            symbol,
            name: coinData?.name || symbol,
            price: formatPrice(row.price_usd || 0),
            priceNumeric: row.price_usd || 0,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            changePercent: change,
            volume: formatVolume(row.total_volume || 0),
            volumeNumeric: row.total_volume || 0,
            marketCap: row.market_cap || 0,
            trend: change >= 0 ? 'up' : 'down',
            lastUpdate: new Date(row.last_updated || Date.now()),
          };

          // Also add with /USD suffix for compatibility
          priceMap[`${symbol}/USD`] = priceMap[symbol];
        }

        setPrices(prev => ({ ...prev, ...priceMap }));
        setLastSyncError(null);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Database fetch error:', e);
      return false;
    }
  }, []);

  const fetchFromAPI = useCallback(async () => {
    try {
      // Call edge function to get fresh data (avoids CORS/rate limits)
      const { data, error } = await supabase.functions.invoke('market-data-sync', {
        body: { 
          action: 'get_price',
          params: { coinIds: Object.values(COINGECKO_IDS).slice(0, 20) }
        }
      });

      if (error) throw error;
      if (!data?.success || !data?.prices) return false;

      const priceMap: Record<string, MarketPrice> = {};
      
      for (const [coinId, priceData] of Object.entries(data.prices) as [string, any][]) {
        const symbol = Object.entries(COINGECKO_IDS).find(([_, id]) => id === coinId)?.[0];
        if (!symbol) continue;

        const change = priceData.usd_24h_change || 0;
        
        priceMap[symbol] = {
          symbol,
          name: coinId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          price: formatPrice(priceData.usd || 0),
          priceNumeric: priceData.usd || 0,
          change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
          changePercent: change,
          volume: formatVolume(priceData.usd_24h_vol || 0),
          volumeNumeric: priceData.usd_24h_vol || 0,
          marketCap: priceData.usd_market_cap || 0,
          trend: change >= 0 ? 'up' : 'down',
          lastUpdate: new Date(),
        };

        priceMap[`${symbol}/USD`] = priceMap[symbol];
      }

      setPrices(prev => ({ ...prev, ...priceMap }));
      setLastSyncError(null);
      return true;
    } catch (e) {
      console.error('API fetch error:', e);
      setLastSyncError(e instanceof Error ? e.message : 'Failed to fetch prices');
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    
    // Try database first (faster, no rate limits)
    const dbSuccess = await fetchFromDatabase();
    
    // If DB is stale or empty, fetch from API
    if (!dbSuccess) {
      await fetchFromAPI();
    }
    
    setLoading(false);
  }, [fetchFromDatabase, fetchFromAPI]);

  useEffect(() => {
    if (!isLive) return;

    refresh();
    const interval = setInterval(refresh, effectivePollInterval);

    return () => clearInterval(interval);
  }, [effectivePollInterval, isLive, refresh]);

  const getPrice = useCallback((symbol: string): MarketPrice | undefined => {
    const normalizedSymbol = symbol.toUpperCase().replace('/USD', '');
    return prices[normalizedSymbol] || prices[symbol];
  }, [prices]);

  const getAllPrices = useCallback((): MarketPrice[] => {
    // Filter out duplicates (symbol/USD pairs)
    const seen = new Set<string>();
    return Object.values(prices).filter(p => {
      if (seen.has(p.symbol) || p.symbol.includes('/')) return false;
      seen.add(p.symbol);
      return true;
    });
  }, [prices]);

  const toggleLive = () => setIsLive((v) => !v);

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

