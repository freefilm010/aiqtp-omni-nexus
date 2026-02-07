import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionRequest {
  symbol: string;
  timeframe: '1h' | '4h' | '24h' | '7d';
  model: 'LSTM' | 'AR' | 'Ensemble';
  historicalPrices?: number[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user ${userId} accessing ml-predictions`);

    const { symbol, timeframe, model, historicalPrices } = await req.json() as PredictionRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare the prompt based on the research paper methodology
    const prompt = `You are a financial AI analyst specializing in cryptocurrency price prediction.
Based on the Bitcoin price forecasting research methodology (using LSTM for large datasets, AR for short-term):

Symbol: ${symbol}
Timeframe: ${timeframe}
Model Type: ${model}
Historical Prices: ${historicalPrices?.slice(-10).join(', ') || 'Not provided'}

Analyze the market conditions and provide a prediction. Return ONLY a valid JSON object with these exact fields:
{
  "predictedPrice": <number - your predicted price>,
  "confidence": <number 0-100 - your confidence level>,
  "direction": "<bullish|bearish|neutral>",
  "analysis": "<string - brief 2-3 sentence market analysis>",
  "supportLevel": <number - key support price>,
  "resistanceLevel": <number - key resistance price>,
  "volatilityScore": <number 0-100 - expected volatility>,
  "riskScore": <number 0-100 - risk assessment>
}`;

    console.log(`Processing prediction for ${symbol} using ${model} model`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a quantitative financial analyst. Respond ONLY with valid JSON, no markdown or explanation." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse the JSON response
    let prediction;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      prediction = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback prediction
      prediction = {
        predictedPrice: historicalPrices?.[historicalPrices.length - 1] || 0,
        confidence: 50,
        direction: "neutral",
        analysis: "Unable to generate prediction at this time.",
        supportLevel: 0,
        resistanceLevel: 0,
        volatilityScore: 50,
        riskScore: 50
      };
    }

    console.log(`Prediction generated for ${symbol}:`, prediction);

    return new Response(JSON.stringify({
      success: true,
      symbol,
      timeframe,
      model,
      prediction,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
