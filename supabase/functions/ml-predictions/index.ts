import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'AVAX/USDT', 'LINK/USDT', 'DOGE/USDT', 'DOT/USDT', 'MATIC/USDT', 'BNB/USDT', 'ATOM/USDT'];
const VALID_TIMEFRAMES = ['1h', '4h', '24h', '7d'];
const VALID_MODELS = ['LSTM', 'AR', 'Ensemble'];
const MAX_HISTORICAL_PRICES = 200;
const RATE_LIMIT_PER_HOUR = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Please sign in.' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: 'Invalid or expired session. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation
    const body = await req.json();
    const { symbol, timeframe, model, historicalPrices } = body;

    if (!symbol || typeof symbol !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Symbol is required (e.g., BTC/USDT).' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_SYMBOLS.includes(symbol)) {
      return new Response(
        JSON.stringify({ error: `Invalid symbol. Supported: ${VALID_SYMBOLS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!timeframe || !VALID_TIMEFRAMES.includes(timeframe)) {
      return new Response(
        JSON.stringify({ error: `Invalid timeframe. Supported: ${VALID_TIMEFRAMES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!model || !VALID_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({ error: `Invalid model. Supported: ${VALID_MODELS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate historicalPrices
    let validatedPrices: number[] | undefined;
    if (historicalPrices) {
      if (!Array.isArray(historicalPrices)) {
        return new Response(
          JSON.stringify({ error: 'historicalPrices must be an array of numbers.' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (historicalPrices.length > MAX_HISTORICAL_PRICES) {
        validatedPrices = historicalPrices.slice(-MAX_HISTORICAL_PRICES);
      } else {
        validatedPrices = historicalPrices;
      }
      // Validate each price is a number
      for (const p of validatedPrices) {
        if (typeof p !== 'number' || isNaN(p) || p < 0) {
          return new Response(
            JSON.stringify({ error: 'All historical prices must be positive numbers.' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Rate limiting
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabaseClient
      .from('ai_generation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'ml-predictions')
      .gte('created_at', oneHourAgo);

    const { data: extensions } = await supabaseClient
      .from('rate_limit_extensions')
      .select('extra_calls, calls_used')
      .eq('user_id', user.id)
      .eq('function_name', 'ml-predictions')
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
          error: `Rate limit exceeded: ${used}/${totalLimit} predictions used this hour.`,
          rate_limit: { used, limit: totalLimit, remaining: 0 },
          extension_available: {
            extra_calls: 10,
            surcharge_percent: 15,
            message: "Purchase 10 additional predictions at a 15% surcharge."
          }
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Log call
    await supabaseClient.from('ai_generation_logs').insert({
      user_id: user.id,
      function_name: 'ml-predictions'
    });

    const prompt = `You are a financial AI analyst specializing in cryptocurrency price prediction.
Based on the Bitcoin price forecasting research methodology (using LSTM for large datasets, AR for short-term):

Symbol: ${symbol}
Timeframe: ${timeframe}
Model Type: ${model}
Historical Prices: ${validatedPrices?.slice(-10).join(', ') || 'Not provided'}

Analyze the market conditions and provide a prediction. Return ONLY a valid JSON object with these exact fields:
{
  "predictedPrice": <number>,
  "confidence": <number 0-100>,
  "direction": "<bullish|bearish|neutral>",
  "analysis": "<string - brief 2-3 sentence market analysis>",
  "supportLevel": <number>,
  "resistanceLevel": <number>,
  "volatilityScore": <number 0-100>,
  "riskScore": <number 0-100>
}`;

    console.log(`Prediction request: ${symbol} ${model} ${timeframe} by user ${user.id}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a quantitative financial analyst. Respond ONLY with valid JSON, no markdown or explanation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is temporarily busy. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let prediction;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      prediction = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      prediction = {
        predictedPrice: validatedPrices?.[validatedPrices.length - 1] || 0,
        confidence: 50,
        direction: "neutral",
        analysis: "Unable to generate prediction at this time.",
        supportLevel: 0,
        resistanceLevel: 0,
        volatilityScore: 50,
        riskScore: 50
      };
    }

    return new Response(JSON.stringify({
      success: true,
      symbol,
      timeframe,
      model,
      prediction,
      rate_limit: { used: used + 1, limit: totalLimit, remaining: totalLimit - used - 1 },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(JSON.stringify({ 
      error: "An unexpected error occurred with the prediction service. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
