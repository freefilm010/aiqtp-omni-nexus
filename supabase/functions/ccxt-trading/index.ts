// Public market data across all connected venues (HollaEx primary; Binance,
// Kraken, Coinbase re-enabled 2026-09-27). Order execution still lives in the
// platform venue function (hollaex-trading) and per-user CCXT connected
// accounts (trade-execute). No third-party keys are required for this endpoint.
import {
  fetchVenueOhlcv,
  fetchVenueOrderBook,
  fetchVenueTicker,
  isVenueId,
  type VenueId,
  type VenueTicker,
} from "../_shared/exchange_public.ts";
import { fetchMarkets, fetchTicker as fetchHollaexTicker, toVenuePair, fromVenuePair } from "../_shared/hollaex_public.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PUBLIC_ACTIONS = new Set([
  "fetch_markets",
  "fetch_ticker",
  "fetch_all_tickers",
  "fetch_ohlcv",
  "fetch_order_book",
]);

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
    const venue: VenueId = isVenueId(body?.exchange) ? body.exchange : "hollaex";

    if (!PUBLIC_ACTIONS.has(action)) {
      return json(
        {
          success: false,
          code: "EXECUTION_NOT_HERE",
          error:
            "This endpoint serves venue market data only. Order execution runs through the platform venue function (hollaex-trading) or per-user connected accounts (trade-execute).",
        },
        400,
      );
    }

    switch (action) {
      case "fetch_markets":
        return json({ success: true, exchange: venue, data: await fetchMarkets() });
      case "fetch_ticker":
        return json({ success: true, exchange: venue, data: await fetchVenueTicker(venue, symbol) });
      case "fetch_all_tickers": {
        const { fetchAllVenueTickers } = await import("../_shared/exchange_public.ts");
        const tickers: VenueTicker[] = await fetchAllVenueTickers(symbol);
        return json({ success: true, exchange: "multi", data: tickers });
      }
      case "fetch_ohlcv":
        return json({ success: true, exchange: venue, data: await fetchVenueOhlcv(venue, symbol, timeframe, limit) });
      case "fetch_order_book":
        return json({ success: true, exchange: venue, data: await fetchVenueOrderBook(venue, symbol, limit) });
      default:
        return json({ success: false, error: "Unsupported action" }, 400);
    }
  } catch (err) {
    return json({ success: false, error: err instanceof Error ? err.message : String(err) }, 200);
  }
});
