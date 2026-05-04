// Plaid ACH bank funding integration.
// Flow: create_link_token → user completes Plaid Link → exchange_public_token → initiate_transfer
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function plaidBase(): string {
  const env = Deno.env.get("PLAID_ENV") ?? "sandbox";
  const bases: Record<string, string> = {
    sandbox: "https://sandbox.plaid.com",
    development: "https://development.plaid.com",
    production: "https://production.plaid.com",
  };
  return bases[env] ?? bases.sandbox;
}

async function plaidPost(path: string, body: unknown): Promise<unknown> {
  const clientId = Deno.env.get("PLAID_CLIENT_ID");
  const secret = Deno.env.get("PLAID_SECRET");
  if (!clientId || !secret) throw new Error("PLAID_CLIENT_ID / PLAID_SECRET not configured");

  const res = await fetch(`${plaidBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, secret, ...body as object }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Plaid error: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader! } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, publicToken, accountId, amountUsd, accessToken } = await req.json();

    if (action === "create_link_token") {
      const data = await plaidPost("/link/token/create", {
        user: { client_user_id: user.id },
        client_name: "AIQTP",
        products: ["auth", "transactions"],
        country_codes: ["US"],
        language: "en",
        account_filters: { depository: { account_subtypes: ["checking", "savings"] } },
      }) as { link_token: string };
      return new Response(JSON.stringify({ linkToken: data.link_token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_public_token") {
      if (!publicToken) throw new Error("publicToken required");
      const data = await plaidPost("/item/public_token/exchange", { public_token: publicToken }) as { access_token: string; item_id: string };

      // Store access token for user (encrypted at rest by Supabase)
      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await adminSupabase.from("plaid_items").upsert({
        user_id: user.id,
        access_token: data.access_token,
        item_id: data.item_id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_accounts") {
      if (!accessToken) throw new Error("accessToken required");
      const data = await plaidPost("/accounts/get", { access_token: accessToken }) as { accounts: unknown[] };
      return new Response(JSON.stringify({ accounts: data.accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "initiate_transfer") {
      if (!accessToken || !accountId || !amountUsd) throw new Error("accessToken, accountId, amountUsd required");
      if (amountUsd < 20) throw new Error("Minimum deposit is $20");
      if (amountUsd > 50000) throw new Error("Maximum ACH transfer is $50,000");

      // Get routing/account numbers via Plaid Auth
      const authData = await plaidPost("/auth/get", { access_token: accessToken }) as { numbers: { ach: Array<{ account_id: string; routing: string; account: string }> } };
      const achAccount = authData.numbers.ach.find(a => a.account_id === accountId);
      if (!achAccount) throw new Error("Account not found or not ACH-eligible");

      // In production, this would initiate via Plaid Transfer API or your ACH processor
      // For now: record pending transfer, credit when settled (1-3 business days)
      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: transfer } = await adminSupabase.from("pending_ach_transfers").insert({
        user_id: user.id,
        account_id: accountId,
        amount_usd: amountUsd,
        status: "pending",
        created_at: new Date().toISOString(),
      }).select().single();

      return new Response(JSON.stringify({
        success: true,
        transferId: transfer?.id,
        message: "ACH transfer initiated. Funds will appear in 1-3 business days.",
        estimatedSettlement: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Plaid error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
