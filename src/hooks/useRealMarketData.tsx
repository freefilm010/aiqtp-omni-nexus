import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  thumb_url?: string;
  market_cap_rank?: number;
}

export interface MarketPrice {
  coin_id: string;
  price_usd: number;
  price_btc?: number;
  price_eth?: number;
  market_cap?: number;
  market_cap_rank?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_7d?: number;
  circulating_supply?: number;
  total_supply?: number;
  ath?: number;
  ath_change_percentage?: number;
  last_updated?: string;
}

export interface CombinedMarketData extends MarketCoin, MarketPrice {}

export function useRealMarketData(options?: {
  symbols?: string[];
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const { 
    symbols, 
    limit = 100, 
    autoRefresh = true, 
    refreshInterval = 30000 
  } = options || {};

  const { user } = useAuth();
  const seedAttemptedRef = useRef(false);

  const [data, setData] = useState<CombinedMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);

      const runQuery = async () => {
        // Build query for coins with prices
        let query = supabase
          .from('market_prices')
          .select(`
            *,
            market_coins:coin_id (
              id,
              symbol,
              name,
              thumb_url,
              market_cap_rank
            )
          `)
          .order('market_cap_rank', { ascending: true, nullsFirst: false })
          .limit(limit);

        // Filter by symbols if provided
        if (symbols?.length) {
          const { data: coinIds } = await supabase
            .from('market_coins')
            .select('id')
            .in('symbol', symbols.map((s) => s.toUpperCase()));

          if (coinIds?.length) {
            query = query.in('coin_id', coinIds.map((c) => c.id));
          }
        }

        return await query;
      };

      let { data: prices, error: fetchError } = await runQuery();
      if (fetchError) throw fetchError;

      // Auto-seed the DB once for authenticated users if empty.
      if ((prices?.length ?? 0) === 0 && user && !seedAttemptedRef.current) {
        seedAttemptedRef.current = true;
        try {
          await supabase.functions.invoke('market-data-sync', {
            body: { action: 'sync_market_prices', params: { pages: 2, perPage: 250 } },
          });
          ({ data: prices, error: fetchError } = await runQuery());
          if (fetchError) throw fetchError;
        } catch {
          // If seeding fails, we still return empty data gracefully.
        }
      }

      // Transform data
      const combined: CombinedMarketData[] = (prices || []).map((p: any) => ({
        ...p,
        id: p.market_coins?.id || p.coin_id,
        symbol: p.market_coins?.symbol || 'UNKNOWN',
        name: p.market_coins?.name || 'Unknown',
        thumb_url: p.market_coins?.thumb_url,
        market_cap_rank: p.market_coins?.market_cap_rank || p.market_cap_rank,
      }));

      setData(combined);
      setLastSync(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error('Market data fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [symbols, limit, user]);

  // Initial fetch
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Realtime subscription for instant price updates
  useEffect(() => {
    const channel = supabase
      .channel('market-prices-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_prices' },
        () => {
          fetchMarketData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMarketData]);

  // Fallback polling (longer interval since realtime handles instant updates)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMarketData, Math.max(refreshInterval, 60000));
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMarketData]);

  // Trigger sync from CoinGecko
  const syncFromCoinGecko = useCallback(async (pages = 5) => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase.functions.invoke('market-data-sync', {
        body: { 
          action: 'sync_market_prices', 
          params: { pages, perPage: 250 } 
        }
      });

      if (error) throw error;
      
      // Refetch after sync
      await fetchMarketData();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [fetchMarketData]);

  // Get price for specific symbol
  const getPrice = useCallback((symbol: string) => {
    return data.find(d => d.symbol.toUpperCase() === symbol.toUpperCase());
  }, [data]);

  // Get top gainers
  const getTopGainers = useCallback((count = 10) => {
    return [...data]
      .filter(d => d.price_change_percentage_24h != null)
      .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
      .slice(0, count);
  }, [data]);

  // Get top losers
  const getTopLosers = useCallback((count = 10) => {
    return [...data]
      .filter(d => d.price_change_percentage_24h != null)
      .sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
      .slice(0, count);
  }, [data]);

  // Get by market cap
  const getByMarketCap = useCallback((count = 100) => {
    return [...data]
      .filter(d => d.market_cap != null)
      .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
      .slice(0, count);
  }, [data]);

  return {
    data,
    loading,
    error,
    lastSync,
    refresh: fetchMarketData,
    syncFromCoinGecko,
    getPrice,
    getTopGainers,
    getTopLosers,
    getByMarketCap
  };
}

// Hook for Solana-specific data
export function useSolanaMarketData() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [dexPairs, setDexPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSolanaData = useCallback(async () => {
    try {
      setLoading(true);

      const [tokensResult, pairsResult] = await Promise.all([
        supabase
          .from('solana_tokens')
          .select('*')
          .eq('is_verified', true)
          .order('daily_volume', { ascending: false, nullsFirst: false })
          .limit(200),
        supabase
          .from('dex_pairs')
          .select('*')
          .eq('chain', 'solana')
          .order('volume_24h', { ascending: false, nullsFirst: false })
          .limit(100)
      ]);

      if (tokensResult.error) throw tokensResult.error;
      if (pairsResult.error) throw pairsResult.error;

      setTokens(tokensResult.data || []);
      setDexPairs(pairsResult.data || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolanaData();
  }, [fetchSolanaData]);

  // Sync from Jupiter
  const syncTokens = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('solana-operations', {
      body: { action: 'sync_token_list' }
    });
    if (error) throw error;
    await fetchSolanaData();
    return data;
  }, [fetchSolanaData]);

  // Sync DEX pairs
  const syncDexPairs = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('solana-operations', {
      body: { action: 'sync_dex_pairs' }
    });
    if (error) throw error;
    await fetchSolanaData();
    return data;
  }, [fetchSolanaData]);

  // Get swap quote
  const getSwapQuote = useCallback(async (inputMint: string, outputMint: string, amount: number) => {
    const { data, error } = await supabase.functions.invoke('solana-operations', {
      body: { 
        action: 'get_swap_quote', 
        params: { inputMint, outputMint, amount } 
      }
    });
    if (error) throw error;
    return data;
  }, []);

  return {
    tokens,
    dexPairs,
    loading,
    error,
    refresh: fetchSolanaData,
    syncTokens,
    syncDexPairs,
    getSwapQuote
  };
}

// Hook for global market stats
export function useGlobalMarketStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('market-data-sync', {
          body: { action: 'get_global' }
        });
        if (error) throw error;
        setStats(data?.data);
      } catch (err) {
        console.error('Failed to fetch global stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
}