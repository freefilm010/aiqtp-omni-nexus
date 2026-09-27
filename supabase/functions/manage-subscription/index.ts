import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Customer-selected cancellation options:
//  - "period_end": keep access until the paid period ends (cancel_at_period_end)
//  - "immediate": revoke access now, no refund
//  - "immediate_prorated": revoke now and issue a prorated refund for unused time
type CancelMode = 'period_end' | 'immediate' | 'immediate_prorated';

interface ManageBody {
  action: 'cancel' | 'reactivate' | 'change_plan';
  subscriptionId: string; // stripe subscription id
  cancelMode?: CancelMode;
  newPriceId?: string; // for change_plan
  environment: StripeEnv;
}

const ALLOWED_PRICE_IDS = new Set([
  'premium_monthly',
  'premium_yearly',
  'signals_monthly',
  'api_monthly',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const body = await req.json() as ManageBody;
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
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the subscription belongs to this user (ownership check)
    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: sub } = await service
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id, status')
      .eq('stripe_subscription_id', body.subscriptionId)
      .eq('user_id', user.id)
      .eq('environment', body.environment)
      .maybeSingle();
    if (!sub) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = createStripeClient(body.environment);

    if (body.action === 'cancel') {
      const mode: CancelMode = body.cancelMode || 'period_end';
      if (mode === 'period_end') {
        await stripe.subscriptions.update(body.subscriptionId, { cancel_at_period_end: true });
      } else {
        const canceled = await stripe.subscriptions.cancel(body.subscriptionId, {
          prorate: mode === 'immediate_prorated',
          invoice_now: mode === 'immediate_prorated',
        } as any);
        void canceled;
      }
      return new Response(JSON.stringify({ ok: true, mode }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'reactivate') {
      await stripe.subscriptions.update(body.subscriptionId, { cancel_at_period_end: false });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'change_plan') {
      if (!body.newPriceId || !ALLOWED_PRICE_IDS.has(body.newPriceId)) {
        return new Response(JSON.stringify({ error: 'Unknown newPriceId' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const prices = await stripe.prices.list({ lookup_keys: [body.newPriceId] });
      if (!prices.data.length) throw new Error('Price not found');
      const newPrice = prices.data[0];

      const stripeSub = await stripe.subscriptions.retrieve(body.subscriptionId);
      const itemId = stripeSub.items.data[0]?.id;
      if (!itemId) throw new Error('Subscription item not found');

      // Customer-selected plan change: immediate switch with prorated
      // charge/credit for the difference.
      await stripe.subscriptions.update(body.subscriptionId, {
        items: [{ id: itemId, price: newPrice.id }],
        proration_behavior: 'create_prorations',
      });
      return new Response(JSON.stringify({ ok: true, newPriceId: body.newPriceId }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('manage-subscription error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
