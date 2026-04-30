import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller and get their user id
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const symbol = typeof body?.symbol === 'string' ? body.symbol : null;
    const amount = Number(body?.amount);
    const chain = typeof body?.chain === 'string' ? body.chain : null;
    const engineId = typeof body?.engineId === 'string' ? body.engineId : null;
    const capitalDelta = body?.capitalDelta != null ? Number(body.capitalDelta) : null;
    const deployedDelta = body?.deployedDelta != null ? Number(body.deployedDelta) : null;

    if (!symbol || !chain || !Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'symbol, amount, chain required' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client for privileged RPCs
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { error: creditErr } = await admin.rpc('credit_faucet_claim', {
      p_user_id: user.id,
      p_symbol: symbol,
      p_amount: amount,
      p_chain: chain,
    });
    if (creditErr) {
      return new Response(JSON.stringify({ error: creditErr.message }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (engineId && Number.isFinite(capitalDelta) && Number.isFinite(deployedDelta)) {
      // Verify the engine belongs to this caller before incrementing.
      const { data: engine } = await admin
        .from('auto_invest_engine')
        .select('id')
        .eq('id', engineId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (engine) {
        const { error: incErr } = await admin.rpc('increment_engine_totals', {
          p_engine_id: engineId,
          p_capital_delta: capitalDelta,
          p_deployed_delta: deployedDelta,
        });
        if (incErr) console.error('increment_engine_totals error:', incErr);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('faucet-credit error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});