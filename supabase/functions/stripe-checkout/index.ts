import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  priceId?: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  // For dynamic pricing
  amount?: number;
  productName?: string;
  productDescription?: string;
  // Customer info
  customerEmail?: string;
  metadata?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const body: CheckoutRequest = await req.json();
    console.log("Checkout request:", JSON.stringify(body));

    const { 
      priceId, 
      mode, 
      successUrl, 
      cancelUrl, 
      amount, 
      productName, 
      productDescription,
      customerEmail,
      metadata 
    } = body;

    // Build line items
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (priceId) {
      // Use existing price
      lineItems = [{ price: priceId, quantity: 1 }];
    } else if (amount && productName) {
      // Create dynamic price
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
            description: productDescription || undefined,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
          ...(mode === "subscription" ? { recurring: { interval: "month" } } : {}),
        },
        quantity: 1,
      }];
    } else {
      throw new Error("Either priceId or (amount + productName) required");
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        source: "aiqtp_platform",
        created_at: new Date().toISOString(),
      },
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // For subscriptions, allow customer to manage billing
    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: {
          ...metadata,
          source: "aiqtp_platform",
        },
      };
    }

    console.log("Creating Stripe session...");
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("Session created:", session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
