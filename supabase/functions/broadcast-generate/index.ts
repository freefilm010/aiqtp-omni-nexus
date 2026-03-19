import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, logGeneration, rateLimitResponse } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const rateLimitResult = await checkRateLimit(serviceClient, user.id, 'broadcast-generate', 15);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse('broadcast-generate', rateLimitResult);
    }

    // serviceClient already created above for rate limiting

    const body = await req.json().catch(() => ({}));
    const contentType = body.type || "market_update";

    const systemPrompt = `You are the AI broadcast engine for AIQTP™ (www.aiqtp.com), an institutional-grade AI Quantum Trading Platform. Generate real-time financial broadcast content like Bloomberg TV. 

Your job: Create professional, actionable market updates covering:
- Market movements (stocks, crypto, forex, commodities)
- Economic calendar events (FOMC, CPI, NFP, GDP)
- IPO/ICO announcements
- Technical pattern alerts (breakouts, reversals)
- Earnings reports and surprises
- Breaking financial news

Return a JSON array of 5 broadcast items. Each item must have:
- "content_type": "text" | "alert" | "analysis"
- "title": concise headline (max 80 chars)
- "body": 2-3 sentence summary with specific numbers/data
- "category": "market_update" | "breaking_news" | "economic_calendar" | "ipo_ico" | "pattern_alert" | "earnings"
- "priority": 1-10 (10 = most urgent)

Make it sound like a professional financial news anchor. Use real market context. Include specific tickers, percentages, and price levels.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate 5 ${contentType.replace("_", " ")} broadcast items for right now (${new Date().toISOString()}). Focus on current market conditions and upcoming events.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_broadcasts",
            description: "Create broadcast content items",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      content_type: { type: "string", enum: ["text", "alert", "analysis"] },
                      title: { type: "string" },
                      body: { type: "string" },
                      category: { type: "string", enum: ["market_update", "breaking_news", "economic_calendar", "ipo_ico", "pattern_alert", "earnings"] },
                      priority: { type: "number" },
                    },
                    required: ["content_type", "title", "body", "category", "priority"],
                  },
                },
              },
              required: ["items"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_broadcasts" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const parsed = JSON.parse(toolCall.function.arguments);
    const items = parsed.items || [];

    // Insert into broadcast_content
    const now = new Date().toISOString();
    const rows = items.map((item: any) => ({
      content_type: item.content_type,
      title: item.title,
      body: item.body,
      category: item.category,
      priority: item.priority,
      source: "ai_generated",
      is_published: true,
      published_at: now,
    }));

    const { error: insertError } = await serviceClient.from("broadcast_content").insert(rows);
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
