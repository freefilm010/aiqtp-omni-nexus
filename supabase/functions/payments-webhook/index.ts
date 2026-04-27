import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook, createStripeClient } from "../_shared/stripe.ts";

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

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  await logAudit('subscription_created', userId, {
    subscription_id: subscription.id, price_id: priceId, status: subscription.status, environment: env,
  });
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  await logAudit('subscription_updated', subscription.metadata?.userId || null, {
    subscription_id: subscription.id, status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end, environment: env,
  });
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  await logAudit('subscription_canceled', subscription.metadata?.userId || null, {
    subscription_id: subscription.id, environment: env,
  }, 'warning');
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

  // Idempotent insert
  const { data: existing } = await getSupabase()
    .from('deposit_transactions')
    .select('id, status')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (existing && (existing as any).status === 'credited') {
    return; // already credited
  }

  await getSupabase().from('deposit_transactions').upsert({
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent || null,
    amount_usd: amountUsd,
    currency: session.currency || 'usd',
    status: 'credited',
    environment: env,
    credited_at: new Date().toISOString(),
  }, { onConflict: 'stripe_session_id' });

  // Credit user's USD platform wallet (or create row in portfolio_holdings as USD cash)
  await getSupabase().rpc('increment_wallet_balance', { p_currency: 'USD', p_amount: amountUsd });

  await logAudit('platform_deposit_credited', userId, {
    session_id: session.id, amount_usd: amountUsd, environment: env,
  });
}

async function handlePaymentFailed(invoice: any, env: StripeEnv) {
  await logAudit('payment_failed', invoice.metadata?.userId || null, {
    invoice_id: invoice.id, customer: invoice.customer, amount_due: invoice.amount_due, environment: env,
  }, 'warning');
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
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