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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Binance ticker/price endpoint - returns all prices in ~100ms
    const symbols = JSON.stringify(BINANCE_SYMBOLS);
    const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(symbols)}`;
    
    const resp = await fetch(url, { 
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) {
      // Fallback to individual ticker
      const fallbackUrl = `https://api.binance.com/api/v3/ticker/price`;
      const fallbackResp = await fetch(fallbackUrl, { signal: AbortSignal.timeout(5000) });
      const allTickers = await fallbackResp.json();
      const filtered = allTickers.filter((t: any) => BINANCE_SYMBOLS.includes(t.symbol));
      
      return new Response(JSON.stringify({ prices: filtered, ts: Date.now() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    
    // Also fetch 24h change data
    const changeUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`;
    let changeData: any[] = [];
    try {
      const changeResp = await fetch(changeUrl, { signal: AbortSignal.timeout(5000) });
      if (changeResp.ok) changeData = await changeResp.json();
    } catch { /* non-critical */ }

    const changeMap = new Map(changeData.map((c: any) => [c.symbol, c]));

    const prices = data.map((t: any) => {
      const change = changeMap.get(t.symbol);
      return {
        symbol: t.symbol,
        price: parseFloat(t.price),
        change24h: change ? parseFloat(change.priceChangePercent) : 0,
        volume: change ? parseFloat(change.quoteVolume) : 0,
        high24h: change ? parseFloat(change.highPrice) : 0,
        low24h: change ? parseFloat(change.lowPrice) : 0,
      };
    });

    return new Response(JSON.stringify({ prices, ts: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), prices: [], ts: Date.now() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
