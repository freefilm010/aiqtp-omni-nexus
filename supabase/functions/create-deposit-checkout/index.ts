import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

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
  if (!opts.amountInCents || opts.amountInCents < 500) {
    throw new Error("Minimum deposit is $5.00");
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
    ui_mode: "embedded",
    return_url: opts.returnUrl,
    managed_payments: { enabled: true },
    metadata: {
      userId: opts.userId,
      type: "platform_deposit",
      amount_usd: (opts.amountInCents / 100).toFixed(2),
      managed_payments: "true",
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