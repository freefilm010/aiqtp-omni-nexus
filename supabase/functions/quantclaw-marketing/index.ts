import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, logGeneration, rateLimitResponse } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketingRequest {
  action: "generate_post" | "generate_campaign" | "generate_content" | "generate_store_listing" | "schedule_campaign";
  platform?: string; // twitter, linkedin, threads, blog, email
  topic?: string;
  campaignType?: string; // airdrop, referral, influencer, launch, newsletter
  tone?: string; // professional, casual, hype, educational
  targetAudience?: string;
  scheduleAt?: string;
  webhookUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin-only
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient
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

    // Rate limiting (admin still has limits to prevent runaway costs)
    const rateLimitResult = await checkRateLimit(serviceClient, user.id, 'quantclaw-marketing', 20);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse('quantclaw-marketing', rateLimitResult);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body: MarketingRequest = await req.json();
    const { action, platform, topic, campaignType, tone, targetAudience } = body;

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_post":
        systemPrompt = `You are the marketing AI for AIQTP (www.aiqtp.com) — an AI Quantum Trading Platform with $QTC token, quantum computing via IBM Quantum, autonomous trading agents (QAQI, QuantClaw, HiveMind Swarm), NFT studio, and DeFi tools. Generate social media posts that drive engagement and signups. Include relevant hashtags. Keep it authentic, not spammy.`;
        userPrompt = `Generate a ${platform || "Twitter"} post about: ${topic || "platform features"}. Tone: ${tone || "professional"}. Target: ${targetAudience || "crypto traders and quant developers"}.`;
        break;

      case "generate_campaign":
        systemPrompt = `You are the growth marketing strategist for AIQTP (www.aiqtp.com). Design comprehensive marketing campaigns with specific KPIs, timelines, copy, and channel strategies. The platform features: $QTC token mining, quantum-powered AI trading, strategy marketplace, NFT creator, copy trading, and institutional services.`;
        userPrompt = `Design a ${campaignType || "launch"} campaign for AIQTP. Include: 1) Campaign name & tagline, 2) Target audience, 3) Channel strategy (social, email, partnerships), 4) 7-day content calendar, 5) KPIs and success metrics, 6) Budget recommendations, 7) Ready-to-use copy for 3 channels. Tone: ${tone || "professional"}.`;
        break;

      case "generate_content":
        systemPrompt = `You are the content writer for AIQTP (www.aiqtp.com). Write high-quality, SEO-optimized content that establishes thought leadership in quantum computing, AI trading, and DeFi.`;
        userPrompt = `Write a ${platform || "blog"} post about: ${topic || "the future of quantum-powered trading"}. Length: 800-1200 words. Include: introduction, 3-4 key sections with headers, conclusion with CTA to sign up at www.aiqtp.com. Tone: ${tone || "educational"}.`;
        break;

      case "generate_store_listing":
        systemPrompt = `You are an ASO (App Store Optimization) expert for AIQTP (www.aiqtp.com) — an AI Quantum Trading Platform. Generate optimized store listing content for maximum discoverability and conversion. The platform features: $QTC token, quantum computing via IBM Quantum, autonomous trading agents (QAQI, QuantClaw, HiveMind Swarm), NFT studio, copy trading, strategy marketplace, and DeFi tools.`;
        userPrompt = `Generate a complete app store / directory listing for AIQTP targeting: ${platform || "all directories"}. Include:
1) App Title (max 50 chars)
2) Short Description (max 80 chars)
3) Full Description (max 4000 chars, with feature bullets)
4) Keywords (comma-separated, max 100 chars)
5) Category suggestions
6) What's New section
7) Feature highlights (5-8 bullet points)
Topic context: ${topic || "general platform features"}.`;
        break;

      case "schedule_campaign":
        // Store campaign and optionally trigger webhook
        await serviceClient.from("automation_templates").insert({
          name: `Campaign: ${topic || "Marketing Push"}`,
          category: "marketing",
          subcategory: campaignType || "general",
          trigger_type: "scheduled",
          action_type: "multi_channel_post",
          schedule: body.scheduleAt || new Date().toISOString(),
          webhook_url: body.webhookUrl || null,
          is_active: true,
          is_system: false,
          user_id: user.id,
          description: `Auto-scheduled ${campaignType} campaign targeting ${targetAudience || "all users"}`,
        });

        return new Response(JSON.stringify({
          status: "scheduled",
          campaign: topic,
          scheduledAt: body.scheduleAt || "immediate",
          message: "Campaign template created. Connect n8n/Zapier webhook to automate posting.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({
      action,
      platform: platform || "general",
      content,
      generated_at: new Date().toISOString(),
      usage: aiData.usage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Marketing error:", error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
