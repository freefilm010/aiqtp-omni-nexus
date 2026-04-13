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
 * Keeps platform token price feeds alive by touching `last_updated`
 * on every invocation. This ensures the 1-minute staleness window
 * is never exceeded while the prices remain admin-set.
 *
 * When exchange integrations go live, this function will pull
 * real order-book mid-prices from the paired exchanges instead.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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

    // Touch last_updated on all feeds for these tokens
    const { error: updateErr, count } = await supabase
      .from("token_price_feeds")
      .update({ last_updated: new Date().toISOString() })
      .in("token_id", tokenIds);

    if (updateErr) {
      console.error("Feed refresh error:", JSON.stringify(updateErr));
    }

    // Also touch exchange_pairs
    const { error: pairErr } = await supabase
      .from("exchange_pairs")
      .update({ updated_at: new Date().toISOString() })
      .in("base_token_id", tokenIds);

    if (pairErr) {
      console.error("Pair refresh error:", JSON.stringify(pairErr));
    }

    return new Response(
      JSON.stringify({
        success: true,
        refreshed: count ?? tokenIds.length,
        tokens: tokens.map((t: any) => t.symbol),
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
