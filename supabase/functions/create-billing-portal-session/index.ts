// create-billing-portal-session
//
// Returns a Stripe Customer Portal URL where the user can manage their
// subscription (cancel, upgrade, change payment method, view invoices).
// Drastically reduces support burden vs building all that in-app.
//
// Caller must be authenticated; we look up their stripe_customer_id from
// public.user_subscriptions and create a portal session for it.

import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PortalBody {
  userId: string;
  returnUrl: string;
  environment: StripeEnv;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json() as PortalBody;
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

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } },
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user || user.id !== body.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up stripe_customer_id (service-role so we can read across users)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: subs, error: subErr } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", body.userId)
      .eq("environment", body.environment)
      .order("created_at", { ascending: false })
      .limit(1);

    if (subErr) throw subErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(body.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: subs[0].stripe_customer_id as string,
      return_url: body.returnUrl,
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-billing-portal-session error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
