import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation constants
const MAX_FACTOR_IDS = 10;
const MAX_USER_GOALS_LENGTH = 500;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { factorIds, userGoals } = requestBody;
    
    // Input validation
    if (!factorIds || !Array.isArray(factorIds) || factorIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid factorIds: must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (factorIds.length > MAX_FACTOR_IDS) {
      return new Response(
        JSON.stringify({ error: `Too many factors: maximum ${MAX_FACTOR_IDS} factors allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate each factorId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of factorIds) {
      if (typeof id !== 'string' || !uuidRegex.test(id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid factorId format: must be valid UUIDs' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (userGoals && typeof userGoals === 'string' && userGoals.length > MAX_USER_GOALS_LENGTH) {
      return new Response(
        JSON.stringify({ error: `userGoals too long: maximum ${MAX_USER_GOALS_LENGTH} characters` }),
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
      .eq('function_name', 'generate-strategy')
      .gte('created_at', oneHourAgo);
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }
    
    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded: Maximum 10 strategy generations per hour' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch selected factors
    const { data: factors, error: factorsError } = await supabaseClient
      .from('ai_factors')
      .select('*')
      .in('id', factorIds || [])
      .eq('user_id', user.id);

    if (factorsError) {
      throw factorsError;
    }

    const systemPrompt = `You are AIQTP RD-Agent, an expert quantitative trading strategy architect.
Create a complete trading strategy that combines the provided factors into actionable entry/exit rules.

Return a JSON object with this structure:
{
  "name": "Strategy Name",
  "description": "What the strategy does",
  "entry_rules": {
    "conditions": ["list of entry conditions"],
    "logic": "AND/OR combination logic"
  },
  "exit_rules": {
    "stop_loss": "percentage or rule",
    "take_profit": "percentage or rule",
    "trailing_stop": "optional trailing stop rule"
  },
  "risk_parameters": {
    "max_position_size": "percentage of portfolio",
    "max_drawdown": "maximum acceptable drawdown",
    "diversification": "number of concurrent positions"
  },
  "code": "# Python-style implementation"
}`;

    const userPrompt = `Create a trading strategy using these factors:
${JSON.stringify(factors, null, 2)}

User goals: ${userGoals || 'Balanced risk-return profile with moderate drawdown tolerance'}

The strategy should be:
- Clear and actionable
- Risk-aware with proper position sizing
- Backtestable
- Practical for real trading`;

    console.log('Calling Lovable AI for strategy generation...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;
    
    console.log('AI generated strategy:', generatedText);
    
    // Parse AI response
    let strategy;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        strategy = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback structure
        strategy = {
          name: 'AI-Generated Strategy',
          description: generatedText.substring(0, 300),
          entry_rules: { conditions: ['Factor-based signal'], logic: 'AND' },
          exit_rules: { stop_loss: '2%', take_profit: '5%' },
          risk_parameters: { max_position_size: '5%', max_drawdown: '10%', diversification: '5' },
          code: generatedText
        };
      }
    } catch (parseError) {
      console.error('Error parsing strategy:', parseError);
      strategy = {
        name: 'Generated Strategy',
        description: generatedText.substring(0, 300),
        entry_rules: { conditions: ['Generated rules'], logic: 'AND' },
        exit_rules: { stop_loss: '2%', take_profit: '5%' },
        risk_parameters: { max_position_size: '5%', max_drawdown: '10%', diversification: '5' },
        code: generatedText
      };
    }

    // Log this generation for rate limiting
    await supabaseClient
      .from('ai_generation_logs')
      .insert({
        user_id: user.id,
        function_name: 'generate-strategy'
      });

    // Save strategy to database
    const { data: savedStrategy, error: saveError } = await supabaseClient
      .from('ai_strategies')
      .insert({
        user_id: user.id,
        name: strategy.name,
        description: strategy.description,
        status: 'draft',
        factors: factorIds || [],
        entry_rules: strategy.entry_rules,
        exit_rules: strategy.exit_rules,
        risk_parameters: strategy.risk_parameters,
        code: strategy.code
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        strategy: savedStrategy,
        raw_response: generatedText 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-strategy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});