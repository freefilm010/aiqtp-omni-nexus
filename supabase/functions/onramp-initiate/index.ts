/**
 * onramp-initiate
 * ===============
 * Creates a Stripe Checkout session for a fiat-to-crypto on-ramp purchase.
 *
 * The user pays USD via Stripe.  On payment success, the onramp-webhook
 * function receives the checkout.session.completed event and triggers the
 * on-ramp worker (onramp-service) to execute the Uniswap V3 swap on Arbitrum,
 * delivering USDC or ETH to the destination wallet.
 *
 * POST /functions/v1/onramp-initiate
 * Authorization: Bearer <supabase-jwt>
 * Body: {
 *   amountInCents: number,   // USD amount in cents (min $10 = 1000)
 *   outputToken: "USDC" | "ETH",
 *   destinationWallet?: string,  // defaults to platform wallet
 *   returnUrl: string,
 *   environment: "sandbox" | "live"
 * }
 */
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default destination wallet on Arbitrum
const DEFAULT_DESTINATION_WALLET = "0xf77Ebc11C2bEe9e3ecefC13CB58CA261f6694c4F";

interface OnrampBody {
  amountInCents: number;
  outputToken: "USDC" | "ETH";
  destinationWallet?: string;
  returnUrl: string;
  environment: StripeEnv;
  userId: string;
  customerEmail?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json() as OnrampBody;

    // Validate
    if (!body.amountInCents || body.amountInCents < 1000) {
      return new Response(JSON.stringify({ error: "Minimum on-ramp amount is $10.00" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.amountInCents > 5_000_000) {
      return new Response(JSON.stringify({ error: "Maximum on-ramp amount is $50,000.00" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["USDC", "ETH"].includes(body.outputToken)) {
      return new Response(JSON.stringify({ error: "outputToken must be USDC or ETH" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.environment !== "sandbox" && body.environment !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
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

    const destinationWallet = body.destinationWallet || DEFAULT_DESTINATION_WALLET;
    const amountUsd = (body.amountInCents / 100).toFixed(2);

    // Create Stripe Checkout session
    const stripe = createStripeClient(body.environment);
    const session = await (stripe.checkout.sessions.create as any)({
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Buy ${body.outputToken} on Arbitrum`,
            description: `Converts USD to ${body.outputToken} via Uniswap V3 on Arbitrum and delivers to ${destinationWallet.slice(0, 10)}...`,
          },
          unit_amount: body.amountInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: body.returnUrl,
      metadata: {
        userId: body.userId,
        type: "crypto_onramp",
        output_token: body.outputToken,
        destination_wallet: destinationWallet,
        amount_usd: amountUsd,
        network: "arbitrum",
      },
      ...(body.customerEmail && { customer_email: body.customerEmail }),
    });

    // Log the onramp request in Supabase
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: insertErr } = await adminSupabase.from("onramp_orders").insert({
      user_id: body.userId,
      stripe_session_id: session.id,
      amount_usd: parseFloat(amountUsd),
      output_token: body.outputToken,
      destination_wallet: destinationWallet,
      network: "arbitrum",
      status: "pending_payment",
      environment: body.environment,
    });
    if (insertErr) console.error("Failed to log onramp order:", insertErr.message);

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("onramp-initiate error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
