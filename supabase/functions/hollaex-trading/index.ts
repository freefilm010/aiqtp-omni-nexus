// Live order execution on the platform's own white-label venue (HollaEx).
// Credentials never come from the client — they live in the backend vault.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Hard ceiling for a single vault-executed order, in quote-currency notional. */
const MAX_ORDER_NOTIONAL = 250;

type Action =
  | "status"
  | "fetch_balance"
  | "fetch_orders"
  | "create_order"
  | "cancel_order";

interface Body {
  action: Action;
  symbol?: string;
  side?: "buy" | "sell";
  orderType?: "market" | "limit";
  size?: number;
  price?: number;
  orderId?: string;
}

function vault() {
  const apiKey = Deno.env.get("HOLLAEX_API_KEY");
  const apiSecret = Deno.env.get("HOLLAEX_API_SECRET");
  const baseUrl = (Deno.env.get("HOLLAEX_BASE_URL") || "https://api.hollaex.com").replace(/\/+$/, "");
  const liveEnabled = Deno.env.get("HOLLAEX_LIVE_ENABLED") === "true";
  if (!apiKey || !apiSecret) return null;
  return { apiKey, apiSecret, baseUrl, liveEnabled };
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Signed HollaEx v2 request: signature = HMAC(secret, VERB + PATH + EXPIRES + BODY). */
async function signedRequest(
  v: NonNullable<ReturnType<typeof vault>>,
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
) {
  const expires = Math.floor(Date.now() / 1000) + 60;
  const payload = body ? JSON.stringify(body) : "";
  const signature = await hmacHex(v.apiSecret, `${method}${path}${expires}${payload}`);
  const res = await fetch(`${v.baseUrl}${path}`, {
    method,
    headers: {
      "api-key": v.apiKey,
      "api-signature": signature,
      "api-expires": String(expires),
      "Content-Type": "application/json",
    },
    ...(payload ? { body: payload } : {}),
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) {
    throw new Error((data as { message?: string })?.message || `Venue returned ${res.status}`);
  }
  return data;
}

async function requireAdmin(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !url || !anon || !service) return null;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader! } } });
  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user) return null;
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return isAdmin === true ? user.id : null;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json() as Body;
    const adminId = await requireAdmin(req);
    if (!adminId) return json({ success: false, error: "Unauthorized" }, 401);

    const v = vault();

    if (body.action === "status") {
      return json({
        success: true,
        data: {
          venue: "hollaex",
          credentials_present: Boolean(v),
          live_execution_enabled: Boolean(v?.liveEnabled),
          max_order_notional: MAX_ORDER_NOTIONAL,
        },
      });
    }

    if (!v) {
      return json({
        success: false,
        code: "VENUE_CREDENTIALS_MISSING",
        error: "Venue credentials are not configured. Live execution is unavailable.",
      }, 503);
    }
    if (!v.liveEnabled) {
      return json({
        success: false,
        code: "LIVE_EXECUTION_DISABLED",
        error: "Live execution is switched off. Enable it in the backend configuration to place real orders.",
      }, 503);
    }

    switch (body.action) {
      case "fetch_balance":
        return json({ success: true, data: await signedRequest(v, "GET", "/v2/user/balance") });

      case "fetch_orders": {
        const path = body.symbol ? `/v2/orders?symbol=${encodeURIComponent(body.symbol)}` : "/v2/orders";
        return json({ success: true, data: await signedRequest(v, "GET", path) });
      }

      case "create_order": {
        const { symbol, side, size, price, orderType } = body;
        if (!symbol || !side || !size) throw new Error("symbol, side and size are required");
        if (!["buy", "sell"].includes(side)) throw new Error("Invalid side");
        const type = orderType === "limit" ? "limit" : "market";
        if (type === "limit" && !price) throw new Error("price is required for a limit order");
        if (price) {
          const notional = Number(price) * Number(size);
          if (!Number.isFinite(notional) || notional <= 0) throw new Error("Invalid order size");
          if (notional > MAX_ORDER_NOTIONAL) {
            return json({
              success: false,
              code: "ORDER_NOTIONAL_LIMIT",
              error: `Order notional ${notional.toFixed(2)} exceeds the ${MAX_ORDER_NOTIONAL} per-order limit.`,
            }, 400);
          }
        }
        const order = await signedRequest(v, "POST", "/v2/order", {
          symbol, side, size, type, ...(type === "limit" ? { price } : {}),
        });
        return json({ success: true, data: order });
      }

      case "cancel_order": {
        if (!body.orderId) throw new Error("orderId is required");
        const path = `/v2/order?order_id=${encodeURIComponent(body.orderId)}`;
        return json({ success: true, data: await signedRequest(v, "DELETE", path) });
      }

      default:
        return json({ success: false, error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("hollaex-trading error:", e);
    return json({ success: false, error: (e as Error).message }, 200);
  }
});
