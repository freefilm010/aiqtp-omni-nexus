/**
 * BTCC Trading Edge Function — WebSocket API
 * BTCC uses a WS-only API at wss://kapi1.btloginc.com:9082/v2/quot/
 * All actions (Login, PlaceOrder, GetAccountInfo, etc.) go through WS JSON messages.
 *
 * NOTE: Edge Functions have limited WebSocket support. If the BTCC WS endpoint is
 * unreachable (firewall, geo-block, etc.), the function returns a structured error
 * with status 200 so the client can handle it gracefully.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BTCC_WS_URL = "wss://kapi1.btloginc.com:9082/v2/quot/";
const WS_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

// ── Auth helpers ────────────────────────────────────────────────
// Public actions: market data only, safe to expose anonymously.
const PUBLIC_ACTIONS = new Set(["get_contracts", "get_trades", "subscribe_ticker", "health_check"]);
// Destructive / fund-moving actions: require admin role.
const ADMIN_ACTIONS = new Set(["place_order", "cancel_order", "cancel_all", "login"]);
// All other authenticated actions: require any signed-in user (read-only account info).

async function authorizeRequest(
  req: Request,
  action: string
): Promise<{ ok: true; userId: string | null } | { ok: false; status: number; error: string }> {
  if (PUBLIC_ACTIONS.has(action)) {
    return { ok: true, userId: null };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { ok: false, status: 500, error: "Server auth not configured" };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await authClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }
  const userId = data.claims.sub as string;

  if (ADMIN_ACTIONS.has(action)) {
    // Use service role to bypass RLS when checking admin role.
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleRow, error: roleErr } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) {
      // Audit the rejected attempt.
      await adminClient.from("security_audit_log").insert({
        event_type: "btcc_admin_action_denied",
        user_id: userId,
        details: { action },
        severity: "warn",
      });
      return { ok: false, status: 403, error: "Admin role required for this action" };
    }

    // Audit the granted admin action.
    await adminClient.from("security_audit_log").insert({
      event_type: "btcc_admin_action_granted",
      user_id: userId,
      details: { action },
      severity: "info",
    });
  }

  return { ok: true, userId };
}

// ── Signature ───────────────────────────────────────────────────
function sortObj(obj: Record<string, unknown>): Record<string, unknown> {
  const res: Record<string, unknown> = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      res[k] = obj[k];
    });
  return res;
}

function stringify(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

async function signPayload(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const sorted = sortObj(payload);
  const content = stringify(sorted);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(content));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── WS helper: send message and wait for response ───────────────
function wsSendAndReceive(
  message: Record<string, unknown>,
  timeoutMs = WS_TIMEOUT_MS
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let ws: WebSocket;
    let settled = false;

    const settle = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    const timer = setTimeout(() => {
      settle(() => {
        try { ws?.close(); } catch (_) { /* noop */ }
        reject(new Error(`BTCC WS timed out after ${timeoutMs}ms`));
      });
    }, timeoutMs);

    try {
      ws = new WebSocket(BTCC_WS_URL);
    } catch (err) {
      clearTimeout(timer);
      reject(new Error(`Failed to connect to BTCC WS: ${err}`));
      return;
    }

    ws.onopen = () => {
      console.log("BTCC WS connected, sending:", JSON.stringify(message).slice(0, 200));
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      clearTimeout(timer);
      settle(() => {
        try {
          const data = JSON.parse(String(event.data));
          ws.close();
          resolve(data);
        } catch (e) {
          ws.close();
          reject(new Error(`BTCC WS invalid response: ${String(event.data).slice(0, 200)}`));
        }
      });
    };

    ws.onerror = (event) => {
      clearTimeout(timer);
      settle(() => reject(new Error(`BTCC WS connection error`)));
    };

    ws.onclose = (event) => {
      clearTimeout(timer);
      settle(() => {
        if (!event.wasClean) {
          reject(new Error(`BTCC WS closed unexpectedly (code ${event.code})`));
        }
      });
    };
  });
}

// Retry wrapper
async function wsSendWithRetry(
  message: Record<string, unknown>,
  retries = MAX_RETRIES
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`BTCC WS retry ${attempt}/${retries}...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      return await wsSendAndReceive(message);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`BTCC WS attempt ${attempt + 1} failed: ${lastError.message}`);
    }
  }
  throw lastError;
}

// ── Build authenticated message ─────────────────────────────────
async function buildAuthMessage(
  action: string,
  publicKey: string,
  secretKey: string,
  extra: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const timestamp = Date.now();
  const nonce = Math.floor(10000000 + Math.random() * 90000000).toString();

  const payload: Record<string, unknown> = {
    action,
    timestamp,
    nonce,
    public_key: publicKey,
    ...extra,
  };

  const sign = await signPayload(payload, secretKey);
  return { ...payload, sign };
}

// ── Public actions ──────────────────────────────────────────────
async function getActiveContracts(): Promise<Record<string, unknown>> {
  return wsSendWithRetry({ action: "GetActiveContracts" });
}

async function getTrades(symbol: string, count = 50): Promise<Record<string, unknown>> {
  return wsSendWithRetry({ action: "GetTrades", symbol, count });
}

async function subscribeTicker(symbol: string): Promise<Record<string, unknown>> {
  return wsSendWithRetry({ action: "Subscribe", symbol });
}

// ── Private actions ─────────────────────────────────────────────
async function login(publicKey: string, secretKey: string): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("Login", publicKey, secretKey);
  return wsSendWithRetry(msg);
}

async function getAccountInfo(publicKey: string, secretKey: string): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("GetAccountInfo", publicKey, secretKey);
  return wsSendWithRetry(msg);
}

async function placeOrder(
  publicKey: string,
  secretKey: string,
  params: {
    symbol: string;
    side: "BUY" | "SELL";
    order_type: "MARKET" | "LIMIT" | "STOP";
    price: number;
    quantity: number;
    stop_price?: number;
  }
): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("PlaceOrder", publicKey, secretKey, params);
  return wsSendWithRetry(msg);
}

async function getOpenOrders(
  publicKey: string,
  secretKey: string,
  symbol?: string
): Promise<Record<string, unknown>> {
  const extra: Record<string, unknown> = {};
  if (symbol) extra.symbol = symbol;
  const msg = await buildAuthMessage("GetOpenOrders", publicKey, secretKey, extra);
  return wsSendWithRetry(msg);
}

async function cancelOrder(
  publicKey: string,
  secretKey: string,
  symbol: string,
  orderId: string
): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("CancelOrder", publicKey, secretKey, {
    symbol,
    order_id: orderId,
  });
  return wsSendWithRetry(msg);
}

async function cancelAllOrders(
  publicKey: string,
  secretKey: string
): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("CancelAllOrders", publicKey, secretKey);
  return wsSendWithRetry(msg);
}

// ── Request interface ───────────────────────────────────────────
interface BTCCRequest {
  action:
    | "get_contracts"
    | "get_trades"
    | "subscribe_ticker"
    | "login"
    | "get_account"
    | "place_order"
    | "get_open_orders"
    | "cancel_order"
    | "cancel_all"
    | "health_check";
  symbol?: string;
  side?: "BUY" | "SELL";
  order_type?: "MARKET" | "LIMIT" | "STOP";
  price?: number;
  quantity?: number;
  stop_price?: number;
  order_id?: string;
  count?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BTCC_API_KEY = (Deno.env.get("BTCC_API_KEY") || "").trim();
    const BTCC_API_SECRET = (Deno.env.get("BTCC_API_SECRET") || "").trim();

    const body: BTCCRequest = await req.json();
    console.log(`BTCC WS Action: ${body.action}${body.symbol ? ` [${body.symbol}]` : ""}`);

    // ── Authorization gate ──────────────────────────────────────
    const authz = await authorizeRequest(req, body.action);
    if (!authz.ok) {
      return new Response(
        JSON.stringify({ success: false, error: authz.error, action: body.action }),
        { status: authz.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Health check — no WS needed
    if (body.action === "health_check") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            status: "ok",
            wsEndpoint: BTCC_WS_URL,
            hasCredentials: !!(BTCC_API_KEY && BTCC_API_SECRET),
            timestamp: new Date().toISOString(),
          },
          action: "health_check",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!BTCC_API_KEY || !BTCC_API_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BTCC API credentials not configured. Add BTCC_API_KEY and BTCC_API_SECRET.",
          action: body.action,
          recoverable: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: Record<string, unknown>;

    switch (body.action) {
      case "get_contracts":
        result = await getActiveContracts();
        break;
      case "get_trades":
        if (!body.symbol) throw new Error("symbol required");
        result = await getTrades(body.symbol, body.count || 50);
        break;
      case "subscribe_ticker":
        if (!body.symbol) throw new Error("symbol required");
        result = await subscribeTicker(body.symbol);
        break;
      case "login":
        result = await login(BTCC_API_KEY, BTCC_API_SECRET);
        break;
      case "get_account":
        result = await getAccountInfo(BTCC_API_KEY, BTCC_API_SECRET);
        break;
      case "place_order":
        if (!body.symbol || !body.side || !body.quantity)
          throw new Error("symbol, side, and quantity required");
        result = await placeOrder(BTCC_API_KEY, BTCC_API_SECRET, {
          symbol: body.symbol,
          side: body.side,
          order_type: body.order_type || "MARKET",
          price: body.price || 0,
          quantity: body.quantity,
          stop_price: body.stop_price,
        });
        break;
      case "get_open_orders":
        result = await getOpenOrders(BTCC_API_KEY, BTCC_API_SECRET, body.symbol);
        break;
      case "cancel_order":
        if (!body.symbol || !body.order_id)
          throw new Error("symbol and order_id required");
        result = await cancelOrder(BTCC_API_KEY, BTCC_API_SECRET, body.symbol, body.order_id);
        break;
      case "cancel_all":
        result = await cancelAllOrders(BTCC_API_KEY, BTCC_API_SECRET);
        break;
      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result, action: body.action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isTimeout = msg.includes("timed out") || msg.includes("connection error");
    console.error("BTCC Trading error:", msg);

    // Return 200 with structured error so client can handle gracefully
    return new Response(
      JSON.stringify({
        success: false,
        error: msg,
        recoverable: isTimeout,
        hint: isTimeout
          ? "BTCC WebSocket endpoint may be unreachable from this region. The connection will retry automatically on next request."
          : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
