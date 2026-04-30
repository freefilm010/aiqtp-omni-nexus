/**
 * get-market-prices
 *
 * Secure server-side proxy for CoinGecko price data.
 * The browser never calls CoinGecko directly — all requests route through
 * this edge function so the API key stays server-side.
 *
 * Request:  POST  { "symbols": ["BTC", "ETH", "SOL"] }
 * Response: { "BTC": { "priceUsd": 65000, "change24hPercent": 1.2, ... }, ... }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COINGECKO_FREE_API = "https://api.coingecko.com/api/v3";
const COINGECKO_PRO_API  = "https://pro-api.coingecko.com/api/v3";

// Enforce a minimum gap between outbound CoinGecko calls (free tier: 30 req/min)
let lastCallAt = 0;
const MIN_CALL_INTERVAL_MS = 2000;

// ─── Symbol → CoinGecko ID mapping ───────────────────────────────────────────
const COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",        ETH: "ethereum",        SOL: "solana",
  BNB: "binancecoin",    XRP: "ripple",           ADA: "cardano",
  DOGE: "dogecoin",      AVAX: "avalanche-2",     DOT: "polkadot",
  LINK: "chainlink",     MATIC: "matic-network",  TRX: "tron",
  LTC: "litecoin",       ATOM: "cosmos",          NEAR: "near",
  FTM: "fantom",         SUI: "sui",              APT: "aptos",
  SEI: "sei-network",    INJ: "injective-protocol",
  ARB: "arbitrum",       OP: "optimism",          STRK: "starknet",
  BASE: "base-protocol",
  XLM: "stellar",        ALGO: "algorand",        RVN: "ravencoin",
  XMR: "monero",         ZEC: "zcash",            DASH: "dash",
  UNI: "uniswap",        AAVE: "aave",            MKR: "maker",
  COMP: "compound-governance-token",
  LDO: "lido-dao",       RPL: "rocket-pool",      CRV: "curve-dao-token",
  CVX: "convex-finance",
  RNDR: "render-token",  FET: "fetch-ai",         OCEAN: "ocean-protocol",
  AGIX: "singularitynet", GRT: "the-graph",       FIL: "filecoin",
  AR: "arweave",         HNT: "helium",           AKT: "akash-network",
  PEPE: "pepe",          WIF: "dogwifcoin",       BONK: "bonk",
  SHIB: "shiba-inu",     FLOKI: "floki",
  USDC: "usd-coin",      USDT: "tether",          DAI: "dai",
  FRAX: "frax",
};

// Reverse map for response assembly
const SYMBOL_BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_ID).map(([sym, id]) => [id, sym])
);

// ─── Fetch with rate-limit guard and exponential back-off ─────────────────────
async function fetchWithRateLimit(
  url: string,
  apiKey: string | undefined,
  maxRetries = 2
): Promise<Response> {
  const now = Date.now();
  const gap = now - lastCallAt;
  if (gap < MIN_CALL_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_CALL_INTERVAL_MS - gap));
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-cg-pro-api-key"] = apiKey;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastCallAt = Date.now();
    const res = await fetch(url, { headers });

    if (res.status === 429) {
      const wait = Math.pow(2, attempt + 1) * 1000; // 2 s, 4 s, 8 s
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new Error(`CoinGecko rate-limited after ${maxRetries + 1} attempts`);
    }

    return res;
  }

  throw new Error("Unreachable");
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req) => {
  // CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawSymbols: unknown = body?.symbols;

    if (!Array.isArray(rawSymbols) || rawSymbols.length === 0) {
      return new Response(
        JSON.stringify({ error: "Request body must include a non-empty `symbols` array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize, deduplicate, cap at 50 (CoinGecko URL length limit)
    const symbols: string[] = [
      ...new Set(
        rawSymbols
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.toUpperCase())
          .filter((s) => s in COINGECKO_ID)
      ),
    ].slice(0, 50);

    if (symbols.length === 0) {
      return new Response(JSON.stringify({}), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = symbols.map((s) => COINGECKO_ID[s]);
    const apiKey = Deno.env.get("COINGECKO_API_KEY");
    const baseUrl = apiKey ? COINGECKO_PRO_API : COINGECKO_FREE_API;

    const url = new URL(`${baseUrl}/simple/price`);
    url.searchParams.set("ids", ids.join(","));
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_24hr_change", "true");
    url.searchParams.set("include_market_cap", "true");
    url.searchParams.set("include_24hr_vol", "true");

    const res = await fetchWithRateLimit(url.toString(), apiKey);

    if (!res.ok) {
      throw new Error(`CoinGecko responded ${res.status}: ${await res.text()}`);
    }

    type CoinGeckoRow = {
      usd?: number;
      usd_24h_change?: number;
      usd_market_cap?: number;
      usd_24h_vol?: number;
    };
    const raw = (await res.json()) as Record<string, CoinGeckoRow>;

    // Map back to symbol-keyed CryptoQuote objects
    const result: Record<string, {
      priceUsd: number;
      change24hPercent: number | null;
      marketCap?: number;
      volume24h?: number;
    }> = {};

    for (const id of ids) {
      const row = raw[id];
      if (!row || typeof row.usd !== "number") continue;
      const symbol = SYMBOL_BY_ID[id];
      if (!symbol) continue;
      result[symbol] = {
        priceUsd: row.usd,
        change24hPercent: typeof row.usd_24h_change === "number" ? row.usd_24h_change : null,
        marketCap: row.usd_market_cap,
        volume24h: row.usd_24h_vol,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Cache for 30 s at CDN layer — prices are ~1 min delayed on free tier anyway
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (err) {
    console.error("[get-market-prices] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
