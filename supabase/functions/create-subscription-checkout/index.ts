// create-subscription-checkout
//
// Opens a Stripe Checkout session in subscription mode for the Signals Pro
// product family (or any future recurring AIQTP product). Mirrors the
// `create-deposit-checkout` edge function but with mode='subscription'.
//
// Allowed price IDs are kept in an env-var allowlist (STRIPE_SUB_PRICE_IDS,
// comma-separated) to prevent a malicious client from spinning up a
// checkout against an arbitrary Stripe price they shouldn't have access to.

import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionCheckoutBody {
  priceId: string;
  userId: string;
  customerEmail?: string;
  returnUrl: string;
  environment: StripeEnv;
  tier?: string;
}

function parseAllowlist(): Set<string> {
  const raw = Deno.env.get("STRIPE_SUB_PRICE_IDS") ?? "";
  return new Set(
    raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0),
  );
}

async function createSubscriptionCheckout(opts: SubscriptionCheckoutBody) {
  if (!opts.userId) throw new Error("userId is required");
  if (!opts.priceId) throw new Error("priceId is required");
  if (!opts.returnUrl) throw new Error("returnUrl is required");

  const allowlist = parseAllowlist();
  if (allowlist.size > 0 && !allowlist.has(opts.priceId)) {
    throw new Error(`priceId ${opts.priceId} is not in the configured allowlist`);
  }

  const stripe = createStripeClient(opts.environment);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ui_mode: "embedded",
    line_items: [{ price: opts.priceId, quantity: 1 }],
    return_url: opts.returnUrl,
    metadata: {
      userId: opts.userId,
      tier: opts.tier ?? "",
      type: "platform_subscription",
    },
    subscription_data: {
      metadata: {
        userId: opts.userId,
        tier: opts.tier ?? "",
      },
    },
    ...(opts.customerEmail ? { customer_email: opts.customerEmail } : {}),
  } as unknown as Parameters<typeof stripe.checkout.sessions.create>[0]);

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json() as SubscriptionCheckoutBody;
    if (body.environment !== "sandbox" && body.environment !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      { global: { headers: { Authorization: authHeader! } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== body.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientSecret = await createSubscriptionCheckout(body);
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-subscription-checkout error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
