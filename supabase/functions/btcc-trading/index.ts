/**
 * BTCC Trading Edge Function — WebSocket API
 * BTCC uses a WS-only API at wss://kapi1.btloginc.com:9082/v2/quot/
 * All actions (Login, PlaceOrder, GetAccountInfo, etc.) go through WS JSON messages.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BTCC_WS_URL = "wss://kapi1.btloginc.com:9082/v2/quot/";

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
  timeoutMs = 10000
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let ws: WebSocket;
    const timer = setTimeout(() => {
      try { ws?.close(); } catch (_) { /* noop */ }
      reject(new Error(`BTCC WS timed out after ${timeoutMs}ms`));
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
      try {
        const data = JSON.parse(String(event.data));
        ws.close();
        resolve(data);
      } catch (e) {
        ws.close();
        reject(new Error(`BTCC WS invalid response: ${event.data}`));
      }
    };

    ws.onerror = (event) => {
      clearTimeout(timer);
      reject(new Error(`BTCC WS error: ${JSON.stringify(event)}`));
    };

    ws.onclose = (event) => {
      if (!event.wasClean) {
        clearTimeout(timer);
        // Only reject if not already resolved
      }
    };
  });
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

// ── Public actions (no auth required) ───────────────────────────
async function getActiveContracts(): Promise<Record<string, unknown>> {
  return wsSendAndReceive({ action: "GetActiveContracts" });
}

async function getTrades(symbol: string, count = 50): Promise<Record<string, unknown>> {
  return wsSendAndReceive({ action: "GetTrades", symbol, count });
}

async function subscribeTicker(symbol: string): Promise<Record<string, unknown>> {
  return wsSendAndReceive({ action: "Subscribe", symbol });
}

// ── Private actions (auth required) ─────────────────────────────
async function login(publicKey: string, secretKey: string): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("Login", publicKey, secretKey);
  return wsSendAndReceive(msg);
}

async function getAccountInfo(publicKey: string, secretKey: string): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("GetAccountInfo", publicKey, secretKey);
  return wsSendAndReceive(msg);
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
  return wsSendAndReceive(msg);
}

async function getOpenOrders(
  publicKey: string,
  secretKey: string,
  symbol?: string
): Promise<Record<string, unknown>> {
  const extra: Record<string, unknown> = {};
  if (symbol) extra.symbol = symbol;
  const msg = await buildAuthMessage("GetOpenOrders", publicKey, secretKey, extra);
  return wsSendAndReceive(msg);
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
  return wsSendAndReceive(msg);
}

async function cancelAllOrders(
  publicKey: string,
  secretKey: string
): Promise<Record<string, unknown>> {
  const msg = await buildAuthMessage("CancelAllOrders", publicKey, secretKey);
  return wsSendAndReceive(msg);
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
    | "cancel_all";
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

    if (!BTCC_API_KEY || !BTCC_API_SECRET) {
      throw new Error("BTCC API credentials not configured.");
    }

    const body: BTCCRequest = await req.json();
    console.log(`BTCC WS Action: ${body.action}${body.symbol ? ` [${body.symbol}]` : ""}`);

    let result: Record<string, unknown>;

    switch (body.action) {
      // ── Public ──
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

      // ── Private ──
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
    console.error("BTCC Trading error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
