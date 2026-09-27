import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_PRICE_IDS = new Set([
  'premium_monthly',
  'premium_yearly',
  'signals_monthly',
  'api_monthly',
]);

interface SubscriptionBody {
  priceId: string;
  customerEmail?: string;
  userId: string;
  returnUrl: string;
  environment: StripeEnv;
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

async function createSubscriptionCheckout(opts: SubscriptionBody) {
  if (!ALLOWED_PRICE_IDS.has(opts.priceId)) throw new Error("Unknown priceId");
  if (!opts.userId) throw new Error("userId is required");

  const stripe = createStripeClient(opts.environment);

  const prices = await stripe.prices.list({ lookup_keys: [opts.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];

  const customerId = await resolveOrCreateCustomer(stripe, {
    email: opts.customerEmail,
    userId: opts.userId,
  });

  // Prevent duplicate active subscriptions to the same price
  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 100,
  });
  const dupe = existing.data.find((s) =>
    s.items.data.some((i) => i.price.id === stripePrice.id),
  );
  if (dupe) throw new Error("You already have an active subscription to this plan");

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    mode: "subscription",
    ui_mode: "embedded_page",
    return_url: opts.returnUrl,
    customer: customerId,
    // Full compliance handling: tax calculation/collection/filing, fraud
    // protection, dispute handling for buyers in supported countries.
    managed_payments: { enabled: true },
    metadata: { userId: opts.userId, type: "platform_subscription" },
    subscription_data: { metadata: { userId: opts.userId } },
  } as any);
  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const body = await req.json() as SubscriptionBody;
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
    if (body.environment === 'live' && !Deno.env.get('STRIPE_LIVE_API_KEY')) {
      return new Response(JSON.stringify({
        code: 'PAYMENTS_NOT_ACTIVATED',
        error: 'Subscriptions are not activated for real payments yet. Account activation with the payment provider must be completed first.',
      }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const clientSecret = await createSubscriptionCheckout(body);
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('create-subscription-checkout error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
