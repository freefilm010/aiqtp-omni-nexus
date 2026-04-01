import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const publicActions = new Set(['get_price', 'get_global', 'search_coins', 'get_exchanges', 'sync_trending', 'sync_market_prices', 'sync_coins_list']);
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

    const canWrite = isAuthedUser || action === 'get_price';

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
        const force = params?.force === true;
        
        if (!force) {
          const { count } = await supabase
            .from('market_coins')
            .select('*', { count: 'exact', head: true });
          
          // Only skip if we already have 10k+ coins AND not forced
          if (count && count > 10000) {
            return new Response(JSON.stringify({ 
              success: true, 
              synced: 0,
              total: count,
              message: `Coins list already has ${count} entries` 
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        const response = await fetchWithRateLimit(`${baseUrl}/coins/list?include_platform=true`, headers);
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        
        const coins = await response.json();
        let synced = 0;

        // Process ALL coins in batches of 1000
        for (let i = 0; i < coins.length; i += 1000) {
          const batch = coins.slice(i, i + 1000).map((coin: any) => ({
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
          total_available: coins.length,
          message: `Synced ${synced} coins from CoinGecko (${coins.length} available)` 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_market_prices': {
        const perPage = params?.perPage || 250;
        const pages = params?.pages || 40; // 40 pages × 250 = 10,000 coins
        const startPage = params?.startPage || 1;
        
        let synced = 0;
        let lastPage = startPage;

        for (let page = startPage; page <= pages; page++) {
          const url = `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h,7d,30d`;
          
          try {
            const response = await fetchWithRateLimit(url, headers);
            if (!response.ok) {
              const body = await response.text().catch(() => '');
              console.error(`Page ${page} failed: ${response.status} - ${body}`);
              if (response.status === 429) {
                lastPage = page;
                break;
              }
              continue;
            }
            
            const markets = await response.json();
            console.log(`Page ${page}: received ${markets.length} coins`);
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
            lastPage = page;
            
            // Delay between pages to respect rate limits
            if (page < pages) {
              await new Promise(r => setTimeout(r, 2000));
            }
          } catch (e: any) {
            console.error(`Page ${page} error:`, e.message);
            lastPage = page;
            if (e.message.includes('Rate limit')) break;
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          synced,
          lastPage,
          totalPages: pages,
          message: `Synced prices for ${synced} coins (pages ${startPage}-${lastPage} of ${pages})` 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_price': {
        const { coinIds } = params;
        const ids = Array.isArray(coinIds) ? coinIds : [coinIds];

        const respond = (payload: unknown) =>
          new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        // Always try cache first
        const cached = await getCachedPrices(ids);
        if (cached && Object.keys(cached).length >= ids.length * 0.5) {
          console.log('Returning cached prices');
          return respond({ success: true, prices: cached, cached: true });
        }

        const idsStr = ids.join(',');
        const url = `${baseUrl}/simple/price?ids=${idsStr}&vs_currencies=usd,btc,eth&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

        try {
          const response = await fetchWithRateLimit(url, headers, 1);

          // Handle provider errors without returning non-2xx (so the client doesn't throw)
          if (!response.ok) {
            if (response.status === 429) {
              const retryAfterSeconds = Number(response.headers.get('retry-after') ?? '0') || 120;
              const retryAfterMs = retryAfterSeconds * 1000;

              if (cached) {
                console.log('Rate limited, returning stale cache');
                return respond({
                  success: true,
                  prices: cached,
                  cached: true,
                  stale: true,
                  rateLimited: true,
                  retryAfterMs,
                });
              }

              return respond({
                success: false,
                error: 'Rate limited by data provider',
                rateLimited: true,
                retryAfterMs,
              });
            }

            if (cached) {
              console.log('API failed, returning stale cache');
              return respond({
                success: true,
                prices: cached,
                cached: true,
                stale: true,
                providerStatus: response.status,
              });
            }

            return respond({
              success: false,
              error: `Data provider error: ${response.status}`,
              providerStatus: response.status,
            });
          }

          const prices = await response.json();

          // Update database with fresh prices (safe for public data)
          if (canWrite) {
            const rows = Object.entries(prices).map(([coinId, data]: [string, any]) => ({
              coin_id: coinId,
              price_usd: data.usd,
              market_cap: data.usd_market_cap,
              total_volume: data.usd_24h_vol,
              price_change_percentage_24h: data.usd_24h_change,
              last_updated: new Date().toISOString(),
            }));

            if (rows.length > 0) {
              const { error: upsertError } = await supabase.from('market_prices').upsert(rows, { onConflict: 'coin_id' });
              if (upsertError) {
                console.error('Price upsert error:', JSON.stringify(upsertError));
                // Try individual inserts for coins that might not exist in market_coins
                for (const row of rows) {
                  // Ensure coin exists in market_coins first
                  await supabase.from('market_coins').upsert({
                    id: row.coin_id,
                    symbol: row.coin_id.toUpperCase().replace(/-/g, ''),
                    name: row.coin_id.replace(/-/g, ' '),
                    is_active: true,
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'id' });
                  // Then insert price
                  await supabase.from('market_prices').upsert(row, { onConflict: 'coin_id' });
                }
              }
            }
          }

          return respond({ success: true, prices });
        } catch (e: any) {
          if (cached) {
            console.log('Error fetching, returning stale cache:', e.message);
            return respond({
              success: true,
              prices: cached,
              cached: true,
              stale: true,
              error: e.message,
            });
          }

          // Don't throw → avoid 500s → client can handle gracefully
          return respond({ success: false, error: e?.message || 'Failed to fetch prices' });
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
