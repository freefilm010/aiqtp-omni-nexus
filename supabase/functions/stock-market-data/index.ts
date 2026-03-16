import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface StockRequest {
  action: 'quote' | 'search' | 'history' | 'market_movers' | 'bulk_quotes';
  symbols?: string[];
  symbol?: string;
  query?: string;
  range?: string; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y
  interval?: string; // 1m, 5m, 15m, 1d, 1wk
}

// Yahoo Finance (free, no key)
async function yahooQuote(symbols: string[], signal: AbortSignal): Promise<Record<string, unknown>[]> {
  const joined = symbols.join(',');
  const resp = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(joined)}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,fiftyTwoWeekHigh,fiftyTwoWeekLow,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketPreviousClose,currency,exchange,quoteType`,
    { signal, headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  if (!resp.ok) throw new Error(`Yahoo quote error [${resp.status}]`);
  const data = await resp.json();
  return data?.quoteResponse?.result || [];
}

async function yahooSearch(query: string, signal: AbortSignal): Promise<unknown[]> {
  const resp = await fetch(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0`,
    { signal, headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  if (!resp.ok) throw new Error(`Yahoo search error [${resp.status}]`);
  const data = await resp.json();
  return data?.quotes || [];
}

async function yahooHistory(symbol: string, range: string, interval: string, signal: AbortSignal): Promise<unknown> {
  const resp = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`,
    { signal, headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  if (!resp.ok) throw new Error(`Yahoo history error [${resp.status}]`);
  const data = await resp.json();
  const result = data?.chart?.result?.[0];
  if (!result) return { timestamps: [], prices: [] };

  const ts = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  return {
    timestamps: ts,
    open: quotes.open || [],
    high: quotes.high || [],
    low: quotes.low || [],
    close: quotes.close || [],
    volume: quotes.volume || [],
    meta: result.meta,
  };
}

// Finnhub fallback (if key available)
async function finnhubQuote(symbol: string, apiKey: string, signal: AbortSignal): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { signal }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      symbol,
      source: 'finnhub',
      currentPrice: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  } catch { return null; }
}

// Alpha Vantage fallback (if key available)
async function alphaVantageQuote(symbol: string, apiKey: string, signal: AbortSignal): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
      { signal }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const gq = data['Global Quote'];
    if (!gq) return null;
    return {
      symbol: gq['01. symbol'],
      source: 'alphavantage',
      currentPrice: parseFloat(gq['05. price']),
      change: parseFloat(gq['09. change']),
      changePercent: parseFloat(gq['10. change percent']?.replace('%', '')),
      high: parseFloat(gq['03. high']),
      low: parseFloat(gq['04. low']),
      open: parseFloat(gq['02. open']),
      previousClose: parseFloat(gq['08. previous close']),
      volume: parseInt(gq['06. volume']),
    };
  } catch { return null; }
}

// Market movers from Yahoo
async function yahooMovers(signal: AbortSignal): Promise<unknown> {
  const indices = ['%5EGSPC', '%5EDJI', '%5EIXIC', '%5ERUT', '%5EVIX', '%5EFTSE', '%5EN225', '%5EGDAXI'];
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'WMT', 'SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'SLV', 'USO'];

  const [indexData, stockData] = await Promise.all([
    yahooQuote(indices, signal).catch(() => []),
    yahooQuote(popularStocks, signal).catch(() => []),
  ]);

  return { indices: indexData, trending: stockData };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbols, symbol, query, range = '1mo', interval = '1d' }: StockRequest = await req.json();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const FINNHUB_KEY = Deno.env.get('FINNHUB_API_KEY');
    const ALPHA_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    let result: unknown;

    try {
      switch (action) {
        case 'quote':
        case 'bulk_quotes': {
          const syms = symbols || (symbol ? [symbol] : ['AAPL']);
          try {
            result = await yahooQuote(syms, controller.signal);
          } catch {
            // Fallback to Finnhub/Alpha Vantage
            const fallbacks = await Promise.all(syms.map(async (s) => {
              if (FINNHUB_KEY) {
                const fb = await finnhubQuote(s, FINNHUB_KEY, controller.signal);
                if (fb) return fb;
              }
              if (ALPHA_KEY) {
                return await alphaVantageQuote(s, ALPHA_KEY, controller.signal);
              }
              return null;
            }));
            result = fallbacks.filter(Boolean);
          }
          break;
        }

        case 'search': {
          if (!query) throw new Error('Search query required');
          result = await yahooSearch(query, controller.signal);
          break;
        }

        case 'history': {
          const sym = symbol || 'AAPL';
          result = await yahooHistory(sym, range, interval, controller.signal);
          break;
        }

        case 'market_movers': {
          result = await yahooMovers(controller.signal);
          break;
        }

        default:
          return new Response(
            JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } finally {
      clearTimeout(timeout);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Stock market data error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
