import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed pricing plans with server-side price validation
const ALLOWED_PLANS: Record<string, { amount: number; mode: "payment" | "subscription"; interval?: string }> = {
  "starter":        { amount: 49,  mode: "payment" },
  "deposit-20":     { amount: 20,  mode: "payment" },
  "deposit-50":     { amount: 50,  mode: "payment" },
  "deposit-100":    { amount: 100, mode: "payment" },
  "deposit-500":    { amount: 500, mode: "payment" },
  "qaqi-monthly":   { amount: 12,  mode: "subscription", interval: "month" },
  "qaqi-annual":    { amount: 100, mode: "subscription", interval: "year" },
  "pro-monthly":    { amount: 19,  mode: "subscription", interval: "month" },
  "pro-annual":     { amount: 190, mode: "subscription", interval: "year" },
  "enterprise-monthly": { amount: 99, mode: "subscription", interval: "month" },
  "enterprise-annual":  { amount: 990, mode: "subscription", interval: "year" },
  "elite-monthly":  { amount: 299, mode: "subscription", interval: "month" },
  "institutional":  { amount: 999, mode: "subscription", interval: "month" },
};

// Also allow custom deposit amounts (validated server-side)
const MIN_DEPOSIT = 5;
const MAX_DEPOSIT = 10000;

interface CheckoutRequest {
  planId: string;
  successUrl: string;
  cancelUrl: string;
  // Legacy fields kept for backward compat but server validates price
  priceId?: string;
  amount?: number;
  productName?: string;
  productDescription?: string;
  mode?: "payment" | "subscription";
  customerEmail?: string;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      throw new Error("Payment system not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body: CheckoutRequest = await req.json();
    const { planId, successUrl, cancelUrl, priceId, metadata } = body;

    // 2. Validate URLs - must be same origin
    const allowedOrigins = [
      "https://www.aiqtp.com",
      "https://aiqtp.com",
      "https://aiqtp.lovable.app",
    ];
    const isValidUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        return allowedOrigins.some(o => parsed.origin === o) ||
          parsed.origin.endsWith(".lovable.app");
      } catch { return false; }
    };
    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid redirect URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Build line items with server-side price validation
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
    let mode: "payment" | "subscription";

    if (priceId) {
      // Use existing Stripe price ID (already validated by Stripe)
      lineItems = [{ price: priceId, quantity: 1 }];
      mode = body.mode || "payment";
    } else if (planId && ALLOWED_PLANS[planId]) {
      // Validate against server-side plan definitions
      const plan = ALLOWED_PLANS[planId];
      mode = plan.mode;
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `AIQTP ${planId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
          },
          unit_amount: Math.round(plan.amount * 100),
          ...(plan.mode === "subscription" && plan.interval
            ? { recurring: { interval: plan.interval as "month" | "year" } }
            : {}),
        },
        quantity: 1,
      }];
    } else if (planId === "custom-deposit" && body.amount) {
      // Custom deposit amount - validate server-side
      const customAmount = Number(body.amount);
      if (isNaN(customAmount) || customAmount < MIN_DEPOSIT || customAmount > MAX_DEPOSIT) {
        return new Response(
          JSON.stringify({ error: `Deposit must be between $${MIN_DEPOSIT} and $${MAX_DEPOSIT}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      mode = "payment";
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `AIQTP Platform Deposit`,
            description: `Add $${customAmount} to your AIQTP account`,
          },
          unit_amount: Math.round(customAmount * 100),
        },
        quantity: 1,
      }];
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid plan selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Sanitize metadata
    const sanitizedMetadata: Record<string, string> = {
      user_id: user.id,
      user_email: user.email || "",
      plan_id: planId || "custom",
      source: "aiqtp_platform",
      created_at: new Date().toISOString(),
    };

    if (metadata && typeof metadata === "object") {
      for (const [key, value] of Object.entries(metadata)) {
        if (
          typeof key === "string" && typeof value === "string" &&
          key.length <= 40 && value.length <= 500 &&
          /^[a-zA-Z0-9_-]+$/.test(key)
        ) {
          sanitizedMetadata[key] = value;
        }
      }
    }

    // 5. Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email || undefined,
      metadata: sanitizedMetadata,
    };

    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: sanitizedMetadata,
      };
    }

    console.log("Creating Stripe session for user:", user.id, "plan:", planId);
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("Session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
