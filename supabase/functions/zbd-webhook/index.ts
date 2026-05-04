import { createClient } from "npm:@supabase/supabase-js@2";

// ZBD Lightning webhook — auto-credits a user's USD balance when a Lightning
// charge issued via the zbd-wallet edge function is paid.
//
// Flow:
//   1. ZBD posts a JSON payload (event for charge settlement) to this URL.
//   2. Verify either a shared-secret header `x-zbd-secret` (matched against
//      ZBD_WEBHOOK_SECRET) or, if not configured, fall back to re-fetching the
//      charge from ZBD by id and confirming status === "completed".
//   3. Look up the matching `lightning_transactions` row by `payment_hash`
//      (the ZBD charge id, written when the invoice was created in zbd-wallet).
//   4. Convert msats → USD via the live BTC price.
//   5. Call `credit_platform_deposit` (the same RPC Stripe deposits use) with
//      the ZBD charge id as the dedupe key, prefixed `zbd_` to avoid clashes
//      with Stripe session ids in the unique constraint.
//   6. Insert 1% platform fee into `platform_revenue` and mark the lightning
//      transaction as `completed`.
//
// All side effects are idempotent: the RPC dedupes on `stripe_session_id`,
// and `platform_revenue` insert is skipped if the deposit was already credited.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-zbd-secret",
};

const ZBD_API_BASE = "https://api.zebedee.io/v0";

interface ZbdChargeData {
  id?: string;
  status?: string;
  unit?: string;
  amount?: string | number;
  internalId?: string | null;
  description?: string | null;
  invoice?: { request?: string } | null;
}

interface ZbdWebhookEvent {
  event?: string;
  type?: string;
  data?: ZbdChargeData;
  charge?: ZbdChargeData;
  // ZBD posts vary by webhook version — accept either nested shape or flat.
  id?: string;
  status?: string;
  amount?: string | number;
}

function extractCharge(payload: ZbdWebhookEvent): ZbdChargeData | null {
  if (payload?.data?.id) return payload.data;
  if (payload?.charge?.id) return payload.charge;
  if (payload?.id) {
    return {
      id: payload.id,
      status: payload.status,
      amount: payload.amount,
    };
  }
  return null;
}

async function getBtcUsdPrice(): Promise<number> {
  // Use Coinbase spot — same upstream the rest of the platform uses for crypto pricing
  // and works without an API key. Falls back to a hardcoded sane value only if this
  // endpoint goes down so we never silently zero out a deposit.
  try {
    const r = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot");
    if (r.ok) {
      const j = await r.json();
      const px = parseFloat(j?.data?.amount);
      if (Number.isFinite(px) && px > 0) return px;
    }
  } catch (e) {
    console.error("BTC price fetch failed:", e);
  }
  // Final fallback so we don't crash on a transient API outage; logs loudly.
  console.warn("Using BTC price fallback");
  return 60_000;
}

async function fetchZbdCharge(chargeId: string, apiKey: string): Promise<ZbdChargeData | null> {
  const r = await fetch(`${ZBD_API_BASE}/charges/${chargeId}`, {
    headers: { apikey: apiKey, "Content-Type": "application/json" },
  });
  if (!r.ok) {
    console.error("ZBD charge fetch failed:", r.status, await r.text().catch(() => ""));
    return null;
  }
  const j = await r.json().catch(() => null);
  return j?.data ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // 1. Shared-secret verification (preferred). If ZBD_WEBHOOK_SECRET is not
  //    configured we fall back to fetch-and-verify against the ZBD API.
  const expectedSecret = Deno.env.get("ZBD_WEBHOOK_SECRET");
  const presentedSecret = req.headers.get("x-zbd-secret");
  const secretOk = expectedSecret ? presentedSecret === expectedSecret : false;

  let payload: ZbdWebhookEvent;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const charge = extractCharge(payload);
  if (!charge?.id) {
    console.warn("ZBD webhook missing charge id:", payload);
    return new Response(JSON.stringify({ ignored: true, reason: "no charge id" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. If shared secret didn't validate, re-verify by hitting the ZBD API directly.
  let verifiedCharge = charge;
  if (!secretOk) {
    const apiKey = Deno.env.get("ZBD_API_KEY");
    if (!apiKey) {
      console.error("ZBD webhook rejected: no shared secret match and no ZBD_API_KEY for fallback verification");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const fetched = await fetchZbdCharge(charge.id, apiKey);
    if (!fetched) {
      return new Response(JSON.stringify({ error: "Could not verify charge" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    verifiedCharge = fetched;
  }

  // 3. Only act on settled charges. Other statuses are acknowledged with 200
  //    so ZBD doesn't retry indefinitely.
  const status = (verifiedCharge.status ?? "").toLowerCase();
  if (status !== "completed" && status !== "paid" && status !== "settled") {
    return new Response(JSON.stringify({ received: true, status }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 4. Look up the lightning_transactions row written when the invoice was
  //    created in zbd-wallet. payment_hash holds the ZBD charge id.
  const { data: lnTx, error: lnErr } = await supabase
    .from("lightning_transactions")
    .select("id, user_id, amount, status")
    .eq("payment_hash", verifiedCharge.id)
    .eq("type", "zbd_charge")
    .maybeSingle();

  if (lnErr) {
    console.error("lightning_transactions lookup failed:", lnErr.message);
    return new Response(JSON.stringify({ error: "DB lookup failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!lnTx) {
    console.warn("ZBD webhook for unknown charge:", verifiedCharge.id);
    return new Response(JSON.stringify({ ignored: true, reason: "unknown charge" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (lnTx.status === "completed") {
    return new Response(JSON.stringify({ received: true, already_credited: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 5. Convert msats → USD. zbd-wallet stores `amount` as BTC (msats / 1e11).
  //    Source of truth for amount is the verifiedCharge.amount (msats string).
  const amountMsats = Number(verifiedCharge.amount ?? 0);
  const btc = amountMsats > 0 ? amountMsats / 100_000_000_000 : Number(lnTx.amount ?? 0);
  if (!Number.isFinite(btc) || btc <= 0) {
    console.error("ZBD webhook: cannot determine BTC amount for charge", verifiedCharge.id);
    return new Response(JSON.stringify({ error: "Bad amount" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const btcPrice = await getBtcUsdPrice();
  const amountUsd = Math.round(btc * btcPrice * 100) / 100;

  if (amountUsd < 20) {
    // The credit_platform_deposit RPC enforces a $20 minimum. ZBD micro-tips
    // shouldn't credit the platform USD balance — log and exit cleanly.
    console.log(`ZBD charge ${verifiedCharge.id} below $20 (${amountUsd}); marking completed without credit.`);
    await supabase
      .from("lightning_transactions")
      .update({ status: "completed" })
      .eq("id", lnTx.id);
    return new Response(JSON.stringify({ received: true, credited: false, reason: "below_minimum" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 6. Credit the user's USD balance via the same RPC Stripe deposits use.
  //    Prefix the dedupe key so it cannot collide with a Stripe session id.
  const dedupeKey = `zbd_${verifiedCharge.id}`;
  const { data: wasCredited, error: rpcErr } = await supabase.rpc("credit_platform_deposit", {
    p_user_id: lnTx.user_id,
    p_stripe_session_id: dedupeKey,
    p_stripe_payment_intent_id: null,
    p_amount_usd: amountUsd,
    p_currency: "usd",
    p_environment: Deno.env.get("ZBD_ENVIRONMENT") ?? "live",
  });

  if (rpcErr) {
    console.error("credit_platform_deposit failed:", rpcErr.message);
    return new Response(JSON.stringify({ error: rpcErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 7. Mark transaction completed regardless of dedupe outcome.
  await supabase
    .from("lightning_transactions")
    .update({ status: "completed" })
    .eq("id", lnTx.id);

  // 8. 1% platform fee — only when this call actually credited a new deposit.
  if (wasCredited) {
    const platformFee = Math.round(amountUsd * 0.01 * 100) / 100;
    if (platformFee > 0) {
      const { error: revErr } = await supabase.from("platform_revenue").insert({
        source_type: "trading_fee",
        source_category: "zbd_lightning_deposit",
        amount: platformFee,
        currency: "USD",
        status: "pending",
        metadata: {
          zbd_charge_id: verifiedCharge.id,
          user_id: lnTx.user_id,
          gross_deposit: amountUsd,
          msats: amountMsats,
          btc_price_usd: btcPrice,
        },
      });
      if (revErr) console.error("platform_revenue insert failed:", revErr.message);
    }

    try {
      await supabase.from("security_audit_log").insert({
        event_type: "zbd_lightning_deposit_credited",
        user_id: lnTx.user_id,
        details: {
          zbd_charge_id: verifiedCharge.id,
          amount_usd: amountUsd,
          msats: amountMsats,
          btc_price_usd: btcPrice,
        },
        severity: "info",
      });
    } catch (e) {
      console.error("audit log failed:", e);
    }
  }

  return new Response(
    JSON.stringify({ received: true, credited: !!wasCredited, amount_usd: amountUsd }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
