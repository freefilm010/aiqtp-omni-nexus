/**
 * Daily reconciliation report
 * Compares Stripe (subscriptions + charges) against the local DB
 * (subscriptions + deposit_transactions) and writes a row to
 * `reconciliation_reports` with any discrepancies.
 *
 * Trigger:
 *   - Cron (recommended): once per day via pg_cron
 *   - Manual: admin clicks "Run reconciliation now" in CEO Mission Control
 *
 * Auth: requires admin role for manual invocation. Cron uses service-role.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Discrepancy {
  kind: string;
  detail: string;
  stripeId?: string;
  dbId?: string;
}

async function authorizeAdmin(req: Request): Promise<{ ok: boolean; userId?: string; error?: string; status?: number }> {
  const authHeader = req.headers.get("Authorization");
  // Allow service-role calls (cron) without user auth.
  if (authHeader === `Bearer ${SERVICE_ROLE}`) {
    return { ok: true };
  }
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Authentication required" };
  }
  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { ok: false, status: 401, error: "Invalid token" };
  }
  const userId = data.claims.sub as string;
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roleRow } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) {
    return { ok: false, status: 403, error: "Admin role required" };
  }
  return { ok: true, userId };
}

async function runReconciliation(env: StripeEnv, hoursBack = 24) {
  const stripe = createStripeClient(env);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - hoursBack * 60 * 60 * 1000);
  const startTs = Math.floor(periodStart.getTime() / 1000);

  const discrepancies: Discrepancy[] = [];

  // ── 1. Subscriptions ──────────────────────────────────────
  const stripeSubs = await stripe.subscriptions.list({
    created: { gte: startTs },
    limit: 100,
    status: "all",
  });

  const { data: dbSubs } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, status, user_id, current_period_end")
    .eq("environment", env)
    .gte("created_at", periodStart.toISOString());

  const dbSubMap = new Map((dbSubs ?? []).map((s) => [s.stripe_subscription_id, s]));

  for (const ss of stripeSubs.data) {
    const local = dbSubMap.get(ss.id);
    if (!local) {
      discrepancies.push({
        kind: "missing_subscription_in_db",
        detail: `Stripe subscription ${ss.id} (status=${ss.status}) has no matching DB row`,
        stripeId: ss.id,
      });
      continue;
    }
    if (local.status !== ss.status) {
      discrepancies.push({
        kind: "subscription_status_mismatch",
        detail: `Stripe=${ss.status} vs DB=${local.status}`,
        stripeId: ss.id,
      });
    }
  }

  // ── 2. Revenue (charges) ──────────────────────────────────
  const stripeCharges = await stripe.charges.list({
    created: { gte: startTs },
    limit: 100,
  });
  const stripeRevenueCents = stripeCharges.data
    .filter((c) => c.paid && !c.refunded)
    .reduce((sum, c) => sum + (c.amount ?? 0), 0);

  // ── 3. Deposit transactions ───────────────────────────────
  const { data: deposits } = await admin
    .from("deposit_transactions")
    .select("amount_cents, status, stripe_payment_intent_id")
    .eq("environment", env)
    .gte("created_at", periodStart.toISOString());

  const dbDepositTotalCents = (deposits ?? [])
    .filter((d: any) => d.status === "succeeded")
    .reduce((sum: number, d: any) => sum + (d.amount_cents ?? 0), 0);

  // Cross-check each Stripe payment_intent ↔ DB deposit row
  const dbDepositMap = new Map(
    (deposits ?? []).map((d: any) => [d.stripe_payment_intent_id, d])
  );
  for (const ch of stripeCharges.data) {
    if (!ch.paid || ch.refunded) continue;
    const piId = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
    if (!piId) continue;
    if (!dbDepositMap.has(piId)) {
      // Could legitimately be a subscription charge — only flag one-time.
      if (!ch.invoice) {
        discrepancies.push({
          kind: "missing_deposit_in_db",
          detail: `Stripe charge ${ch.id} (${ch.amount / 100} ${ch.currency}) has no DB deposit row`,
          stripeId: ch.id,
        });
      }
    }
  }

  const status: "clean" | "discrepancy" =
    discrepancies.length === 0 ? "clean" : "discrepancy";

  const { data: report, error: insertError } = await admin
    .from("reconciliation_reports")
    .insert({
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      environment: env,
      stripe_subscription_count: stripeSubs.data.length,
      db_subscription_count: dbSubs?.length ?? 0,
      stripe_revenue_cents: stripeRevenueCents,
      db_deposit_total_cents: dbDepositTotalCents,
      discrepancies,
      status,
    })
    .select()
    .single();

  if (insertError) throw new Error(`Failed to write report: ${insertError.message}`);

  // Audit
  await admin.from("security_audit_log").insert({
    event_type: "reconciliation_run",
    details: { environment: env, status, discrepancy_count: discrepancies.length },
    severity: discrepancies.length === 0 ? "info" : "warn",
  });

  return report;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authz = await authorizeAdmin(req);
    if (!authz.ok) {
      return new Response(JSON.stringify({ error: authz.error }), {
        status: authz.status ?? 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const env: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    const hoursBack = typeof body.hoursBack === "number" ? body.hoursBack : 24;

    const report = await runReconciliation(env, hoursBack);

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Reconciliation error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});