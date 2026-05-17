import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

// AIQTP payment events handled here:
//   - One-time platform deposits (mode='payment', type='platform_deposit')
//   - Recurring subscriptions for Signals Pro et al
//     (mode='subscription', + customer.subscription.* + invoice.* events)

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

// Map a Stripe price ID to a local tier name. Configured via env so a new
// product can be added without redeploying the webhook code.
function priceIdToTier(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  const raw = Deno.env.get("STRIPE_PRICE_TIER_MAP") ?? "";
  // Format: "price_abc=signals_pro,price_def=pro_trader,price_ghi=elite"
  for (const pair of raw.split(",")) {
    const [pid, tier] = pair.split("=").map((s) => s.trim());
    if (pid && tier && pid === priceId) return tier;
  }
  return null;
}

async function upsertSubscriptionFromStripe(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId
    ?? sub.subscription_data?.metadata?.userId
    ?? null;
  if (!userId) {
    console.error("Subscription missing userId metadata:", sub.id);
    return;
  }
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id ?? null;
  const tier = sub.metadata?.tier && sub.metadata.tier.length > 0
    ? sub.metadata.tier
    : (priceIdToTier(priceId) ?? "unknown");

  const row = {
    user_id: userId,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    tier,
    status: sub.status,
    environment: env,
    current_period_start: sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString()
      : null,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : new Date().toISOString(),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    metadata: sub.metadata ?? {},
  };

  const { error } = await getSupabase()
    .from("user_subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });

  if (error) {
    console.error("user_subscriptions upsert failed:", error.message);
    throw error;
  }

  await logAudit("subscription_synced", userId, {
    subscription_id: sub.id,
    status: sub.status,
    tier,
    environment: env,
  });
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // Subscription checkout: subscription object will be fetched + persisted
  // via the customer.subscription.created event Stripe sends concurrently.
  // We just log here. (Could also fetch the subscription explicitly to
  // reduce the race window, but Stripe sends sub.created within seconds.)
  if (session.mode === "subscription") {
    await logAudit("subscription_checkout_completed", session.metadata?.userId ?? null, {
      session_id: session.id,
      subscription_id: session.subscription,
      tier: session.metadata?.tier,
      environment: env,
    });
    return;
  }

  // One-time deposit path (unchanged from prior implementation)
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

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  // Successful subscription renewal — current_period_end advances on the
  // subscription object, which Stripe sends a separate subscription.updated
  // event for. We just audit here.
  await logAudit("subscription_invoice_paid", invoice.metadata?.userId ?? null, {
    invoice_id: invoice.id,
    subscription_id: invoice.subscription,
    amount_paid_cents: invoice.amount_paid,
    environment: env,
  });
}

async function handleSubscriptionDeleted(sub: any, env: StripeEnv) {
  // Stripe sends this when a subscription is canceled (immediate or at
  // period end after cancel_at_period_end was set). Mirror final state.
  await upsertSubscriptionFromStripe(sub, env);
  await logAudit("subscription_canceled", sub.metadata?.userId ?? null, {
    subscription_id: sub.id,
    canceled_at: sub.canceled_at,
    environment: env,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.trial_will_end":
      await upsertSubscriptionFromStripe(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object, env);
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