/**
 * onramp-webhook
 * ==============
 * Stripe webhook handler for crypto on-ramp payments.
 *
 * When Stripe fires checkout.session.completed for a session with
 * metadata.type === "crypto_onramp", this function:
 *   1. Verifies the Stripe webhook signature.
 *   2. Updates the onramp_orders row to "payment_confirmed".
 *   3. Calls the onramp-service worker (self-hosted Python service) to
 *      execute the Uniswap V3 swap on Arbitrum.
 *   4. Updates the order status to "swap_submitted" or "failed".
 *
 * Stripe webhook URL (register in Stripe Dashboard):
 *   https://<supabase-project>.supabase.co/functions/v1/onramp-webhook?env=live
 *   (or ?env=sandbox for test mode)
 *
 * Events to subscribe: checkout.session.completed
 */
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function triggerOnrampWorker(order: {
  id: string;
  amount_usd: number;
  output_token: string;
  destination_wallet: string;
}): Promise<{ tx_hash?: string; error?: string }> {
  // ONRAMP_WORKER_URL is the URL of the self-hosted onramp-service
  // (see onramp-service/ directory — runs as a Docker container)
  const workerUrl = Deno.env.get("ONRAMP_WORKER_URL");
  if (!workerUrl) {
    console.error("ONRAMP_WORKER_URL not configured");
    return { error: "ONRAMP_WORKER_URL not configured" };
  }

  const workerSecret = Deno.env.get("ONRAMP_WORKER_SECRET") || "";

  try {
    const resp = await fetch(`${workerUrl}/execute-swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": workerSecret,
      },
      body: JSON.stringify({
        order_id: order.id,
        amount_usd: order.amount_usd,
        output_token: order.output_token,
        destination_wallet: order.destination_wallet,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { error: `Worker returned ${resp.status}: ${text}` };
    }

    const data = await resp.json();
    return { tx_hash: data.tx_hash };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // Only process crypto on-ramp sessions
  if (session.metadata?.type !== "crypto_onramp") return;

  const supabase = getSupabase();
  const sessionId = session.id;

  // Find the order
  const { data: order, error: fetchErr } = await supabase
    .from("onramp_orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .single();

  if (fetchErr || !order) {
    console.error("onramp order not found for session:", sessionId, fetchErr?.message);
    return;
  }

  // Idempotency: skip if already processed
  if (order.status !== "pending_payment") {
    console.log("Order already processed:", order.id, order.status);
    return;
  }

  // Mark as payment confirmed
  await supabase
    .from("onramp_orders")
    .update({ status: "payment_confirmed", stripe_payment_intent: session.payment_intent })
    .eq("id", order.id);

  // Trigger the on-ramp worker to execute the swap
  console.log("Triggering onramp worker for order:", order.id);
  const result = await triggerOnrampWorker(order);

  if (result.tx_hash) {
    await supabase
      .from("onramp_orders")
      .update({
        status: "swap_submitted",
        tx_hash: result.tx_hash,
        completed_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    console.log("Swap submitted for order:", order.id, "tx:", result.tx_hash);
  } else {
    await supabase
      .from("onramp_orders")
      .update({
        status: "swap_failed",
        error_message: result.error,
      })
      .eq("id", order.id);

    console.error("Swap failed for order:", order.id, result.error);
  }

  // Audit log
  await supabase.from("security_audit_log").insert({
    event_type: "crypto_onramp_processed",
    user_id: order.user_id,
    details: {
      order_id: order.id,
      session_id: sessionId,
      amount_usd: order.amount_usd,
      output_token: order.output_token,
      destination_wallet: order.destination_wallet,
      tx_hash: result.tx_hash,
      error: result.error,
      environment: env,
    },
    severity: result.tx_hash ? "info" : "error",
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("onramp-webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
