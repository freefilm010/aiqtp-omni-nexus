import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { strategyId } = await req.json();
    if (!strategyId || typeof strategyId !== 'string') {
      return new Response(JSON.stringify({ error: 'strategyId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Rate limit: 20 enhancements per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabaseClient
      .from('ai_generation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'enhance-strategy')
      .gte('created_at', oneHourAgo);

    if (count && count >= 20) {
      return new Response(JSON.stringify({ error: 'Rate limit: 20 enhancements per hour' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch strategy
    const { data: strategy, error: fetchErr } = await supabaseClient
      .from('ai_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !strategy) {
      return new Response(JSON.stringify({ error: 'Strategy not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? Deno.env.get('ANTHROPIC_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are AIQTP RD-Agent, an expert quantitative strategy optimizer.
Your task: enhance and improve the following trading strategy to maximize profitability, reduce drawdown, and improve consistency.

RULES:
- Keep the core thesis but refine entry/exit logic
- Add missing risk controls (trailing stops, position sizing, correlation filters)
- Optimize parameters based on common market microstructure
- Add regime detection (trending vs ranging) adaptations
- Include at least 3 concrete improvements with explanations

Return a JSON object with:
{
  "enhanced_name": "Improved name",
  "enhanced_description": "What changed and why",
  "entry_rules": { "conditions": [...], "logic": "AND/OR", "improvements": ["..."] },
  "exit_rules": { "stop_loss": "...", "take_profit": "...", "trailing_stop": "...", "improvements": ["..."] },
  "risk_parameters": { "max_position_size": "...", "max_drawdown": "...", "diversification": "...", "improvements": ["..."] },
  "code": "# Enhanced Python-style implementation",
  "enhancement_notes": ["List of all improvements made"],
  "expected_improvement": { "profitability_delta": "+X%", "drawdown_reduction": "-X%", "sharpe_improvement": "+X" }
}`;

    const userPrompt = `Enhance and improve the following strategy:

Name: ${strategy.name}
Description: ${strategy.description || 'N/A'}
Entry Rules: ${JSON.stringify(strategy.entry_rules)}
Exit Rules: ${JSON.stringify(strategy.exit_rules)}
Risk Parameters: ${JSON.stringify(strategy.risk_parameters)}
Code: ${strategy.code || 'No code provided'}
Current Profitability: ${strategy.profitability_score || 'Not tested'}
Current Consistency: ${strategy.consistency_score || 'Not tested'}

Apply institutional-grade improvements. Make it production-ready for live trading.`;

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
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'AI rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI API error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    let enhanced;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      enhanced = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      enhanced = null;
    }

    if (!enhanced) {
      return new Response(JSON.stringify({ error: 'Failed to parse AI enhancement' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update strategy with enhanced version
    const { error: updateErr } = await supabaseClient
      .from('ai_strategies')
      .update({
        name: enhanced.enhanced_name || strategy.name,
        description: enhanced.enhanced_description || strategy.description,
        entry_rules: enhanced.entry_rules || strategy.entry_rules,
        exit_rules: enhanced.exit_rules || strategy.exit_rules,
        risk_parameters: enhanced.risk_parameters || strategy.risk_parameters,
        code: enhanced.code || strategy.code,
        status: 'enhanced',
      })
      .eq('id', strategyId);

    if (updateErr) throw updateErr;

    // Log generation
    await supabaseClient.from('ai_generation_logs').insert({
      user_id: user.id,
      function_name: 'enhance-strategy'
    });

    return new Response(JSON.stringify({
      success: true,
      enhancement_notes: enhanced.enhancement_notes || [],
      expected_improvement: enhanced.expected_improvement || {},
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('enhance-strategy error:', error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
