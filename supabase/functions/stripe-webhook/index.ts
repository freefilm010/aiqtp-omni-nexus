import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Verify the webhook signature to prevent forged events
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("Webhook event received:", event.type);

    // Process different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);
        
        // Record revenue
        const amount = (session.amount_total || 0) / 100; // Convert from cents
        const revenueType = session.mode === "subscription" ? "subscription" : "one_time";
        
        const { error: revenueError } = await supabase
          .from("platform_revenue")
          .insert({
            amount,
            currency: session.currency?.toUpperCase() || "USD",
            source_type: revenueType,
            source_category: "stripe_payment",
            status: "pending",
            metadata: {
              stripe_session_id: session.id,
              customer_email: session.customer_email,
              payment_status: session.payment_status,
            },
          });

        if (revenueError) {
          console.error("Error recording revenue:", revenueError);
        } else {
          console.log(`Revenue recorded: $${amount} (${revenueType})`);
        }

        // Mirror to admin_revenue for admin dashboard
        const { error: adminError } = await supabase
          .from("admin_revenue")
          .insert({
            amount,
            currency: session.currency?.toUpperCase() || "USD",
            type: revenueType,
            source: "stripe_checkout",
            status: "completed",
            metadata: {
              stripe_session_id: session.id,
              customer_email: session.customer_email,
              payment_status: session.payment_status,
            },
          });
        if (adminError) console.error("Error recording admin revenue:", adminError);

        // Credit platform wallet
        const { error: walletError } = await supabase
          .from("platform_wallets")
          .update({
            balance: supabase.rpc ? amount : amount, // Will use raw update
          })
          .eq("currency", session.currency?.toUpperCase() || "USD")
          .eq("wallet_type", "fiat");
        
        // Use direct SQL-style increment via RPC or raw update
        await supabase.rpc("increment_wallet_balance", {
          p_currency: session.currency?.toUpperCase() || "USD",
          p_amount: amount,
        }).then(({ error }) => {
          if (error) console.error("Wallet credit error (will use fallback):", error);
          else console.log(`Wallet credited: $${amount}`);
        });

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice paid:", invoice.id);
        
        const amount = (invoice.amount_paid || 0) / 100;
        
        const { error } = await supabase
          .from("platform_revenue")
          .insert({
            amount,
            currency: invoice.currency?.toUpperCase() || "USD",
            source_type: "subscription_renewal",
            source_category: "stripe_subscription",
            status: "pending",
            metadata: {
              stripe_invoice_id: invoice.id,
              subscription_id: invoice.subscription,
              customer_id: invoice.customer,
            },
          });

        if (error) {
          console.error("Error recording subscription revenue:", error);
        } else {
          console.log(`Subscription revenue recorded: $${amount}`);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("New subscription:", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", subscription.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
