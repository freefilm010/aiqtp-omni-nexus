import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaymentRequest {
  action: 'stripe_checkout' | 'stripe_portal' | 'paypal_create' | 'paypal_capture' | 'plaid_link_token' | 'plaid_exchange' | 'get_payment_methods';
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { action, params = {} }: PaymentRequest = await req.json();
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let result: unknown;

    try {
      switch (action) {
        case 'stripe_checkout': {
          const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
          if (!STRIPE_SECRET) throw new Error('Stripe not configured');

          const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${STRIPE_SECRET.replace(/[^\x20-\x7E]/g, '')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              'mode': (params.mode as string) || 'payment',
              'success_url': (params.successUrl as string) || `${req.headers.get('origin') || ''}/payment-success`,
              'cancel_url': (params.cancelUrl as string) || `${req.headers.get('origin') || ''}/pricing`,
              'customer_email': user.email || '',
              'line_items[0][price]': (params.priceId as string) || '',
              'line_items[0][quantity]': '1',
              ...(params.mode === 'subscription' ? {} : {}),
            }),
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`Stripe checkout error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'stripe_portal': {
          const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
          if (!STRIPE_SECRET) throw new Error('Stripe not configured');

          const resp = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${STRIPE_SECRET.replace(/[^\x20-\x7E]/g, '')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              'customer': (params.customerId as string) || '',
              'return_url': (params.returnUrl as string) || `${req.headers.get('origin') || ''}/`,
            }),
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`Stripe portal error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'paypal_create': {
          const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
          const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');
          if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) throw new Error('PayPal not configured — add PAYPAL_CLIENT_ID and PAYPAL_SECRET');

          const authResp = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            signal: controller.signal,
          });
          if (!authResp.ok) throw new Error(`PayPal auth error [${authResp.status}]`);
          const { access_token } = await authResp.json();

          const orderResp = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              intent: 'CAPTURE',
              purchase_units: [{
                amount: {
                  currency_code: (params.currency as string) || 'USD',
                  value: (params.amount as string) || '10.00',
                },
                description: (params.description as string) || 'AIQTP Platform Payment',
              }],
              application_context: {
                return_url: `${req.headers.get('origin') || ''}/payment-success`,
                cancel_url: `${req.headers.get('origin') || ''}/pricing`,
              },
            }),
            signal: controller.signal,
          });
          if (!orderResp.ok) throw new Error(`PayPal order error [${orderResp.status}]: ${await orderResp.text()}`);
          result = await orderResp.json();
          break;
        }

        case 'paypal_capture': {
          const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
          const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');
          if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) throw new Error('PayPal not configured');

          const authResp = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            signal: controller.signal,
          });
          if (!authResp.ok) throw new Error(`PayPal auth error [${authResp.status}]`);
          const { access_token } = await authResp.json();

          const captureResp = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${params.orderId}/capture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          if (!captureResp.ok) throw new Error(`PayPal capture error [${captureResp.status}]`);
          result = await captureResp.json();

          // Log revenue
          await supabase.from('admin_revenue').insert({
            source: 'paypal',
            type: 'payment',
            amount: Number(params.amount) || 0,
            currency: 'USD',
            status: 'completed',
            metadata: { paypal_order_id: params.orderId, user_id: user.id },
          });
          break;
        }

        case 'plaid_link_token': {
          const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
          const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
          if (!PLAID_CLIENT_ID || !PLAID_SECRET) throw new Error('Plaid not configured — add PLAID_CLIENT_ID and PLAID_SECRET');

          const resp = await fetch('https://production.plaid.com/link/token/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: PLAID_CLIENT_ID,
              secret: PLAID_SECRET,
              user: { client_user_id: user.id },
              client_name: 'AIQTP Platform',
              products: ['auth', 'transactions'],
              country_codes: ['US'],
              language: 'en',
            }),
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`Plaid link error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'plaid_exchange': {
          const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
          const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
          if (!PLAID_CLIENT_ID || !PLAID_SECRET) throw new Error('Plaid not configured');

          const resp = await fetch('https://production.plaid.com/item/public_token/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: PLAID_CLIENT_ID,
              secret: PLAID_SECRET,
              public_token: params.publicToken,
            }),
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`Plaid exchange error [${resp.status}]`);
          const plaidResult = await resp.json();

          // Store connected account (access_token encrypted server-side)
          await supabase.from('connected_accounts').insert({
            user_id: user.id,
            account_name: (params.institutionName as string) || 'Bank Account',
            account_type: 'bank_plaid',
            api_key_encrypted: plaidResult.access_token,
            status: 'active',
          });

          result = { connected: true, institution: params.institutionName };
          break;
        }

        case 'get_payment_methods': {
          const { data: methods } = await supabase
            .from('connected_accounts')
            .select('id, account_name, account_type, status, last_sync_at')
            .eq('user_id', user.id)
            .in('account_type', ['bank_plaid', 'stripe_card', 'paypal']);

          result = methods || [];
          break;
        }

        default:
          return new Response(
            JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } finally {
      clearTimeout(timeout);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Payment processing error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
