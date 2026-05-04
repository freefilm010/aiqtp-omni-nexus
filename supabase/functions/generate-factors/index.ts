import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { callAI } from "../_shared/anthropic.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation constants
const VALID_FACTOR_TYPES = ['technical', 'fundamental', 'sentiment', 'alternative'];
const MAX_MARKET_DATA_LENGTH = 2000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { marketData, factorType = 'technical' } = requestBody;
    
    // Input validation
    if (!marketData || typeof marketData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid marketData: must be an object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const marketDataString = JSON.stringify(marketData);
    if (marketDataString.length > MAX_MARKET_DATA_LENGTH) {
      return new Response(
        JSON.stringify({ error: `marketData too large: maximum ${MAX_MARKET_DATA_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!VALID_FACTOR_TYPES.includes(factorType)) {
      return new Response(
        JSON.stringify({ error: `Invalid factorType: must be one of ${VALID_FACTOR_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    
    // Rate limiting: Check recent generations (10 per hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: rateLimitError } = await supabaseClient
      .from('ai_generation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'generate-factors')
      .gte('created_at', oneHourAgo);
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }
    
    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded: Maximum 10 factor generations per hour' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // System prompt for AIQTP RD-Agent factor generation
    const systemPrompt = `You are AIQTP RD-Agent, an advanced AI quantitative trading research assistant. 
Your role is to generate innovative trading factors based on market data.

For ${factorType} factors:
- Technical: Price patterns, momentum, volatility indicators
- Fundamental: Financial ratios, earnings metrics
- Sentiment: News analysis, social media signals
- Alternative: Non-traditional data sources

Generate 1-3 novel factors with:
1. Name (concise, descriptive)
2. Description (what it measures and why it's valuable)
3. Formula/Code (Python-style pseudocode)
4. Parameters (configurable values)

Return as JSON array: [{"name": "...", "description": "...", "code": "...", "parameters": {...}}]`;

    const userPrompt = `Generate ${factorType} trading factors based on this market context:
${JSON.stringify(marketData, null, 2)}

Focus on creating factors that are:
- Theoretically sound
- Practically implementable
- Novel but not overfitted
- Clearly interpretable`;

    console.log('Calling AI for factor generation...');

    const aiResult = await callAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    const generatedText = aiResult.choices[0].message.content;
    
    console.log('AI generated factors:', generatedText);
    
    // Parse AI response to extract factors
    let factors = [];
    try {
      // Try to extract JSON from response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        factors = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured factors from text
        factors = [{
          name: `${factorType.charAt(0).toUpperCase() + factorType.slice(1)} Factor`,
          description: generatedText.substring(0, 200),
          code: '# AI-generated factor code\n' + generatedText.substring(0, 500),
          parameters: { lookback_period: 20, threshold: 0.5 }
        }];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      factors = [{
        name: 'Generated Factor',
        description: generatedText.substring(0, 200),
        code: generatedText,
        parameters: {}
      }];
    }

    // Log this generation for rate limiting
    await supabaseClient
      .from('ai_generation_logs')
      .insert({
        user_id: user.id,
        function_name: 'generate-factors'
      });

    // Save factors to database
    const savedFactors = [];
    for (const factor of factors) {
      const { data, error } = await supabaseClient
        .from('ai_factors')
        .insert({
          user_id: user.id,
          name: factor.name,
          description: factor.description,
          factor_type: factorType,
          code: factor.code,
          parameters: factor.parameters || {},
          performance_metrics: { generated_at: new Date().toISOString() }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving factor:', error);
      } else {
        savedFactors.push(data);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        factors: savedFactors,
        raw_response: generatedText 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-factors:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});