import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { strategyId } = await req.json();
    if (!strategyId || typeof strategyId !== 'string') {
      return new Response(JSON.stringify({ error: 'strategyId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('rent_strategy', { p_strategy_id: strategyId });
    if (error) throw error;

    // Record rental revenue (non-fatal)
    if (data) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data: rental } = await admin
        .from('strategy_rentals')
        .select('monthly_price')
        .eq('id', data)
        .maybeSingle();
      const fee = Number(rental?.monthly_price ?? 0) * 0.20; // 20% platform cut
      if (fee > 0) {
        const { error: revErr } = await admin.from('platform_revenue').insert({
          source_type: 'commission',
          source_category: 'strategy_rental',
          amount: fee,
          currency: 'USD',
          status: 'pending',
          metadata: { rental_id: data, strategy_id: strategyId, user_id: user.id },
        });
        if (revErr) console.error('platform_revenue (rental) insert failed:', revErr.message);
      }
    }

    return new Response(JSON.stringify({ rentalId: data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('rent-strategy error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
