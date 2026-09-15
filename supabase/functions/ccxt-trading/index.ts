// Market data endpoint — platform venue (HollaEx) only.
// No third-party exchange feeds. Order execution lives in `hollaex-trading`.
import {
  fetchMarkets,
  fetchOhlcv,
  fetchOrderBook,
  fetchTicker,
} from "../_shared/hollaex_public.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUBLIC_ACTIONS = new Set(["fetch_markets", "fetch_ticker", "fetch_ohlcv", "fetch_order_book"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const symbol = String(body?.symbol ?? "BTC/USDT");
    const timeframe = String(body?.timeframe ?? "1h");
    const limit = Number(body?.limit ?? 100);

    if (!PUBLIC_ACTIONS.has(action)) {
      return json(
        {
          success: false,
          code: "EXECUTION_NOT_HERE",
          error:
            "This endpoint serves platform venue market data only. Order execution runs through the platform venue function (hollaex-trading).",
        },
        400,
      );
    }

    switch (action) {
      case "fetch_markets":
        return json({ success: true, exchange: "hollaex", data: await fetchMarkets() });
      case "fetch_ticker":
        return json({ success: true, exchange: "hollaex", data: await fetchTicker(symbol) });
      case "fetch_ohlcv":
        return json({ success: true, exchange: "hollaex", data: await fetchOhlcv(symbol, timeframe, limit) });
      case "fetch_order_book":
        return json({ success: true, exchange: "hollaex", data: await fetchOrderBook(symbol, limit) });
      default:
        return json({ success: false, error: "Unsupported action" }, 400);
    }
  } catch (err) {
    return json({ success: false, error: err instanceof Error ? err.message : String(err) }, 200);
  }
});
