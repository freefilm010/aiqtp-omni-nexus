import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Per-symbol maximum amount per single faucet claim. Symbols not listed fall
// back to DEFAULT_MAX. The DB function `credit_faucet_claim` also enforces a
// hard cap as a defense-in-depth layer.
const DEFAULT_MAX = 100;
const MAX_FAUCET_AMOUNTS: Record<string, number> = {
  QTC: 100,
  AIQ: 50,
  NXS: 50,
  QAQI: 100,
  AIQTP: 100,
  tBTC: 0.01,
  tETH: 0.1,
  tSOL: 1,
  tUSDC: 100,
  tUSDT: 100,
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
    const action = typeof body?.action === 'string' ? body.action : 'claim';

    // Service-role client for privileged RPCs
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (action === 'claim') {
      const symbol = typeof body?.symbol === 'string' ? body.symbol : null;
      const amount = Number(body?.amount);
      const chain = typeof body?.chain === 'string' ? body.chain : null;
      if (!symbol || !chain || !Number.isFinite(amount) || amount <= 0) {
        return new Response(JSON.stringify({ error: 'symbol, amount, chain required' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const maxAllowed = MAX_FAUCET_AMOUNTS[symbol] ?? DEFAULT_MAX;
      if (amount > maxAllowed) {
        return new Response(
          JSON.stringify({ error: `Faucet limit exceeded for ${symbol}. Max ${maxAllowed} per claim.` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
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
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'increment_engine') {
      const engineId = typeof body?.engineId === 'string' ? body.engineId : null;
      const capitalDelta = Number(body?.capitalDelta);
      const deployedDelta = Number(body?.deployedDelta);
      if (!engineId || !Number.isFinite(capitalDelta) || !Number.isFinite(deployedDelta)) {
        return new Response(JSON.stringify({ error: 'engineId, capitalDelta, deployedDelta required' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Verify the engine belongs to the caller before incrementing.
      const { data: engine } = await admin
        .from('auto_invest_engine')
        .select('id')
        .eq('id', engineId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!engine) {
        return new Response(JSON.stringify({ error: 'Engine not found or not yours' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error: incErr } = await admin.rpc('increment_engine_totals', {
        p_engine_id: engineId,
        p_capital_delta: capitalDelta,
        p_deployed_delta: deployedDelta,
      });
      if (incErr) {
        return new Response(JSON.stringify({ error: incErr.message }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('faucet-credit error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});