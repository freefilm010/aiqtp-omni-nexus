const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BINANCE_SYMBOLS = [
  "BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT",
  "AVAXUSDT","DOTUSDT","LINKUSDT","MATICUSDT","UNIUSDT","AAVEUSDT","ARBUSDT",
  "OPUSDT","LTCUSDT","NEARUSDT","ATOMUSDT","FTMUSDT","INJUSDT","SUIUSDT",
  "APTUSDT","RNDRUSDT","FETUSDT","GRTUSDT","FILUSDT","PEPEUSDT","BONKUSDT","WIFUSDT"
];

const SYMBOL_SET = new Set(BINANCE_SYMBOLS);

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  return fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
}

function toArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Strategy 1: fetch 24hr ticker (has price + change + volume in one call)
    const url24hr = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(BINANCE_SYMBOLS))}`;
    const resp = await fetchWithTimeout(url24hr);
    const raw = await resp.json();
    const tickers = toArray(raw);

    if (tickers.length > 0) {
      const prices = tickers
        .filter((t: any) => SYMBOL_SET.has(t.symbol))
        .map((t: any) => ({
          symbol: t.symbol,
          price: parseFloat(t.lastPrice || t.price || "0"),
          change24h: parseFloat(t.priceChangePercent || "0"),
          volume: parseFloat(t.quoteVolume || "0"),
          high24h: parseFloat(t.highPrice || "0"),
          low24h: parseFloat(t.lowPrice || "0"),
        }));

      return new Response(JSON.stringify({ prices, ts: Date.now() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-cache" },
      });
    }

    // Strategy 2: fallback to all tickers price-only endpoint
    const fallbackResp = await fetchWithTimeout("https://api.binance.com/api/v3/ticker/price");
    const fallbackRaw = await fallbackResp.json();
    const allTickers = toArray(fallbackRaw);
    const filtered = allTickers
      .filter((t: any) => SYMBOL_SET.has(t.symbol))
      .map((t: any) => ({
        symbol: t.symbol,
        price: parseFloat(t.price || "0"),
        change24h: 0,
        volume: 0,
        high24h: 0,
        low24h: 0,
      }));

    return new Response(JSON.stringify({ prices: filtered, ts: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), prices: [], ts: Date.now() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
