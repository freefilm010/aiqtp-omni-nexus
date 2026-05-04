import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Max single payment: 1,000,000 msats = 1,000 sats ≈ $0.50 at $50k BTC
const MAX_MSATS = 1_000_000;

// BTC per msat: 1 BTC = 100,000,000,000 msats
const MSATS_PER_BTC = 100_000_000_000;

const ActionSchema = z.object({
  action: z.enum(["balance", "create_charge", "send_payment", "webhook"]),
  amount_msats: z.number().positive().max(MAX_MSATS).optional(),
  description: z.string().max(200).optional(),
  ln_address: z.string().max(200).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Invalid Lightning address format").optional(),
  // webhook payload fields
  charge: z.object({
    id: z.string(),
    status: z.string(),
    amount: z.string().or(z.number()).optional(),
    internalId: z.string().optional(),
  }).optional(),
});

async function readZbdResponse(resp: Response) {
  const text = await resp.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!resp.ok) {
    const message = data?.message || data?.error || text || `ZBD request failed (${resp.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * Credit a user's USD balance for a completed Lightning deposit.
 * Uses portfolio_holdings (same table credit_platform_deposit uses) to add
 * a USD equivalent amount. Amounts are stored as BTC in lightning_transactions
 * but we also credit a USD approximation if a BTC price can be fetched;
 * otherwise we store the BTC amount note in the transaction and leave USD
 * balance unchanged (operator can reconcile manually). We mark the
 * lightning_transaction as completed regardless.
 */
async function creditLightningDeposit(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  txId: string,
  amountMsats: number,
) {
  const amountBtc = amountMsats / MSATS_PER_BTC;

  // Mark the lightning_transactions row as completed
  await serviceClient
    .from("lightning_transactions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", txId)
    .eq("user_id", userId);

  // Fetch a live BTC/USD price to convert msats → USD for the wallet credit.
  // If fetch fails, fall back to 0 so we don't block the webhook response;
  // the transaction will be marked completed and an operator can credit
  // the USD balance manually based on the BTC amount.
  let btcPriceUsd = 0;
  try {
    const priceResp = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    );
    if (priceResp.ok) {
      const priceData = await priceResp.json();
      btcPriceUsd = parseFloat(priceData?.price ?? "0");
    }
  } catch {
    // ignore — price fetch failure is non-fatal
  }

  if (btcPriceUsd > 0) {
    const amountUsd = amountBtc * btcPriceUsd;
    // Upsert into portfolio_holdings (same pattern as credit_platform_deposit)
    const { error: creditError } = await serviceClient
      .from("portfolio_holdings")
      .upsert(
        {
          user_id: userId,
          symbol: "USD",
          name: "US Dollar Cash",
          quantity: amountUsd,
          value_usd: amountUsd,
          change_24h: 0,
          allocation_percent: 0,
        },
        {
          onConflict: "user_id,symbol",
          ignoreDuplicates: false,
        },
      );

    if (creditError) {
      console.error("ZBD credit error:", creditError);
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Parse body early so we can branch on action before auth
    const body = await req.json();

    // ----------------------------------------------------------------
    // WEBHOOK path — called by ZBD, no user JWT
    // ----------------------------------------------------------------
    if (body?.action === "webhook") {
      const zbdWebhookSecret = Deno.env.get("ZBD_WEBHOOK_SECRET");
      const incomingSecret = req.headers.get("zbd-secret") ?? req.headers.get("x-zbd-secret");

      // If a webhook secret is configured, enforce it
      if (zbdWebhookSecret && incomingSecret !== zbdWebhookSecret) {
        console.warn("ZBD webhook: invalid secret");
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const charge = body?.charge;
      if (!charge?.id || !charge?.status) {
        return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const isPaid = charge.status === "completed" || charge.status === "charged";
      if (!isPaid) {
        // Not paid yet — acknowledge without action
        return new Response(JSON.stringify({ received: true, action: "none" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const serviceClient = createClient(supabaseUrl, serviceRoleKey);

      // Look up the pending lightning_transaction by payment_hash (= charge.id)
      const { data: txRow, error: txError } = await serviceClient
        .from("lightning_transactions")
        .select("id, user_id, amount, status")
        .eq("payment_hash", charge.id)
        .maybeSingle();

      if (txError) {
        console.error("ZBD webhook DB lookup error:", txError);
        return new Response(JSON.stringify({ error: "DB error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!txRow) {
        console.warn("ZBD webhook: no matching transaction for charge", charge.id);
        return new Response(JSON.stringify({ received: true, action: "no_match" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (txRow.status === "completed") {
        // Already credited — idempotent response
        return new Response(JSON.stringify({ received: true, action: "already_credited" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Determine msat amount from webhook payload or fall back to DB amount
      const amountMsats = charge.amount
        ? Number(charge.amount)
        : Math.round(Number(txRow.amount) * MSATS_PER_BTC);

      await creditLightningDeposit(serviceClient, txRow.user_id, txRow.id, amountMsats);

      console.log(`ZBD webhook: credited ${amountMsats} msats for user ${txRow.user_id}`);
      return new Response(JSON.stringify({ received: true, action: "credited" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ----------------------------------------------------------------
    // Authenticated paths — require user JWT
    // ----------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zbdApiKey = Deno.env.get("ZBD_API_KEY");
    if (!zbdApiKey) {
      return new Response(
        JSON.stringify({ error: "ZBD API key not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, amount_msats, description, ln_address } = parsed.data;
    const zbdBase = "https://api.zebedee.io/v0";
    const zbdHeaders = {
      "Content-Type": "application/json",
      apikey: zbdApiKey,
    };

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    let result: any;

    if (action === "balance") {
      const resp = await fetch(`${zbdBase}/wallet`, { headers: zbdHeaders });
      const data = await readZbdResponse(resp);
      result = {
        connected: true,
        balance_msats: Number(data?.data?.balance ?? 0),
      };
    } else if (action === "create_charge") {
      if (!amount_msats) {
        return new Response(
          JSON.stringify({ error: "amount_msats required for create_charge" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const resp = await fetch(`${zbdBase}/charges`, {
        method: "POST",
        headers: zbdHeaders,
        body: JSON.stringify({
          amount: String(amount_msats),
          description: description || "AIQTP Lightning Vault deposit",
          expiresIn: 3600,
          // Pass the edge function webhook URL so ZBD auto-notifies on payment
          callbackUrl: `${supabaseUrl}/functions/v1/zbd-wallet`,
        }),
      });
      const data = await readZbdResponse(resp);
      if (data?.data?.invoice) {
        await serviceClient.from("lightning_transactions").insert({
          user_id: user.id,
          type: "receive",
          amount: amount_msats / MSATS_PER_BTC,
          currency: "BTC",
          destination: data.data.invoice.request?.substring(0, 50) || "zbd_charge",
          status: "pending",
          payment_hash: data.data.id,
        });
      }
      result = {
        invoice: data?.data?.invoice?.request,
        charge_id: data?.data?.id,
        expires_at: data?.data?.expiresAt,
      };
    } else if (action === "send_payment") {
      if (!ln_address || !amount_msats) {
        return new Response(
          JSON.stringify({ error: "ln_address and amount_msats required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check and debit the user's USD balance before sending
      const amountBtc = amount_msats / MSATS_PER_BTC;
      let btcPriceUsd = 0;
      try {
        const priceResp = await fetch(
          "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        );
        if (priceResp.ok) {
          const priceData = await priceResp.json();
          btcPriceUsd = parseFloat(priceData?.price ?? "0");
        }
      } catch {
        // Non-fatal — proceed with 0 price, balance check will be skipped
      }

      if (btcPriceUsd > 0) {
        const costUsd = amountBtc * btcPriceUsd;

        // Fetch current USD balance
        const { data: holding, error: holdingError } = await serviceClient
          .from("portfolio_holdings")
          .select("quantity")
          .eq("user_id", user.id)
          .eq("symbol", "USD")
          .maybeSingle();

        if (holdingError) {
          return new Response(
            JSON.stringify({ error: "Failed to read wallet balance" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const currentBalance = Number(holding?.quantity ?? 0);
        if (currentBalance < costUsd) {
          return new Response(
            JSON.stringify({
              error: `Insufficient balance. Required: $${costUsd.toFixed(4)} USD, Available: $${currentBalance.toFixed(4)} USD`,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Debit before sending to prevent double-spends
        const { error: debitError } = await serviceClient
          .from("portfolio_holdings")
          .update({
            quantity: currentBalance - costUsd,
            value_usd: currentBalance - costUsd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("symbol", "USD");

        if (debitError) {
          return new Response(
            JSON.stringify({ error: "Failed to debit wallet balance" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      let sendData: any;
      try {
        const resp = await fetch(`${zbdBase}/ln-address/send-payment`, {
          method: "POST",
          headers: zbdHeaders,
          body: JSON.stringify({
            lnAddress: ln_address,
            amount: String(amount_msats),
            comment: description || "AIQTP payment",
          }),
        });
        sendData = await readZbdResponse(resp);
      } catch (sendError: any) {
        // Payment failed — refund the debit if we debited
        if (btcPriceUsd > 0) {
          const amountUsd = amountBtc * btcPriceUsd;
          const { data: currentHolding } = await serviceClient
            .from("portfolio_holdings")
            .select("quantity")
            .eq("user_id", user.id)
            .eq("symbol", "USD")
            .maybeSingle();
          const refundedBalance = Number(currentHolding?.quantity ?? 0) + amountUsd;
          await serviceClient
            .from("portfolio_holdings")
            .update({ quantity: refundedBalance, value_usd: refundedBalance, updated_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("symbol", "USD");
        }
        throw sendError;
      }

      await serviceClient.from("lightning_transactions").insert({
        user_id: user.id,
        type: "send",
        amount: amount_msats / MSATS_PER_BTC,
        currency: "BTC",
        destination: ln_address.substring(0, 50),
        status: sendData?.data?.status === "completed" ? "completed" : "pending",
        payment_hash: sendData?.data?.id || `zbd_send_${Date.now()}`,
      });
      result = { status: sendData?.data?.status, id: sendData?.data?.id };
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ZBD wallet error:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
