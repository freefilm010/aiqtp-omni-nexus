import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TradingRequest {
  action: "fetch_markets" | "fetch_ticker" | "fetch_ohlcv" | "fetch_balance" | "create_order" | "fetch_orders" | "cancel_order";
  exchange: "binance" | "coinbase" | "kraken" | "bybit" | "kucoin" | "okx";
  symbol?: string;
  orderType?: "market" | "limit";
  side?: "buy" | "sell";
  amount?: number;
  price?: number;
  orderId?: string;
  timeframe?: string;
  limit?: number;
  // API credentials (encrypted client-side, stored in user profile)
  apiKey?: string;
  secret?: string;
  passphrase?: string; // For exchanges that require it
}

// Exchange API endpoints
const exchangeEndpoints: Record<string, { rest: string; ws: string }> = {
  binance: { rest: "https://api.binance.com", ws: "wss://stream.binance.com:9443" },
  coinbase: { rest: "https://api.coinbase.com", ws: "wss://ws-feed.exchange.coinbase.com" },
  kraken: { rest: "https://api.kraken.com", ws: "wss://ws.kraken.com" },
  bybit: { rest: "https://api.bybit.com", ws: "wss://stream.bybit.com" },
  kucoin: { rest: "https://api.kucoin.com", ws: "wss://ws-api.kucoin.com" },
  okx: { rest: "https://www.okx.com", ws: "wss://ws.okx.com:8443" },
};

// Binance implementation (primary exchange)
async function binanceFetchTicker(symbol: string) {
  const formattedSymbol = symbol.replace("/", "");
  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${formattedSymbol}`
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      typeof data?.msg === "string"
        ? data.msg
        : typeof data?.message === "string"
          ? data.message
          : `HTTP ${response.status}`;
    throw new Error(`Binance ticker error [${response.status}]: ${msg}`);
  }

  // Guard against malformed payloads (Binance sometimes returns an error object with 200/JSON)
  if (typeof data?.lastPrice !== "string" && typeof data?.lastPrice !== "number") {
    throw new Error(`Binance ticker malformed response: ${JSON.stringify(data)}`);
  }

  return {
    symbol,
    last: Number.parseFloat(String(data.lastPrice)),
    bid: Number.parseFloat(String(data.bidPrice)),
    ask: Number.parseFloat(String(data.askPrice)),
    high: Number.parseFloat(String(data.highPrice)),
    low: Number.parseFloat(String(data.lowPrice)),
    volume: Number.parseFloat(String(data.volume)),
    quoteVolume: Number.parseFloat(String(data.quoteVolume)),
    change: Number.parseFloat(String(data.priceChange)),
    changePercent: Number.parseFloat(String(data.priceChangePercent)),
    timestamp: data.closeTime,
  };
}

async function binanceFetchOHLCV(symbol: string, timeframe: string = "1h", limit: number = 100) {
  const formattedSymbol = symbol.replace("/", "");
  const intervalMap: Record<string, string> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1w": "1w",
  };
  const interval = intervalMap[timeframe] || "1h";

  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg =
      typeof (data as any)?.msg === "string"
        ? (data as any).msg
        : typeof (data as any)?.message === "string"
          ? (data as any).message
          : `HTTP ${response.status}`;
    throw new Error(`Binance OHLCV error [${response.status}]: ${msg}`);
  }

  if (!Array.isArray(data)) {
    // This is the root cause of: "data.map is not a function"
    throw new Error(`Binance OHLCV malformed response: ${JSON.stringify(data)}`);
  }

  return data.map((candle: any[]) => ({
    timestamp: candle[0],
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
    quoteVolume: parseFloat(candle[7]),
    trades: candle[8],
  }));
}

async function binanceFetchMarkets() {
  const response = await fetch("https://api.binance.com/api/v3/exchangeInfo");
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      typeof data?.msg === "string"
        ? data.msg
        : typeof data?.message === "string"
          ? data.message
          : `HTTP ${response.status}`;
    throw new Error(`Binance markets error [${response.status}]: ${msg}`);
  }

  if (!Array.isArray(data?.symbols)) {
    throw new Error(`Binance markets malformed response: ${JSON.stringify(data)}`);
  }

  return data.symbols
    .filter((s: any) => s.status === "TRADING")
    .slice(0, 500)
    .map((s: any) => ({
      symbol: `${s.baseAsset}/${s.quoteAsset}`,
      base: s.baseAsset,
      quote: s.quoteAsset,
      active: s.status === "TRADING",
      precision: {
        price: s.quotePrecision,
        amount: s.baseAssetPrecision,
      },
      limits: {
        amount: {
          min: parseFloat(s.filters.find((f: any) => f.filterType === "LOT_SIZE")?.minQty || "0"),
          max: parseFloat(s.filters.find((f: any) => f.filterType === "LOT_SIZE")?.maxQty || "0"),
        },
      },
    }));
}

// Kraken implementation (public market data)
function krakenPairFromSymbol(symbol: string) {
  const [baseRaw, quoteRaw] = symbol.split("/");
  const base = baseRaw === "BTC" ? "XBT" : baseRaw;
  const quote = quoteRaw || "USD";
  return `${base}${quote}`;
}

function krakenIntervalFromTimeframe(timeframe: string) {
  const map: Record<string, number> = {
    "1m": 1,
    "5m": 5,
    "15m": 15,
    "30m": 30,
    "1h": 60,
    "4h": 240,
    "1d": 1440,
    "1w": 10080,
  };
  return map[timeframe] ?? 60;
}

async function krakenFetchTicker(symbol: string) {
  const pair = krakenPairFromSymbol(symbol);
  const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Kraken ticker error [${response.status}]: ${JSON.stringify(data)}`);
  }

  const apiErrors = Array.isArray((data as any)?.error) ? (data as any).error : [];
  if (apiErrors.length) {
    throw new Error(`Kraken ticker error: ${apiErrors.join("; ")}`);
  }

  const result = (data as any)?.result;
  const key = result && typeof result === "object" ? Object.keys(result)[0] : null;
  const t = key ? result[key] : null;
  if (!t) {
    throw new Error(`Kraken ticker malformed response: ${JSON.stringify(data)}`);
  }

  const last = Number(t?.c?.[0]);
  const bid = Number(t?.b?.[0]);
  const ask = Number(t?.a?.[0]);
  const high = Number(t?.h?.[1] ?? t?.h?.[0]);
  const low = Number(t?.l?.[1] ?? t?.l?.[0]);
  const volume = Number(t?.v?.[1] ?? t?.v?.[0]);
  const open = Number(t?.o);
  const change = Number.isFinite(open) && open > 0 ? last - open : 0;
  const changePercent = Number.isFinite(open) && open > 0 ? (change / open) * 100 : 0;

  if (!Number.isFinite(last)) {
    throw new Error(`Kraken ticker missing last price: ${JSON.stringify(t)}`);
  }

  return {
    symbol,
    last,
    bid: Number.isFinite(bid) ? bid : last,
    ask: Number.isFinite(ask) ? ask : last,
    high: Number.isFinite(high) ? high : last,
    low: Number.isFinite(low) ? low : last,
    volume: Number.isFinite(volume) ? volume : 0,
    quoteVolume: Number.isFinite(volume) ? volume * last : 0,
    change,
    changePercent,
    timestamp: Date.now(),
  };
}

async function krakenFetchOHLCV(symbol: string, timeframe: string = "1h", limit: number = 100) {
  const pair = krakenPairFromSymbol(symbol);
  const interval = krakenIntervalFromTimeframe(timeframe);

  const response = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Kraken OHLCV error [${response.status}]: ${JSON.stringify(data)}`);
  }

  const apiErrors = Array.isArray((data as any)?.error) ? (data as any).error : [];
  if (apiErrors.length) {
    throw new Error(`Kraken OHLCV error: ${apiErrors.join("; ")}`);
  }

  const result = (data as any)?.result;
  const key = result && typeof result === "object" ? Object.keys(result).find((k) => k !== "last") : null;
  const rows: any[] | null = key ? result[key] : null;
  if (!Array.isArray(rows)) {
    throw new Error(`Kraken OHLCV malformed response: ${JSON.stringify(data)}`);
  }

  const sliced = rows.slice(Math.max(0, rows.length - Math.max(1, limit)));

  return sliced.map((c: any[]) => {
    const tsSec = Number(c?.[0]);
    const open = Number(c?.[1]);
    const high = Number(c?.[2]);
    const low = Number(c?.[3]);
    const close = Number(c?.[4]);
    const volume = Number(c?.[6]);
    const trades = Number(c?.[7]);

    return {
      timestamp: tsSec * 1000,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
      quoteVolume: Number.isFinite(volume) && Number.isFinite(close) ? volume * close : 0,
      trades: Number.isFinite(trades) ? trades : 0,
    };
  });
}

async function krakenFetchMarkets() {
  const response = await fetch("https://api.kraken.com/0/public/AssetPairs");
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Kraken markets error [${response.status}]: ${JSON.stringify(data)}`);
  }

  const apiErrors = Array.isArray((data as any)?.error) ? (data as any).error : [];
  if (apiErrors.length) {
    throw new Error(`Kraken markets error: ${apiErrors.join("; ")}`);
  }

  const result = (data as any)?.result;
  if (!result || typeof result !== "object") {
    throw new Error(`Kraken markets malformed response: ${JSON.stringify(data)}`);
  }

  const pairs = Object.values(result)
    .map((p: any) => {
      const wsname: string | undefined = p?.wsname;
      if (!wsname || !wsname.includes("/")) return null;
      const [base, quote] = wsname.split("/");
      const baseNorm = base === "XBT" ? "BTC" : base;
      return {
        symbol: `${baseNorm}/${quote}`,
        base: baseNorm,
        quote,
        active: true,
        precision: { price: 8, amount: 8 },
        limits: { amount: { min: 0, max: 0 } },
      };
    })
    .filter(Boolean)
    .slice(0, 500);

  return pairs;
}

async function binanceFetchBalance(apiKey: string, secret: string) {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  
  // Create HMAC signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(queryString);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const response = await fetch(
    `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`,
    { headers: { "X-MBX-APIKEY": apiKey } }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || "Failed to fetch balance");
  }
  
  const data = await response.json();
  const balances = data.balances
    .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    .map((b: any) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked),
    }));
  
  return { balances, updateTime: data.updateTime };
}

async function binanceCreateOrder(
  apiKey: string,
  secret: string,
  symbol: string,
  side: "buy" | "sell",
  orderType: "market" | "limit",
  amount: number,
  price?: number
) {
  const timestamp = Date.now();
  const formattedSymbol = symbol.replace("/", "");
  
  let params = `symbol=${formattedSymbol}&side=${side.toUpperCase()}&type=${orderType.toUpperCase()}&quantity=${amount}&timestamp=${timestamp}`;
  
  if (orderType === "limit" && price) {
    params += `&price=${price}&timeInForce=GTC`;
  }
  
  // Create HMAC signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(params);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const response = await fetch(
    `https://api.binance.com/api/v3/order?${params}&signature=${signatureHex}`,
    {
      method: "POST",
      headers: { "X-MBX-APIKEY": apiKey },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || "Failed to create order");
  }
  
  const order = await response.json();
  return {
    orderId: order.orderId,
    symbol: order.symbol,
    side: order.side.toLowerCase(),
    type: order.type.toLowerCase(),
    status: order.status,
    price: parseFloat(order.price),
    amount: parseFloat(order.origQty),
    filled: parseFloat(order.executedQty),
    remaining: parseFloat(order.origQty) - parseFloat(order.executedQty),
    timestamp: order.transactTime,
  };
}

async function binanceFetchOrders(apiKey: string, secret: string, symbol?: string) {
  const timestamp = Date.now();
  let queryString = `timestamp=${timestamp}`;
  if (symbol) {
    queryString += `&symbol=${symbol.replace("/", "")}`;
  }
  
  // Create HMAC signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(queryString);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const response = await fetch(
    `https://api.binance.com/api/v3/openOrders?${queryString}&signature=${signatureHex}`,
    { headers: { "X-MBX-APIKEY": apiKey } }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || "Failed to fetch orders");
  }
  
  const orders = await response.json();
  return orders.map((order: any) => ({
    orderId: order.orderId,
    symbol: order.symbol,
    side: order.side.toLowerCase(),
    type: order.type.toLowerCase(),
    status: order.status,
    price: parseFloat(order.price),
    amount: parseFloat(order.origQty),
    filled: parseFloat(order.executedQty),
    remaining: parseFloat(order.origQty) - parseFloat(order.executedQty),
    timestamp: order.time,
  }));
}

async function binanceCancelOrder(apiKey: string, secret: string, symbol: string, orderId: string) {
  const timestamp = Date.now();
  const formattedSymbol = symbol.replace("/", "");
  const queryString = `symbol=${formattedSymbol}&orderId=${orderId}&timestamp=${timestamp}`;
  
  // Create HMAC signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(queryString);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const response = await fetch(
    `https://api.binance.com/api/v3/order?${queryString}&signature=${signatureHex}`,
    {
      method: "DELETE",
      headers: { "X-MBX-APIKEY": apiKey },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || "Failed to cancel order");
  }
  
  const result = await response.json();
  return { orderId: result.orderId, status: "cancelled" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TradingRequest = await req.json();
    const { action, exchange, symbol, orderType, side, amount, price, orderId, timeframe, limit, apiKey, secret } = body;

    console.log(`CCXT Trading: ${action} on ${exchange}${symbol ? ` for ${symbol}` : ""}`);

    let result: any;

    const supportedExchanges = ["binance", "kraken"] as const;
    if (!(supportedExchanges as readonly string[]).includes(exchange)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Exchange ${exchange} not supported`,
          supportedExchanges,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const isPublicAction = action === "fetch_markets" || action === "fetch_ticker" || action === "fetch_ohlcv";
    if (exchange === "kraken" && !isPublicAction) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Action ${action} is not supported for kraken (public market data only)`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    switch (action) {
      case "fetch_markets":
        result = exchange === "binance" ? await binanceFetchMarkets() : await krakenFetchMarkets();
        break;

      case "fetch_ticker":
        if (!symbol) throw new Error("Symbol required for fetch_ticker");
        result = exchange === "binance" ? await binanceFetchTicker(symbol) : await krakenFetchTicker(symbol);
        break;

      case "fetch_ohlcv":
        if (!symbol) throw new Error("Symbol required for fetch_ohlcv");
        result =
          exchange === "binance"
            ? await binanceFetchOHLCV(symbol, timeframe || "1h", limit || 100)
            : await krakenFetchOHLCV(symbol, timeframe || "1h", limit || 100);
        break;

      case "fetch_balance":
        if (exchange !== "binance") throw new Error("fetch_balance is only supported for binance");
        if (!apiKey || !secret) throw new Error("API credentials required for fetch_balance");
        result = await binanceFetchBalance(apiKey, secret);
        break;

      case "create_order":
        if (exchange !== "binance") throw new Error("create_order is only supported for binance");
        if (!apiKey || !secret) throw new Error("API credentials required for create_order");
        if (!symbol || !side || !amount) throw new Error("Symbol, side, and amount required for create_order");
        result = await binanceCreateOrder(apiKey, secret, symbol, side, orderType || "market", amount, price);
        break;

      case "fetch_orders":
        if (exchange !== "binance") throw new Error("fetch_orders is only supported for binance");
        if (!apiKey || !secret) throw new Error("API credentials required for fetch_orders");
        result = await binanceFetchOrders(apiKey, secret, symbol);
        break;

      case "cancel_order":
        if (exchange !== "binance") throw new Error("cancel_order is only supported for binance");
        if (!apiKey || !secret) throw new Error("API credentials required for cancel_order");
        if (!symbol || !orderId) throw new Error("Symbol and orderId required for cancel_order");
        result = await binanceCancelOrder(apiKey, secret, symbol, orderId);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result, exchange, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("CCXT Trading error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
