import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Platform Token Price Refresh
 *
 * Reports platform-token feed status without falsifying freshness.
 * A timestamp changes only when a real oracle or exchange price is written.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron-only: require Bearer <SERVICE_ROLE_KEY>.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader !== `Bearer ${serviceKey}`) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
    );

    // Get all active platform tokens
    const { data: tokens, error: tokErr } = await supabase
      .from("platform_tokens")
      .select("id, symbol")
      .eq("is_active", true);

    if (tokErr || !tokens?.length) {
      return new Response(
        JSON.stringify({ success: false, error: tokErr?.message || "No tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenIds = tokens.map((t: any) => t.id);
    const { data: feeds, error: feedErr } = await supabase
      .from("token_price_feeds")
      .select("token_id, price, source, last_updated")
      .in("token_id", tokenIds);

    if (feedErr) {
      return new Response(
        JSON.stringify({ success: false, error: feedErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        refreshed: 0,
        status: "oracle_required",
        tokens: tokens.map((t: any) => t.symbol),
        feeds: feeds ?? [],
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e?.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
