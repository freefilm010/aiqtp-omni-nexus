import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active auto-invest engines
    const { data: engines, error: engErr } = await supabase
      .from("auto_invest_engine")
      .select("*")
      .eq("status", "active");

    if (engErr) throw engErr;

    let snapshotsCreated = 0;

    for (const engine of engines || []) {
      // Get allocations for this engine
      const { data: allocations } = await supabase
        .from("auto_invest_allocations")
        .select("*")
        .eq("engine_id", engine.id)
        .eq("is_active", true);

      const totalValue = (allocations || []).reduce((sum: number, a: any) => sum + (a.value_usd || 0), 0);
      const totalPnl = (allocations || []).reduce((sum: number, a: any) => sum + (a.pnl_usd || 0), 0);

      // Build strategy attribution
      const strategyAttribution: Record<string, number> = {};
      for (const a of allocations || []) {
        const key = a.asset_symbol || "unknown";
        strategyAttribution[key] = (strategyAttribution[key] || 0) + (a.value_usd || 0);
      }

      const { error: insertErr } = await supabase.from("compound_snapshots").insert({
        engine_id: engine.id,
        total_value: totalValue,
        total_profit: totalPnl,
        total_capital: engine.total_capital || 0,
        roi_percent: engine.total_capital > 0 ? (totalPnl / engine.total_capital) * 100 : 0,
        strategy_attribution: strategyAttribution,
      });

      if (!insertErr) snapshotsCreated++;
    }

    return new Response(
      JSON.stringify({ success: true, snapshots_created: snapshotsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
