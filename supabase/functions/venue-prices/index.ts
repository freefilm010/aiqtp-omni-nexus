// Live price ticks from the platform venue (HollaEx). No third-party feeds.
import { fetchAllTickers } from "../_shared/hollaex_public.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const tickers = await fetchAllTickers();
    const prices = tickers.map((t) => ({
      symbol: t.symbol.replace("/", ""),
      pair: t.symbol,
      price: t.last,
      change24h: t.changePercent,
      volume: t.quoteVolume,
      high24h: t.high,
      low24h: t.low,
    }));
    return new Response(JSON.stringify({ prices, source: "hollaex", ts: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err), prices: [], source: "hollaex", ts: Date.now() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
