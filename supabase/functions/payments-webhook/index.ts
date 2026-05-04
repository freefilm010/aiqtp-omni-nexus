import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

// AIQTP runs a deposit-only payment model. There are no subscriptions.
// This webhook handles one-time Stripe Checkout deposits and payment failures.

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }
  return _supabase;
}

async function logAudit(eventType: string, userId: string | null, details: Record<string, unknown>, severity = 'info') {
  try {
    await getSupabase().from('security_audit_log').insert({
      event_type: eventType,
      user_id: userId,
      details,
      severity,
    });
  } catch (e) {
    console.error('audit log failed:', e);
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // Only handle one-time deposit sessions here; subscription sessions are handled by subscription.created
  if (session.mode !== 'payment') return;
  if (session.metadata?.type !== 'platform_deposit') return;

  const userId = session.metadata?.userId;
  const amountUsd = Number(session.metadata?.amount_usd || (session.amount_total ? session.amount_total / 100 : 0));
  if (!userId || !amountUsd) {
    console.error('Missing userId or amount on deposit session', session.id);
    return;
  }

  const { data: wasCredited, error } = await getSupabase().rpc('credit_platform_deposit', {
    p_user_id: userId,
    p_stripe_session_id: session.id,
    p_stripe_payment_intent_id: session.payment_intent || null,
    p_amount_usd: amountUsd,
    p_currency: session.currency || 'usd',
    p_environment: env,
  });

  if (error) throw error;
  if (!wasCredited) return;

  await logAudit('platform_deposit_credited', userId, {
    session_id: session.id, amount_usd: amountUsd, environment: env,
  });

  // Record in platform_revenue for distribution tracking (1% platform fee on deposit)
  const platformFee = Math.round(amountUsd * 0.01 * 100) / 100;
  if (platformFee > 0) {
    const { error: revErr } = await getSupabase().from('platform_revenue').insert({
      source_type: 'trading_fee',
      source_category: 'stripe_deposit',
      amount: platformFee,
      currency: 'USD',
      status: 'pending',
      metadata: { session_id: session.id, user_id: userId, gross_deposit: amountUsd },
    });
    if (revErr) console.error('platform_revenue insert failed:', revErr.message);
  }
}

async function handlePaymentFailed(invoice: any, env: StripeEnv) {
  await logAudit('payment_failed', invoice.metadata?.userId || null, {
    invoice_id: invoice.id, customer: invoice.customer, amount_due: invoice.amount_due, environment: env,
  }, 'warning');
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;
  try {
    await handleWebhook(req, env);
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});