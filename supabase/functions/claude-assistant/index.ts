import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGES = 50;
const MAX_MESSAGE_CONTENT = 10000;
const MAX_SYSTEM_LENGTH = 2000;
const RATE_LIMIT_PER_HOUR = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation
    const body = await req.json();
    const { messages, system, model = "claude-sonnet-4-5" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required and cannot be empty.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `Too many messages: maximum ${MAX_MESSAGES} allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object' || !msg.role || !msg.content) {
        return new Response(
          JSON.stringify({ error: 'Each message must have role and content fields.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: `Invalid role: ${msg.role}. Must be "user" or "assistant".` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Message content must be a non-empty string.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (msg.content.length > MAX_MESSAGE_CONTENT) {
        return new Response(
          JSON.stringify({ error: `Message too long: maximum ${MAX_MESSAGE_CONTENT} characters.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate model whitelist
    const allowedModels = ['claude-sonnet-4-5', 'claude-haiku-4', 'claude-3-5-sonnet-20241022'];
    if (!allowedModels.includes(model)) {
      return new Response(
        JSON.stringify({ error: `Invalid model. Allowed: ${allowedModels.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sanitizedSystem = system;
    if (system && typeof system === 'string' && system.length > MAX_SYSTEM_LENGTH) {
      sanitizedSystem = system.substring(0, MAX_SYSTEM_LENGTH);
    }

    // Rate limiting
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabaseClient
      .from('ai_generation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'claude-assistant')
      .gte('created_at', oneHourAgo);

    const { data: extensions } = await supabaseClient
      .from('rate_limit_extensions')
      .select('extra_calls, calls_used')
      .eq('user_id', user.id)
      .eq('function_name', 'claude-assistant')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    let extraCalls = 0;
    if (extensions) {
      for (const ext of extensions) extraCalls += (ext.extra_calls - ext.calls_used);
    }

    const totalLimit = RATE_LIMIT_PER_HOUR + Math.max(0, extraCalls);
    const used = count || 0;

    if (used >= totalLimit) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded: ${used}/${totalLimit} calls used this hour.`,
          rate_limit: { used, limit: totalLimit, remaining: 0 },
          extension_available: {
            extra_calls: 10,
            surcharge_percent: 15,
            message: "Purchase 10 additional calls at a 15% surcharge."
          }
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Log call
    await supabaseClient.from('ai_generation_logs').insert({
      user_id: user.id,
      function_name: 'claude-assistant'
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: sanitizedSystem || "You are an expert AI assistant for a cryptocurrency and financial trading platform.",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service is temporarily busy. Please wait and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      content: data.content[0].text,
      model: data.model,
      usage: data.usage,
      rate_limit: { used: used + 1, limit: totalLimit, remaining: totalLimit - used - 1 }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Claude assistant error:", error);
    return new Response(JSON.stringify({ 
      error: "An unexpected error occurred. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
