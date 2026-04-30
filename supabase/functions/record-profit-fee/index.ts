import { createClient } from "npm:@supabase/supabase-js@2";

// Service-only function. Trade execution / settlement code calls this with the
// service role key after a profitable trade closes.
// Body: { userId, rentalId?, grossProfitUsd, tradeRef?, symbol? }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Only the platform itself (using the service role) may record fees.
    if (!auth.includes(serviceKey)) {
      return new Response(JSON.stringify({ error: 'Service role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);
    const { userId, rentalId, grossProfitUsd, tradeRef, symbol } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const profit = Number(grossProfitUsd);
    if (!Number.isFinite(profit) || profit <= 0) {
      return new Response(JSON.stringify({ error: 'grossProfitUsd must be > 0' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('record_profit_fee', {
      p_user_id: userId,
      p_rental_id: rentalId ?? null,
      p_gross_profit_usd: profit,
      p_trade_ref: tradeRef ?? null,
      p_symbol: symbol ?? null,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ feeEventId: data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('record-profit-fee error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
