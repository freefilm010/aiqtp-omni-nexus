import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === "generate_report") {
      // Fetch engine data
      const { data: engines } = await supabase
        .from("auto_invest_engine")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const engine = engines?.[0];

      // Fetch active allocations
      const { data: allocations } = await supabase
        .from("auto_invest_allocations")
        .select("*")
        .eq("is_active", true)
        .order("pnl_percent", { ascending: false });

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from("auto_invest_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      const trades = (transactions || []).filter(t => t.transaction_type === "buy" || t.transaction_type === "sell");
      const winningTrades = trades.filter(t => (t.pnl_usd || 0) > 0);
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl_usd || 0), 0);

      // Generate AI summary
      let summary = "Performance report generated successfully.";
      try {
        const aiResult = await callAI({
          messages: [{
            role: "system",
            content: `You are a professional financial report writer for AIQTP AI Trading Platform. Generate a concise, compelling performance summary for marketing purposes. Be factual and professional. Include key metrics and highlight strengths.`
          }, {
            role: "user",
            content: JSON.stringify({
              engine: engine ? {
                strategy: engine.strategy,
                totalCapital: engine.total_capital,
                totalProfit: engine.total_profit,
                cycleCount: engine.cycle_count,
                marketRegime: engine.ai_market_regime,
                confidence: engine.ai_confidence_score,
              } : null,
              totalTrades: trades.length,
              winRate: trades.length > 0 ? (winningTrades.length / trades.length * 100).toFixed(1) : 0,
              totalPnl,
              topAssets: (allocations || []).slice(0, 5).map(a => ({
                symbol: a.asset_symbol,
                pnl: a.pnl_percent,
                weight: a.current_percent,
              })),
            }),
          }],
          max_tokens: 500,
        });
        summary = aiResult.choices?.[0]?.message?.content || summary;
      } catch (aiError) {
        console.error("AI summary error:", aiError);
      }

      // Log the report generation
      await supabase.from("auto_invest_ai_logs").insert({
        engine_id: engine?.id || "00000000-0000-0000-0000-000000000000",
        analysis_type: "performance_report",
        model_used: "gemini-2.5-flash",
        confidence_score: engine?.ai_confidence_score || 0,
        market_regime: engine?.ai_market_regime,
        recommendations: { summary, generated_at: new Date().toISOString() },
        executed: true,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            summary,
            metrics: {
              totalCapital: engine?.total_capital || 0,
              totalProfit: engine?.total_profit || 0,
              totalTrades: trades.length,
              winRate: trades.length > 0 ? (winningTrades.length / trades.length * 100) : 0,
              cycleCount: engine?.cycle_count || 0,
            },
            generatedAt: new Date().toISOString(),
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Performance report error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error instanceof Error ? error.message : String(error)) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
