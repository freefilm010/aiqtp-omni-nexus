import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = true; // now using Anthropic directly via callAI

    // Auth check - admin only
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, engine_id, amount, allocations } = await req.json();

    switch (action) {
      case "analyze": {
        // Gather system-wide intelligence
        const [signals, prices, regime] = await Promise.all([
          adminClient.from("ai_signals").select("*").eq("is_active", true).order("confidence", { ascending: false }).limit(20),
          adminClient.from("market_prices").select("*").order("market_cap", { ascending: false }).limit(50),
          adminClient.from("auto_invest_engine").select("*").eq("id", engine_id).single(),
        ]);

        const signalData = signals.data || [];
        const priceData = prices.data || [];
        const engineState = regime.data;

        if (!lovableKey) {
          return new Response(JSON.stringify({ error: "AI not configured" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const aiResult = await callAI({
          messages: [
            {
              role: "system",
              content: `You are QAQI, an autonomous AI investment engine. Analyze market signals, prices, and fundamentals to determine optimal portfolio allocation for maximum returns.

STRATEGY: Ultra-aggressive growth (95% growth / 5% stable). 100% profit reinvestment.
GOAL: Maximize compound returns by identifying highest-potential assets and dynamically shifting capital. Only 5% held in stable reserves for liquidity.

Rules:
- Always recommend specific allocations with percentages totaling 100%
- Include stop-loss and take-profit levels for each position
- Assess current market regime (bull/bear/sideways/volatile)
- Score your confidence 0-100
- Provide brief reasoning for each allocation`,
            },
            {
              role: "user",
              content: `Current engine state: ${JSON.stringify(engineState)}

Active signals (top 20): ${JSON.stringify(signalData.map(s => ({
                symbol: s.symbol,
                type: s.signal_type,
                confidence: s.confidence,
                strength: s.strength,
                reason: s.reason,
              })))}

Market prices (top 50 by mcap): ${JSON.stringify(priceData.map(p => ({
                id: p.coin_id,
                price: p.price_usd,
                change_24h: p.price_change_percentage_24h,
                change_7d: p.price_change_percentage_7d,
                mcap: p.market_cap,
                volume: p.total_volume,
              })))}

Analyze and return optimal allocations.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "propose_allocations",
                description: "Propose optimal portfolio allocations based on market analysis",
                parameters: {
                  type: "object",
                  properties: {
                    market_regime: { type: "string", enum: ["bull", "bear", "sideways", "volatile"] },
                    confidence_score: { type: "number" },
                    summary: { type: "string" },
                    allocations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          symbol: { type: "string" },
                          name: { type: "string" },
                          allocation_type: { type: "string", enum: ["stable", "growth", "hedge"] },
                          target_percent: { type: "number" },
                          ai_score: { type: "number" },
                          signal: { type: "string" },
                          reasoning: { type: "string" },
                          stop_loss_percent: { type: "number" },
                          take_profit_percent: { type: "number" },
                        },
                        required: ["symbol", "name", "allocation_type", "target_percent", "reasoning"],
                      },
                    },
                  },
                  required: ["market_regime", "confidence_score", "allocations", "summary"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "propose_allocations" } },
        });
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        let proposals;
        try {
          proposals = JSON.parse(toolCall.function.arguments);
        } catch {
          return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Log the AI analysis
        await adminClient.from("auto_invest_ai_logs").insert({
          engine_id,
          analysis_type: "full_rebalance",
          market_regime: proposals.market_regime,
          signals_used: signalData.map(s => s.id),
          recommendations: { summary: proposals.summary },
          allocations_proposed: proposals.allocations,
          confidence_score: proposals.confidence_score,
          model_used: "google/gemini-2.5-flash",
        });

        // Update engine state
        await adminClient.from("auto_invest_engine").update({
          ai_confidence_score: proposals.confidence_score,
          ai_market_regime: proposals.market_regime,
          last_ai_analysis_at: new Date().toISOString(),
        }).eq("id", engine_id);

        return new Response(JSON.stringify({ success: true, proposals }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "execute_allocations": {
        // Apply proposed allocations to the engine
        if (!allocations || !engine_id) {
          return new Response(JSON.stringify({ error: "Missing allocations or engine_id" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Deactivate old allocations
        await adminClient.from("auto_invest_allocations")
          .update({ is_active: false })
          .eq("engine_id", engine_id);

        // Get engine capital
        const { data: engine } = await adminClient
          .from("auto_invest_engine")
          .select("total_capital")
          .eq("id", engine_id)
          .single();

        const capital = engine?.total_capital || 0;

        // Insert new allocations
        for (const alloc of allocations) {
          const value = capital * (alloc.target_percent / 100);
          await adminClient.from("auto_invest_allocations").insert({
            engine_id,
            asset_symbol: alloc.symbol,
            asset_name: alloc.name,
            allocation_type: alloc.allocation_type,
            target_percent: alloc.target_percent,
            current_percent: alloc.target_percent,
            value_usd: value,
            ai_score: alloc.ai_score || null,
            ai_signal: alloc.signal || null,
            ai_reasoning: alloc.reasoning,
            stop_loss_percent: alloc.stop_loss_percent || null,
            take_profit_percent: alloc.take_profit_percent || null,
          });

          // Log transaction
          await adminClient.from("auto_invest_transactions").insert({
            engine_id,
            transaction_type: "rebalance",
            asset_symbol: alloc.symbol,
            side: "buy",
            amount_usd: value,
            ai_triggered: true,
            ai_reason: alloc.reasoning,
            ai_confidence: alloc.ai_score,
          });
        }

        // Update engine
        await adminClient.from("auto_invest_engine").update({
          total_deployed: capital,
          last_rebalance_at: new Date().toISOString(),
          cycle_count: (await adminClient.from("auto_invest_engine").select("cycle_count").eq("id", engine_id).single()).data?.cycle_count + 1 || 1,
        }).eq("id", engine_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deposit": {
        if (!engine_id || !amount) {
          return new Response(JSON.stringify({ error: "Missing engine_id or amount" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update engine capital
        const { data: currentEngine } = await adminClient
          .from("auto_invest_engine")
          .select("total_capital")
          .eq("id", engine_id)
          .single();

        const newCapital = (currentEngine?.total_capital || 0) + amount;

        await adminClient.from("auto_invest_engine").update({
          total_capital: newCapital,
        }).eq("id", engine_id);

        // Log deposit transaction
        await adminClient.from("auto_invest_transactions").insert({
          engine_id,
          transaction_type: "deposit",
          amount_usd: amount,
          ai_triggered: false,
        });

        return new Response(JSON.stringify({ success: true, new_capital: newCapital }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("auto-invest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
