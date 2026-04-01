import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const ActionSchema = z.object({
  action: z.enum(["balance", "create_charge", "send_payment"]),
  amount_msats: z.number().positive().optional(),
  description: z.string().max(200).optional(),
  ln_address: z.string().max(200).optional(),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Get ZBD API key from secrets
    const zbdApiKey = Deno.env.get("ZBD_API_KEY");
    if (!zbdApiKey) {
      return new Response(
        JSON.stringify({ error: "ZBD API key not configured. Please add your ZBD API key." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
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

    let result: any;

    if (action === "balance") {
      const resp = await fetch(`${zbdBase}/wallet`, { headers: zbdHeaders });
      const data = await resp.json();
      result = { balance_msats: data?.data?.balance ?? 0 };
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
        }),
      });
      const data = await resp.json();
      if (data?.data?.invoice) {
        // Log the charge in lightning_transactions
        const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await serviceClient.from("lightning_transactions").insert({
          user_id: userId,
          type: "zbd_charge",
          amount: amount_msats / 100_000_000_000, // msats to BTC
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
      const resp = await fetch(`${zbdBase}/ln-address/send-payment`, {
        method: "POST",
        headers: zbdHeaders,
        body: JSON.stringify({
          lnAddress: ln_address,
          amount: String(amount_msats),
          comment: description || "AIQTP payment",
        }),
      });
      const data = await resp.json();
      // Log the send
      const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await serviceClient.from("lightning_transactions").insert({
        user_id: userId,
        type: "zbd_send",
        amount: amount_msats / 100_000_000_000,
        currency: "BTC",
        destination: ln_address.substring(0, 50),
        status: data?.data?.status === "completed" ? "completed" : "pending",
        payment_hash: data?.data?.id || `zbd_send_${Date.now()}`,
      });
      result = { status: data?.data?.status, id: data?.data?.id };
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ZBD wallet error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
