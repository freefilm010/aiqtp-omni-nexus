import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Yahoo Finance v8 API (free, no key needed)
const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance';

// Major stock indices symbols
const INDICES = [
  '^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX', '^FTSE', '^GDAXI', '^FCHI',
  '^N225', '^HSI', '^STI', '^AXJO', '^BSESN', '^JKSE', '^KLSE', '^NZ50',
  '^KS11', '^TWII', '^GSPTSE', '^BVSP', '^MXX', '^MERV', '^TA125.TA',
];

// S&P 500 top stocks (representative sample)
const SP500_SYMBOLS = [
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','BRK-B','UNH','JNJ',
  'JPM','V','PG','XOM','HD','MA','AVGO','CVX','LLY','MRK',
  'ABBV','PEP','KO','COST','ADBE','WMT','MCD','CRM','BAC','CSCO',
  'TMO','ACN','ABT','DHR','NFLX','LIN','CMCSA','TXN','PM','NEE',
  'AMD','ORCL','INTC','HON','LOW','QCOM','RTX','UPS','ELV','INTU',
  'SPGI','GS','BLK','SYK','CAT','ISRG','MDLZ','BKNG','PLD','ADP',
  'DE','GILD','AMT','CI','MMC','CB','ZTS','VRTX','TJX','BSX',
  'SCHW','MO','DUK','SLB','EOG','PGR','SO','REGN','BDX','CL',
  'CME','ICE','USB','NOC','ITW','WM','APD','EQIX','EMR','GE',
  'F','GM','BA','DIS','PYPL','SQ','SHOP','SNOW','PLTR','COIN',
  'RBLX','DKNG','SOFI','RIVN','LCID','NIO','LI','XPEV','ABNB','UBER',
  'LYFT','DASH','PINS','SNAP','TWLO','ZM','DOCU','CRWD','OKTA','NET',
  'DDOG','MDB','TEAM','ZS','PANW','FTNT','SPLK','NOW','WDAY','BILL',
  'TTD','U','ROKU','SE','MELI','NU','GRAB','CPNG','BABA','JD',
  'PDD','TCEHY','BIDU','BILI','IQ','TME','WB','VIPS','TAL','EDU',
  'TSM','ASML','SAP','TM','SNE','HMC','NVS','AZN','GSK','SAN',
  'HSBC','BP','SHEL','RIO','BHP','VALE','ITUB','PBR','SU','ENB',
];

// Forex pairs
const FOREX_PAIRS = [
  'EURUSD=X','GBPUSD=X','USDJPY=X','USDCHF=X','AUDUSD=X','NZDUSD=X',
  'USDCAD=X','EURGBP=X','EURJPY=X','GBPJPY=X','AUDJPY=X','CADJPY=X',
  'EURAUD=X','EURCHF=X','GBPCHF=X','CHFJPY=X','NZDJPY=X','AUDCAD=X',
  'AUDCHF=X','AUDNZD=X','CADCHF=X','EURNZD=X','GBPAUD=X','GBPCAD=X',
  'GBPNZD=X','NZDCAD=X','NZDCHF=X','USDSGD=X','USDHKD=X','USDCNY=X',
  'USDINR=X','USDBRL=X','USDMXN=X','USDZAR=X','USDTRY=X','USDSEK=X',
  'USDNOK=X','USDDKK=X','USDPLN=X','USDCZK=X','USDHUF=X','USDRUB=X',
  'USDKRW=X','USDTWD=X','USDTHB=X','USDPHP=X','USDIDR=X','USDMYR=X',
];

// Commodities
const COMMODITIES = [
  'GC=F','SI=F','PL=F','PA=F','HG=F', // Precious metals & copper
  'CL=F','BZ=F','NG=F','HO=F','RB=F', // Energy
  'ZC=F','ZW=F','ZS=F','ZM=F','ZL=F', // Grains
  'KC=F','SB=F','CC=F','CT=F','OJ=F', // Softs
  'LE=F','HE=F','GF=F',               // Livestock
  'LBS=F',                              // Lumber
];

// ETFs (cover more asset classes)
const ETFS = [
  'SPY','QQQ','IWM','DIA','VTI','VOO','VEA','VWO','EFA','EEM',
  'AGG','BND','TLT','IEF','SHY','LQD','HYG','JNK','TIP','BNDX',
  'GLD','SLV','USO','UNG','DBA','DBC','PDBC','GSG',
  'XLF','XLK','XLE','XLV','XLI','XLU','XLP','XLB','XLRE','XLC','XLY',
  'VNQ','VNQI','REM','MORT',
  'ARKK','ARKG','ARKF','ARKQ','ARKW',
  'IBIT','ETHA','GBTC','ETCG',
];

// Treasury bonds / rates
const BONDS = [
  '^IRX','^FVX','^TNX','^TYX', // US Treasury yields
];

const ASSET_CLASS_MAP: Record<string, string> = {};
INDICES.forEach(s => ASSET_CLASS_MAP[s] = 'index');
FOREX_PAIRS.forEach(s => ASSET_CLASS_MAP[s] = 'forex');
COMMODITIES.forEach(s => ASSET_CLASS_MAP[s] = 'commodity');
ETFS.forEach(s => ASSET_CLASS_MAP[s] = 'etf');
BONDS.forEach(s => ASSET_CLASS_MAP[s] = 'bond');
// Default: equity

async function fetchYahooQuotes(symbols: string[]): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < symbols.length; i += 50) {
    const batch = symbols.slice(i, i + 50);
    const symbolStr = batch.join(',');
    
    try {
      // Use the v6 quote endpoint which works from server-side
      const url = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(symbolStr)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      
      if (!response.ok) {
        console.log(`Yahoo batch ${i} failed: ${response.status}`);
        await response.text(); // consume body
        continue;
      }
      
      const data = await response.json();
      const quotes = data?.quoteResponse?.result || data?.finance?.result?.[0]?.quotes || [];
      results.push(...quotes);
    } catch (e) {
      console.error('Yahoo batch %d error: %o', i, e);
    }
    
    if (i + 50 < symbols.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return results;
}

function formatSymbol(rawSymbol: string): string {
  return rawSymbol
    .replace('=X', '')
    .replace('=F', '')
    .replace('^', '');
}

function getAssetClass(symbol: string): string {
  return ASSET_CLASS_MAP[symbol] || 'equity';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json().catch(() => ({ action: null, params: null }));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (action) {
      case 'sync_stocks': {
        const symbols = params?.symbols || SP500_SYMBOLS;
        const quotes = await fetchYahooQuotes(symbols);
        
        const rows = quotes.map((q: any) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          asset_class: 'equity',
          exchange: q.exchange || q.fullExchangeName,
          sector: q.sector || null,
          industry: q.industry || null,
          country: q.region || null,
          currency: q.currency || 'USD',
          price_usd: q.regularMarketPrice || 0,
          price_change_24h: q.regularMarketChange || 0,
          price_change_percentage_24h: q.regularMarketChangePercent || 0,
          market_cap: q.marketCap || 0,
          volume: q.regularMarketVolume || 0,
          high_24h: q.regularMarketDayHigh || null,
          low_24h: q.regularMarketDayLow || null,
          open_price: q.regularMarketOpen || null,
          previous_close: q.regularMarketPreviousClose || null,
          week_52_high: q.fiftyTwoWeekHigh || null,
          week_52_low: q.fiftyTwoWeekLow || null,
          pe_ratio: q.trailingPE || null,
          dividend_yield: q.dividendYield || null,
          beta: q.beta || null,
          eps: q.epsTrailingTwelveMonths || null,
          is_active: true,
          last_updated: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          const { error } = await supabase.from('traditional_assets').upsert(rows, { onConflict: 'symbol' });
          if (error) console.error('Stock upsert error:', error);
        }

        return new Response(JSON.stringify({
          success: true,
          synced: rows.length,
          message: `Synced ${rows.length} stock quotes`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_indices': {
        const quotes = await fetchYahooQuotes(INDICES);
        
        const rows = quotes.map((q: any) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          asset_class: 'index',
          exchange: q.exchange || q.fullExchangeName,
          currency: q.currency || 'USD',
          price_usd: q.regularMarketPrice || 0,
          price_change_24h: q.regularMarketChange || 0,
          price_change_percentage_24h: q.regularMarketChangePercent || 0,
          volume: q.regularMarketVolume || 0,
          high_24h: q.regularMarketDayHigh || null,
          low_24h: q.regularMarketDayLow || null,
          previous_close: q.regularMarketPreviousClose || null,
          is_active: true,
          last_updated: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          await supabase.from('traditional_assets').upsert(rows, { onConflict: 'symbol' });
        }

        return new Response(JSON.stringify({
          success: true,
          synced: rows.length,
          message: `Synced ${rows.length} indices`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_forex': {
        const quotes = await fetchYahooQuotes(FOREX_PAIRS);
        
        const rows = quotes.map((q: any) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          asset_class: 'forex',
          exchange: 'FX',
          currency: q.currency || 'USD',
          price_usd: q.regularMarketPrice || 0,
          price_change_24h: q.regularMarketChange || 0,
          price_change_percentage_24h: q.regularMarketChangePercent || 0,
          volume: q.regularMarketVolume || 0,
          high_24h: q.regularMarketDayHigh || null,
          low_24h: q.regularMarketDayLow || null,
          previous_close: q.regularMarketPreviousClose || null,
          is_active: true,
          last_updated: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          await supabase.from('traditional_assets').upsert(rows, { onConflict: 'symbol' });
        }

        return new Response(JSON.stringify({
          success: true,
          synced: rows.length,
          message: `Synced ${rows.length} forex pairs`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_commodities': {
        const quotes = await fetchYahooQuotes(COMMODITIES);
        
        const rows = quotes.map((q: any) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          asset_class: 'commodity',
          exchange: q.exchange || 'CME',
          currency: q.currency || 'USD',
          price_usd: q.regularMarketPrice || 0,
          price_change_24h: q.regularMarketChange || 0,
          price_change_percentage_24h: q.regularMarketChangePercent || 0,
          volume: q.regularMarketVolume || 0,
          high_24h: q.regularMarketDayHigh || null,
          low_24h: q.regularMarketDayLow || null,
          previous_close: q.regularMarketPreviousClose || null,
          is_active: true,
          last_updated: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          await supabase.from('traditional_assets').upsert(rows, { onConflict: 'symbol' });
        }

        return new Response(JSON.stringify({
          success: true,
          synced: rows.length,
          message: `Synced ${rows.length} commodities`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_etfs': {
        const quotes = await fetchYahooQuotes(ETFS);
        
        const rows = quotes.map((q: any) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          asset_class: 'etf',
          exchange: q.exchange || q.fullExchangeName,
          sector: q.sector || null,
          currency: q.currency || 'USD',
          price_usd: q.regularMarketPrice || 0,
          price_change_24h: q.regularMarketChange || 0,
          price_change_percentage_24h: q.regularMarketChangePercent || 0,
          market_cap: q.marketCap || 0,
          volume: q.regularMarketVolume || 0,
          high_24h: q.regularMarketDayHigh || null,
          low_24h: q.regularMarketDayLow || null,
          previous_close: q.regularMarketPreviousClose || null,
          dividend_yield: q.dividendYield || null,
          is_active: true,
          last_updated: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          await supabase.from('traditional_assets').upsert(rows, { onConflict: 'symbol' });
        }

        return new Response(JSON.stringify({
          success: true,
          synced: rows.length,
          message: `Synced ${rows.length} ETFs`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_bonds': {
        const quotes = await fetchYahooQuotes(BONDS);
        
        const rows = quotes.map((q: any) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          asset_class: 'bond',
          exchange: 'UST',
          currency: 'USD',
          price_usd: q.regularMarketPrice || 0,
          price_change_24h: q.regularMarketChange || 0,
          price_change_percentage_24h: q.regularMarketChangePercent || 0,
          is_active: true,
          last_updated: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          await supabase.from('traditional_assets').upsert(rows, { onConflict: 'symbol' });
        }

        return new Response(JSON.stringify({
          success: true,
          synced: rows.length,
          message: `Synced ${rows.length} bond yields`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_all': {
        // Sync everything in sequence
        const allSymbols = [
          ...INDICES, ...SP500_SYMBOLS, ...FOREX_PAIRS,
          ...COMMODITIES, ...ETFS, ...BONDS,
        ];
        
        const quotes = await fetchYahooQuotes(allSymbols);
        
        const rows = quotes.map((q: any) => ({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          asset_class: getAssetClass(q.symbol),
          exchange: q.exchange || q.fullExchangeName || null,
          sector: q.sector || null,
          industry: q.industry || null,
          country: q.region || null,
          currency: q.currency || 'USD',
          price_usd: q.regularMarketPrice || 0,
          price_change_24h: q.regularMarketChange || 0,
          price_change_percentage_24h: q.regularMarketChangePercent || 0,
          market_cap: q.marketCap || 0,
          volume: q.regularMarketVolume || 0,
          high_24h: q.regularMarketDayHigh || null,
          low_24h: q.regularMarketDayLow || null,
          open_price: q.regularMarketOpen || null,
          previous_close: q.regularMarketPreviousClose || null,
          week_52_high: q.fiftyTwoWeekHigh || null,
          week_52_low: q.fiftyTwoWeekLow || null,
          pe_ratio: q.trailingPE || null,
          dividend_yield: q.dividendYield || null,
          beta: q.beta || null,
          eps: q.epsTrailingTwelveMonths || null,
          is_active: true,
          last_updated: new Date().toISOString(),
        }));

        if (rows.length > 0) {
          const { error } = await supabase.from('traditional_assets').upsert(rows, { onConflict: 'symbol' });
          if (error) console.error('Bulk upsert error:', error);
        }

        return new Response(JSON.stringify({
          success: true,
          synced: rows.length,
          totalSymbols: allSymbols.length,
          breakdown: {
            indices: INDICES.length,
            stocks: SP500_SYMBOLS.length,
            forex: FOREX_PAIRS.length,
            commodities: COMMODITIES.length,
            etfs: ETFS.length,
            bonds: BONDS.length,
          },
          message: `Synced ${rows.length} traditional assets across all classes`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_summary': {
        const { data: counts } = await supabase
          .from('traditional_assets')
          .select('asset_class');
        
        const { count: cryptoCount } = await supabase
          .from('market_prices')
          .select('*', { count: 'exact', head: true });

        const { count: coinRefCount } = await supabase
          .from('market_coins')
          .select('*', { count: 'exact', head: true });

        const classCounts: Record<string, number> = {};
        if (counts) {
          for (const row of counts) {
            classCounts[row.asset_class] = (classCounts[row.asset_class] || 0) + 1;
          }
        }

        const totalTraditional = counts?.length || 0;
        const totalAll = totalTraditional + (cryptoCount || 0);

        return new Response(JSON.stringify({
          success: true,
          total_instruments: totalAll,
          crypto: {
            coins_reference: coinRefCount || 0,
            coins_with_prices: cryptoCount || 0,
          },
          traditional: {
            total: totalTraditional,
            ...classCounts,
          },
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (e: any) {
    console.error('Multi-asset sync error:', e);
    return new Response(JSON.stringify({ success: false, error: (e instanceof Error ? e.message : String(e)) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
