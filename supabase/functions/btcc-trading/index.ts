import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BTCCRequest {
  action: "fetch_ticker" | "fetch_ohlcv" | "fetch_balance" | "create_order" | "fetch_orders" | "cancel_order" | "fetch_positions";
  market: "spot" | "futures";
  symbol?: string;
  orderType?: "market" | "limit";
  side?: "buy" | "sell";
  amount?: number;
  price?: number;
  orderId?: string;
  timeframe?: string;
  limit?: number;
  leverage?: number;
}

const BTCC_API_BASE = "https://api.btcc.com";

// Generate HMAC-SHA256 signature for BTCC API
async function generateSignature(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Build safe headers to avoid ByteString issues with non-ASCII chars
function safeHeaders(apiKey: string, extra?: Record<string, string>): Headers {
  const h = new Headers();
  h.set("X-API-KEY", apiKey.replace(/[^\x20-\x7E]/g, ""));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      h.set(k, v);
    }
  }
  return h;
}

// BTCC Spot API Functions
async function btccSpotFetchTicker(apiKey: string, secret: string, symbol: string) {
  const timestamp = Date.now();
  const params = `symbol=${symbol}&timestamp=${timestamp}`;
  const signature = await generateSignature(secret, params);
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/spot/ticker?${params}&signature=${signature}`,
    { headers: safeHeaders(apiKey) }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC Spot ticker error [${response.status}]`);
  }
  
  return {
    symbol,
    last: parseFloat(data.data?.lastPrice || "0"),
    bid: parseFloat(data.data?.bidPrice || "0"),
    ask: parseFloat(data.data?.askPrice || "0"),
    high: parseFloat(data.data?.highPrice || "0"),
    low: parseFloat(data.data?.lowPrice || "0"),
    volume: parseFloat(data.data?.volume || "0"),
    quoteVolume: parseFloat(data.data?.quoteVolume || "0"),
    changePercent: parseFloat(data.data?.priceChangePercent || "0"),
    timestamp: Date.now(),
    exchange: "btcc",
    market: "spot",
  };
}

async function btccSpotFetchBalance(apiKey: string, secret: string) {
  const timestamp = Date.now();
  const params = `timestamp=${timestamp}`;
  const signature = await generateSignature(secret, params);
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/spot/account?${params}&signature=${signature}`,
    { headers: safeHeaders(apiKey) }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC Spot balance error [${response.status}]`);
  }
  
  const balances = (data.data?.balances || []).map((b: any) => ({
    asset: b.asset,
    free: parseFloat(b.free || "0"),
    locked: parseFloat(b.locked || "0"),
    total: parseFloat(b.free || "0") + parseFloat(b.locked || "0"),
  })).filter((b: any) => b.total > 0);
  
  return { balances, updateTime: Date.now(), market: "spot" };
}

async function btccSpotCreateOrder(
  apiKey: string,
  secret: string,
  symbol: string,
  side: "buy" | "sell",
  orderType: "market" | "limit",
  amount: number,
  price?: number
) {
  const timestamp = Date.now();
  let params = `symbol=${symbol}&side=${side.toUpperCase()}&type=${orderType.toUpperCase()}&quantity=${amount}&timestamp=${timestamp}`;
  
  if (orderType === "limit" && price) {
    params += `&price=${price}`;
  }
  
  const signature = await generateSignature(secret, params);
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/spot/order`,
    {
      method: "POST",
      headers: safeHeaders(apiKey, { "Content-Type": "application/x-www-form-urlencoded" }),
      body: `${params}&signature=${signature}`,
    }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC Spot order error [${response.status}]`);
  }
  
  return {
    orderId: data.data?.orderId,
    symbol,
    side,
    type: orderType,
    status: data.data?.status || "NEW",
    price: price || 0,
    amount,
    filled: parseFloat(data.data?.executedQty || "0"),
    remaining: amount - parseFloat(data.data?.executedQty || "0"),
    timestamp: Date.now(),
    market: "spot",
  };
}

// BTCC Futures Pro API Functions
async function btccFuturesFetchTicker(apiKey: string, secret: string, symbol: string) {
  const timestamp = Date.now();
  const params = `symbol=${symbol}&timestamp=${timestamp}`;
  const signature = await generateSignature(secret, params);
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/futures/ticker?${params}&signature=${signature}`,
    { headers: safeHeaders(apiKey) }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC Futures ticker error [${response.status}]`);
  }
  
  return {
    symbol,
    last: parseFloat(data.data?.lastPrice || "0"),
    markPrice: parseFloat(data.data?.markPrice || "0"),
    indexPrice: parseFloat(data.data?.indexPrice || "0"),
    fundingRate: parseFloat(data.data?.fundingRate || "0"),
    high: parseFloat(data.data?.highPrice || "0"),
    low: parseFloat(data.data?.lowPrice || "0"),
    volume: parseFloat(data.data?.volume || "0"),
    openInterest: parseFloat(data.data?.openInterest || "0"),
    timestamp: Date.now(),
    exchange: "btcc",
    market: "futures",
  };
}

async function btccFuturesFetchPositions(apiKey: string, secret: string) {
  const timestamp = Date.now();
  const params = `timestamp=${timestamp}`;
  const signature = await generateSignature(secret, params);
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/futures/positions?${params}&signature=${signature}`,
    { headers: safeHeaders(apiKey) }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC Futures positions error [${response.status}]`);
  }
  
  return (data.data || []).map((p: any) => ({
    symbol: p.symbol,
    side: p.positionSide?.toLowerCase() || "long",
    size: parseFloat(p.positionAmt || "0"),
    entryPrice: parseFloat(p.entryPrice || "0"),
    markPrice: parseFloat(p.markPrice || "0"),
    unrealizedPnl: parseFloat(p.unrealizedProfit || "0"),
    leverage: parseInt(p.leverage || "1"),
    marginType: p.marginType || "cross",
    liquidationPrice: parseFloat(p.liquidationPrice || "0"),
  }));
}

async function btccFuturesCreateOrder(
  apiKey: string,
  secret: string,
  symbol: string,
  side: "buy" | "sell",
  orderType: "market" | "limit",
  amount: number,
  price?: number,
  leverage?: number
) {
  const timestamp = Date.now();
  let params = `symbol=${symbol}&side=${side.toUpperCase()}&type=${orderType.toUpperCase()}&quantity=${amount}&timestamp=${timestamp}`;
  
  if (orderType === "limit" && price) {
    params += `&price=${price}`;
  }
  if (leverage) {
    params += `&leverage=${leverage}`;
  }
  
  const signature = await generateSignature(secret, params);
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/futures/order`,
    {
      method: "POST",
      headers: safeHeaders(apiKey, { "Content-Type": "application/x-www-form-urlencoded" }),
      body: `${params}&signature=${signature}`,
    }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC Futures order error [${response.status}]`);
  }
  
  return {
    orderId: data.data?.orderId,
    symbol,
    side,
    type: orderType,
    status: data.data?.status || "NEW",
    price: price || 0,
    amount,
    filled: parseFloat(data.data?.executedQty || "0"),
    remaining: amount - parseFloat(data.data?.executedQty || "0"),
    leverage: leverage || 1,
    timestamp: Date.now(),
    market: "futures",
  };
}

async function btccFetchOrders(apiKey: string, secret: string, market: "spot" | "futures", symbol?: string) {
  const timestamp = Date.now();
  let params = `timestamp=${timestamp}`;
  if (symbol) {
    params += `&symbol=${symbol}`;
  }
  const signature = await generateSignature(secret, params);
  
  const endpoint = market === "spot" ? "spot" : "futures";
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/${endpoint}/openOrders?${params}&signature=${signature}`,
    { headers: safeHeaders(apiKey) }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC ${market} orders error [${response.status}]`);
  }
  
  return (data.data || []).map((o: any) => ({
    orderId: o.orderId,
    symbol: o.symbol,
    side: o.side?.toLowerCase(),
    type: o.type?.toLowerCase(),
    status: o.status,
    price: parseFloat(o.price || "0"),
    amount: parseFloat(o.origQty || "0"),
    filled: parseFloat(o.executedQty || "0"),
    timestamp: o.time || Date.now(),
    market,
  }));
}

async function btccCancelOrder(apiKey: string, secret: string, market: "spot" | "futures", symbol: string, orderId: string) {
  const timestamp = Date.now();
  const params = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
  const signature = await generateSignature(secret, params);
  
  const endpoint = market === "spot" ? "spot" : "futures";
  
  const response = await fetch(
    `${BTCC_API_BASE}/api/v1/${endpoint}/order?${params}&signature=${signature}`,
    {
      method: "DELETE",
      headers: safeHeaders(apiKey),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.code !== 0) {
    throw new Error(data.message || `BTCC ${market} cancel error [${response.status}]`);
  }
  
  return { orderId, status: "cancelled", market };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get BTCC credentials from environment (stored via Lovable secrets)
    const BTCC_API_KEY = (Deno.env.get("BTCC_API_KEY") || "").replace(/[^\x20-\x7E]/g, "").trim();
    const BTCC_API_SECRET = (Deno.env.get("BTCC_API_SECRET") || "").replace(/[^\x20-\x7E]/g, "").trim();
    
    if (!BTCC_API_KEY || !BTCC_API_SECRET) {
      throw new Error("BTCC API credentials not configured. Please add BTCC_API_KEY and BTCC_API_SECRET.");
    }
    
    const body: BTCCRequest = await req.json();
    const { action, market, symbol, orderType, side, amount, price, orderId, leverage } = body;
    
    console.log(`BTCC Trading: ${action} on ${market}${symbol ? ` for ${symbol}` : ""}`);
    
    let result: any;
    
    switch (action) {
      case "fetch_ticker":
        if (!symbol) throw new Error("Symbol required for fetch_ticker");
        result = market === "spot" 
          ? await btccSpotFetchTicker(BTCC_API_KEY, BTCC_API_SECRET, symbol)
          : await btccFuturesFetchTicker(BTCC_API_KEY, BTCC_API_SECRET, symbol);
        break;
        
      case "fetch_balance":
        if (market !== "spot") throw new Error("fetch_balance only supported for spot market");
        result = await btccSpotFetchBalance(BTCC_API_KEY, BTCC_API_SECRET);
        break;
        
      case "fetch_positions":
        if (market !== "futures") throw new Error("fetch_positions only supported for futures market");
        result = await btccFuturesFetchPositions(BTCC_API_KEY, BTCC_API_SECRET);
        break;
        
      case "create_order":
        if (!symbol || !side || !amount) throw new Error("Symbol, side, and amount required for create_order");
        result = market === "spot"
          ? await btccSpotCreateOrder(BTCC_API_KEY, BTCC_API_SECRET, symbol, side, orderType || "market", amount, price)
          : await btccFuturesCreateOrder(BTCC_API_KEY, BTCC_API_SECRET, symbol, side, orderType || "market", amount, price, leverage);
        break;
        
      case "fetch_orders":
        result = await btccFetchOrders(BTCC_API_KEY, BTCC_API_SECRET, market, symbol);
        break;
        
      case "cancel_order":
        if (!symbol || !orderId) throw new Error("Symbol and orderId required for cancel_order");
        result = await btccCancelOrder(BTCC_API_KEY, BTCC_API_SECRET, market, symbol, orderId);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result, exchange: "btcc", market, action }),
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
