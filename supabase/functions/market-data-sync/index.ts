import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const COINGECKO_PRO_API = 'https://pro-api.coingecko.com/api/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, params } = await req.json();
    const apiKey = Deno.env.get('COINGECKO_API_KEY');
    const baseUrl = apiKey ? COINGECKO_PRO_API : COINGECKO_API;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (apiKey) headers['x-cg-pro-api-key'] = apiKey;

    // Log sync start
    const logSync = async (syncType: string) => {
      const { data } = await supabase.from('market_sync_logs').insert({
        sync_type: syncType,
        status: 'running'
      }).select().single();
      return data?.id;
    };

    const updateSyncLog = async (logId: string, status: string, records: number, error?: string) => {
      await supabase.from('market_sync_logs').update({
        status,
        records_synced: records,
        error_message: error,
        completed_at: new Date().toISOString()
      }).eq('id', logId);
    };

    switch (action) {
      case 'sync_coins_list': {
        // Fetch full coins list from CoinGecko (15,000+ coins)
        const logId = await logSync('coins_list');
        try {
          const response = await fetch(`${baseUrl}/coins/list?include_platform=true`, { headers });
          if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
          
          const coins = await response.json();
          let synced = 0;

          // Batch insert/update coins (500 at a time)
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

          await updateSyncLog(logId!, 'completed', synced);
          return new Response(JSON.stringify({ 
            success: true, 
            synced,
            message: `Synced ${synced} coins from CoinGecko` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (e: any) {
          await updateSyncLog(logId!, 'failed', 0, e.message);
          throw e;
        }
      }

      case 'sync_market_prices': {
        // Fetch market data for top coins (max 250 per page, up to 5000)
        const logId = await logSync('prices');
        const perPage = params?.perPage || 250;
        const pages = params?.pages || 20; // 5000 coins total
        
        try {
          let synced = 0;

          for (let page = 1; page <= pages; page++) {
            const url = `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h,7d,30d`;
            
            const response = await fetch(url, { headers });
            if (!response.ok) {
              console.log(`Page ${page} failed: ${response.status}`);
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

            // Ensure coins exist first
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

            // Rate limiting - be respectful to API
            if (!apiKey) await new Promise(r => setTimeout(r, 1200));
          }

          await updateSyncLog(logId!, 'completed', synced);
          return new Response(JSON.stringify({ 
            success: true, 
            synced,
            message: `Synced prices for ${synced} coins` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (e: any) {
          await updateSyncLog(logId!, 'failed', 0, e.message);
          throw e;
        }
      }

      case 'get_price': {
        // Get real-time price for specific coin(s)
        const { coinIds } = params;
        const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds;
        
        const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=usd,btc,eth&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const prices = await response.json();

        // Update database with fresh prices
        for (const [coinId, data] of Object.entries(prices) as [string, any][]) {
          await supabase.rpc('update_market_price', {
            p_coin_id: coinId,
            p_price_usd: data.usd,
            p_price_btc: data.btc,
            p_price_eth: data.eth,
            p_market_cap: data.usd_market_cap,
            p_volume: data.usd_24h_vol,
            p_change_24h: data.usd_24h_change
          });
        }

        return new Response(JSON.stringify({ success: true, prices }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'sync_ohlcv': {
        // Fetch OHLCV data for charting
        const { coinId, days = 30 } = params;
        const logId = await logSync('ohlcv');

        try {
          const url = `${baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
          const response = await fetch(url, { headers });
          
          if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
          const ohlcData = await response.json();

          // Determine timeframe based on days
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

          await updateSyncLog(logId!, error ? 'failed' : 'completed', ohlcRecords.length, error?.message);

          return new Response(JSON.stringify({ 
            success: !error, 
            records: ohlcRecords.length,
            timeframe
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (e: any) {
          await updateSyncLog(logId!, 'failed', 0, e.message);
          throw e;
        }
      }

      case 'search_coins': {
        // Search CoinGecko for coins
        const { query } = params;
        const url = `${baseUrl}/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const results = await response.json();

        return new Response(JSON.stringify({ 
          success: true, 
          coins: results.coins?.slice(0, 50) || [],
          exchanges: results.exchanges?.slice(0, 10) || []
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_trending': {
        // Get trending coins
        const url = `${baseUrl}/search/trending`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const trending = await response.json();

        return new Response(JSON.stringify({ 
          success: true, 
          coins: trending.coins || [],
          nfts: trending.nfts || []
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_exchanges': {
        // Get exchange list with volumes
        const url = `${baseUrl}/exchanges?per_page=100`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        const exchanges = await response.json();

        return new Response(JSON.stringify({ success: true, exchanges }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_global': {
        // Get global crypto market data
        const url = `${baseUrl}/global`;
        const response = await fetch(url, { headers });
        
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