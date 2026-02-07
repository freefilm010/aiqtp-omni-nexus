import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const COINGECKO_PRO_API = 'https://pro-api.coingecko.com/api/v3';

// Cache TTL in seconds - serve cached data if fresh enough
const CACHE_TTL_SECONDS = 60;

// In-memory rate limit tracker (per edge function instance)
let lastApiCall = 0;
const MIN_CALL_INTERVAL_MS = 1500; // 1.5s between calls for free tier

// Fetch with rate limiting and retry logic
async function fetchWithRateLimit(
  url: string, 
  headers: Record<string, string>,
  maxRetries = 2
): Promise<Response> {
  const now = Date.now();
  const timeSinceLast = now - lastApiCall;
  
  // Enforce minimum interval between calls
  if (timeSinceLast < MIN_CALL_INTERVAL_MS) {
    await new Promise(r => setTimeout(r, MIN_CALL_INTERVAL_MS - timeSinceLast));
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastApiCall = Date.now();
    const response = await fetch(url, { headers });
    
    if (response.status === 429) {
      // Rate limited - wait with exponential backoff
      const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
      
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
    }
    
    return response;
  }
  
  throw new Error('Rate limit exceeded after retries');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsedBody = await req.json().catch(() => ({ action: null, params: null }));
    const action = parsedBody?.action;
    const params = parsedBody?.params;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get('COINGECKO_API_KEY');
    const baseUrl = apiKey ? COINGECKO_PRO_API : COINGECKO_API;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (apiKey) headers['x-cg-pro-api-key'] = apiKey;

    const publicActions = new Set(['get_price', 'get_global', 'search_coins', 'get_exchanges', 'sync_trending']);
    const isPublicAction = publicActions.has(action);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    let isAuthedUser = false;

    if (!isPublicAction) {
      if (authHeader && authHeader !== `Bearer ${supabaseAnonKey}`) {
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        isAuthedUser = Boolean(user) && !authError;
      }

      if (!isAuthedUser) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      if (authHeader && authHeader !== `Bearer ${supabaseAnonKey}`) {
        try {
          const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
          });
          const { data: { user }, error: authError } = await authClient.auth.getUser();
          isAuthedUser = Boolean(user) && !authError;
        } catch {
          // Ignore auth errors for public actions
        }
      }
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const canWrite = isAuthedUser;

    console.log(`Market data sync action: ${action}`);

    // Helper: Check if cached data is fresh
    const isCacheFresh = (lastUpdated: string | null): boolean => {
      if (!lastUpdated) return false;
      const age = (Date.now() - new Date(lastUpdated).getTime()) / 1000;
      return age < CACHE_TTL_SECONDS;
    };

    // Helper: Get cached prices from database
    const getCachedPrices = async (coinIds: string[]) => {
      const { data } = await supabase
        .from('market_prices')
        .select('coin_id, price_usd, price_change_percentage_24h, total_volume, market_cap, last_updated')
        .in('coin_id', coinIds);
      
      if (!data || data.length === 0) return null;
      
      // Transform to CoinGecko-like format
      const prices: Record<string, any> = {};
      for (const row of data) {
        prices[row.coin_id] = {
          usd: row.price_usd,
          usd_24h_change: row.price_change_percentage_24h,
          usd_24h_vol: row.total_volume,
          usd_market_cap: row.market_cap,
          _cached: true,
          _age: row.last_updated ? Math.floor((Date.now() - new Date(row.last_updated).getTime()) / 1000) : null
        };
      }
      
      return Object.keys(prices).length > 0 ? prices : null;
    };

    switch (action) {
      case 'sync_coins_list': {
        const { count } = await supabase
          .from('market_coins')
          .select('*', { count: 'exact', head: true });
        
        // Skip if we already have coins synced
        if (count && count > 100) {
          return new Response(JSON.stringify({ 
            success: true, 
            synced: 0,
            message: 'Coins list already populated, skipping API call' 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const response = await fetchWithRateLimit(`${baseUrl}/coins/list?include_platform=true`, headers);
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        
        const coins = await response.json();
        let synced = 0;

        for (let i = 0; i < coins.length; i += 500) {
          const batch = coins.slice(i, i + 500).map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
            name: coin.name || coin.id,
            platforms: coin.platforms || {},
            is_active: true,
            updated_at: new Date().toISOString()
          }));

          const { error } = await supabase.from('market_coins').upsert(batch, {
            onConflict: 'id'
          });
          if (!error) synced += batch.length;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          synced,
          message: `Synced ${synced} coins from CoinGecko` 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_market_prices': {
        const perPage = params?.perPage || 250;
        const pages = params?.pages || 2; // Reduced default to avoid rate limits
        
        let synced = 0;

        for (let page = 1; page <= pages; page++) {
          const url = `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h,7d,30d`;
          
          try {
            const response = await fetchWithRateLimit(url, headers);
            if (!response.ok) {
              console.log(`Page ${page} failed: ${response.status}`);
              if (response.status === 429) break;
              continue;
            }
            
            const markets = await response.json();
            if (!markets.length) break;

            const priceData = markets.map((coin: any) => ({
              coin_id: coin.id,
              price_usd: coin.current_price || 0,
              market_cap: coin.market_cap,
              market_cap_rank: coin.market_cap_rank,
              fully_diluted_valuation: coin.fully_diluted_valuation,
              total_volume: coin.total_volume,
              high_24h: coin.high_24h,
              low_24h: coin.low_24h,
              price_change_24h: coin.price_change_24h,
              price_change_percentage_24h: coin.price_change_percentage_24h,
              price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
              price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
              market_cap_change_24h: coin.market_cap_change_24h,
              circulating_supply: coin.circulating_supply,
              total_supply: coin.total_supply,
              max_supply: coin.max_supply,
              ath: coin.ath,
              ath_change_percentage: coin.ath_change_percentage,
              ath_date: coin.ath_date,
              atl: coin.atl,
              atl_change_percentage: coin.atl_change_percentage,
              atl_date: coin.atl_date,
              last_updated: new Date().toISOString()
            }));

            const coinInserts = markets.map((coin: any) => ({
              id: coin.id,
              symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
              name: coin.name || coin.id,
              thumb_url: coin.image,
              market_cap_rank: coin.market_cap_rank,
              is_active: true,
              updated_at: new Date().toISOString()
            }));

            await supabase.from('market_coins').upsert(coinInserts, { onConflict: 'id' });
            
            const { error } = await supabase.from('market_prices').upsert(priceData, {
              onConflict: 'coin_id'
            });
            
            if (!error) synced += priceData.length;
          } catch (e: any) {
            console.error(`Page ${page} error:`, e.message);
            if (e.message.includes('Rate limit')) break;
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          synced,
          message: `Synced prices for ${synced} coins` 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_price': {
        const { coinIds } = params;
        const ids = Array.isArray(coinIds) ? coinIds : [coinIds];
        
        // Always try cache first
        const cached = await getCachedPrices(ids);
        if (cached && Object.keys(cached).length >= ids.length * 0.5) {
          console.log('Returning cached prices');
          return new Response(JSON.stringify({ success: true, prices: cached, cached: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Fetch fresh data
        const idsStr = ids.join(',');
        const url = `${baseUrl}/simple/price?ids=${idsStr}&vs_currencies=usd,btc,eth&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
        
        try {
          const response = await fetchWithRateLimit(url, headers, 1);
          
          if (!response.ok) {
            // On API error, return cached data if available
            if (cached) {
              console.log('API failed, returning stale cache');
              return new Response(JSON.stringify({ success: true, prices: cached, cached: true, stale: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            throw new Error(`CoinGecko API error: ${response.status}`);
          }
          
          const prices = await response.json();

          // Update database with fresh prices
          if (canWrite) {
            for (const [coinId, data] of Object.entries(prices) as [string, any][]) {
              await supabase.from('market_prices').upsert({
                coin_id: coinId,
                price_usd: data.usd,
                market_cap: data.usd_market_cap,
                total_volume: data.usd_24h_vol,
                price_change_percentage_24h: data.usd_24h_change,
                last_updated: new Date().toISOString()
              }, { onConflict: 'coin_id' });
            }
          }

          return new Response(JSON.stringify({ success: true, prices }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (e: any) {
          // Return cache on any error
          if (cached) {
            console.log('Error fetching, returning stale cache:', e.message);
            return new Response(JSON.stringify({ success: true, prices: cached, cached: true, stale: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw e;
        }
      }

      case 'sync_ohlcv': {
        const { coinId, days = 30 } = params;

        const url = `${baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
        const response = await fetchWithRateLimit(url, headers);
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const ohlcData = await response.json();

        let timeframe = '1d';
        if (days <= 1) timeframe = '15m';
        else if (days <= 7) timeframe = '1h';
        else if (days <= 30) timeframe = '4h';

        const ohlcRecords = ohlcData.map((candle: number[]) => ({
          coin_id: coinId,
          timeframe,
          open_time: new Date(candle[0]).toISOString(),
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4]
        }));

        const { error } = await supabase.from('market_ohlcv').upsert(ohlcRecords, {
          onConflict: 'coin_id,timeframe,open_time'
        });

        return new Response(JSON.stringify({ 
          success: !error, 
          records: ohlcRecords.length,
          timeframe
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'search_coins': {
        const { query } = params;
        const url = `${baseUrl}/search?query=${encodeURIComponent(query)}`;
        const response = await fetchWithRateLimit(url, headers);
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const results = await response.json();

        return new Response(JSON.stringify({ 
          success: true, 
          coins: results.coins?.slice(0, 50) || [],
          exchanges: results.exchanges?.slice(0, 10) || []
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_trending': {
        const url = `${baseUrl}/search/trending`;
        const response = await fetchWithRateLimit(url, headers);
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const trending = await response.json();

        return new Response(JSON.stringify({ 
          success: true, 
          coins: trending.coins || [],
          nfts: trending.nfts || []
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_exchanges': {
        const url = `${baseUrl}/exchanges?per_page=100`;
        const response = await fetchWithRateLimit(url, headers);
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const exchanges = await response.json();

        return new Response(JSON.stringify({ success: true, exchanges }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_global': {
        const url = `${baseUrl}/global`;
        const response = await fetchWithRateLimit(url, headers);
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const global = await response.json();

        return new Response(JSON.stringify({ success: true, data: global.data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('Market data sync error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
