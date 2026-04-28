import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositBody {
  amountInCents: number;
  customerEmail?: string;
  userId: string;
  returnUrl: string;
  environment: StripeEnv;
}

async function createDepositCheckout(opts: DepositBody) {
  if (!opts.amountInCents || opts.amountInCents < 2000) {
    throw new Error("Minimum deposit is $20.00");
  }
  if (opts.amountInCents > 1_000_000) {
    throw new Error("Maximum deposit is $10,000.00");
  }
  if (!opts.userId) throw new Error("userId is required");

  const stripe = createStripeClient(opts.environment);
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "AIQTP Platform Deposit" },
        unit_amount: opts.amountInCents,
      },
      quantity: 1,
    }],
    mode: "payment",
    ui_mode: "embedded_page",
    return_url: opts.returnUrl,
    metadata: {
      userId: opts.userId,
      type: "platform_deposit",
      amount_usd: (opts.amountInCents / 100).toFixed(2),
    },
    ...(opts.customerEmail && { customer_email: opts.customerEmail }),
  } as any);
  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const body = await req.json() as DepositBody;
    if (body.environment !== 'sandbox' && body.environment !== 'live') {
      return new Response(JSON.stringify({ error: 'Invalid environment' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== body.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const clientSecret = await createDepositCheckout(body);
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('create-deposit-checkout error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});