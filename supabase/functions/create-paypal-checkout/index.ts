import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getPayPalBase(): string {
  const mode = Deno.env.get("PAYPAL_MODE") ?? "sandbox";
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!clientId || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured");

  const res = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function createOrder(amountUsd: number, userId: string, returnUrl: string, cancelUrl: string): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${getPayPalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `aiqtp-${userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: amountUsd.toFixed(2) },
        description: "AIQTP Platform Deposit",
        custom_id: userId,
      }],
      application_context: {
        brand_name: "AIQTP",
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal order creation failed: ${await res.text()}`);
  const order = await res.json();
  const approveLink = order.links?.find((l: { rel: string; href: string }) => l.rel === "approve");
  return { id: order.id, approveUrl: approveLink?.href ?? "" };
}

async function captureOrder(orderId: string): Promise<{ status: string; amountUsd: number; payerId: string | null }> {
  const token = await getAccessToken();
  const res = await fetch(`${getPayPalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${await res.text()}`);
  const data = await res.json();
  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  return {
    status: data.status,
    amountUsd: parseFloat(capture?.amount?.value ?? "0"),
    payerId: data.payer?.payer_id ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, amountUsd, returnUrl, cancelUrl, orderId } = body;

    if (action === "create") {
      if (!amountUsd || amountUsd < 20) throw new Error("Minimum deposit is $20");
      if (amountUsd > 10000) throw new Error("Maximum deposit is $10,000");
      const order = await createOrder(amountUsd, user.id, returnUrl, cancelUrl);
      return new Response(JSON.stringify(order), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "capture") {
      if (!orderId) throw new Error("orderId is required");
      const result = await captureOrder(orderId);

      if (result.status === "COMPLETED" && result.amountUsd > 0) {
        const adminSupabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await adminSupabase.rpc("credit_platform_deposit", {
          p_user_id: user.id,
          p_stripe_session_id: null,
          p_stripe_payment_intent_id: null,
          p_amount_usd: result.amountUsd,
          p_currency: "usd",
          p_environment: Deno.env.get("PAYPAL_MODE") === "live" ? "live" : "sandbox",
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("PayPal checkout error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
