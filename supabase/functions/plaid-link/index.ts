// Plaid ACH bank funding integration.
// Flow: create_link_token → user completes Plaid Link → exchange_public_token.
// Funding stays disabled until a real ACH settlement provider and webhook are configured.
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
    const { action, publicToken, accountId, amountUsd } = await req.json();

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Never trust a client-supplied Plaid access token: always resolve the
    // caller's own stored token from plaid_items scoped to their user id.
    const getOwnAccessToken = async (): Promise<string> => {
      const { data, error } = await adminSupabase
        .from("plaid_items")
        .select("access_token")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw new Error("Unable to load linked bank account");
      if (!data?.access_token) throw new Error("No linked bank account found for this user");
      return data.access_token as string;
    };

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
      const ownAccessToken = await getOwnAccessToken();
      const data = await plaidPost("/accounts/get", { access_token: ownAccessToken }) as { accounts: unknown[] };
      return new Response(JSON.stringify({ accounts: data.accounts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "initiate_transfer") {
      return new Response(JSON.stringify({
        success: false,
        code: "ACH_SETTLEMENT_NOT_CONFIGURED",
        error: "Bank funding is unavailable until a verified ACH settlement provider and webhook are configured.",
      }), {
        status: 503,
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
