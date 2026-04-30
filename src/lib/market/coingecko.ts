/**
 * Market price module.
 *
 * All live price fetching is now routed through the `get-market-prices`
 * Supabase Edge Function. The Python worker on Render is the only process
 * that calls CoinGecko directly. The edge function acts as the server-side
 * proxy so no third-party API keys are ever exposed to the browser.
 *
 * Static symbol/ID mappings and utility functions are preserved here for
 * use by other modules (pair generation, display helpers, etc.).
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

// CryptoSymbol kept minimal for backward compatibility
export type CryptoSymbol =
  | "BTC" | "ETH" | "USDC" | "SOL" | "PEPE" | "WIF" | "UNI" | "AAVE" | "ARB" | "BONK";

export type ExtendedCryptoSymbol = CryptoSymbol
  | "BNB" | "XRP" | "ADA" | "DOGE" | "AVAX"
  | "DOT" | "LINK" | "MATIC" | "OP"
  | "XLM" | "ALGO" | "XMR" | "ZEC" | "DASH" | "LTC" | "RVN"
  | "ATOM" | "NEAR" | "FTM" | "SUI" | "APT" | "SEI" | "INJ"
  | "TRX" | "SHIB" | "FLOKI"
  | "RNDR" | "FET" | "OCEAN" | "AGIX" | "GRT" | "FIL" | "AR"
  | "HNT" | "AKT" | "MKR" | "COMP" | "LDO" | "RPL" | "CRV" | "CVX"
  | "USDT" | "DAI" | "FRAX" | "STRK" | "BASE";

export type CryptoQuote = {
  priceUsd: number;
  change24hPercent: number | null;
  marketCap?: number;
  volume24h?: number;
};

// ─── Symbol / ID mappings (static — no network calls) ────────────────────────

const COINGECKO_ID_BY_SYMBOL: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  MATIC: "matic-network",
  TRX: "tron",
  LTC: "litecoin",
  ATOM: "cosmos",
  NEAR: "near",
  FTM: "fantom",
  SUI: "sui",
  APT: "aptos",
  SEI: "sei-network",
  INJ: "injective-protocol",
  ARB: "arbitrum",
  OP: "optimism",
  STRK: "starknet",
  BASE: "base-protocol",
  XLM: "stellar",
  ALGO: "algorand",
  RVN: "ravencoin",
  XMR: "monero",
  ZEC: "zcash",
  DASH: "dash",
  UNI: "uniswap",
  AAVE: "aave",
  MKR: "maker",
  COMP: "compound-governance-token",
  LDO: "lido-dao",
  RPL: "rocket-pool",
  CRV: "curve-dao-token",
  CVX: "convex-finance",
  RNDR: "render-token",
  FET: "fetch-ai",
  OCEAN: "ocean-protocol",
  AGIX: "singularitynet",
  GRT: "the-graph",
  FIL: "filecoin",
  AR: "arweave",
  HNT: "helium",
  AKT: "akash-network",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
  SHIB: "shiba-inu",
  FLOKI: "floki",
  USDC: "usd-coin",
  USDT: "tether",
  DAI: "dai",
  FRAX: "frax",
};

const SYMBOL_BY_COINGECKO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_ID_BY_SYMBOL).map(([k, v]) => [v, k])
);

export function getCoingeckoId(symbol: string): string | undefined {
  return COINGECKO_ID_BY_SYMBOL[symbol.toUpperCase()];
}

export function getSymbolFromCoingeckoId(id: string): string | undefined {
  return SYMBOL_BY_COINGECKO_ID[id];
}

export function getSupportedSymbols(): string[] {
  return Object.keys(COINGECKO_ID_BY_SYMBOL);
}

// ─── Price fetching — proxied via Supabase Edge Function ─────────────────────
//
// The edge function `get-market-prices` is responsible for calling CoinGecko
// (or reading a cached price table) server-side. No direct CoinGecko calls
// are made from the browser.

export async function fetchCoinGeckoUsdQuotes(
  symbols: string[],
  // AbortSignal kept for API compatibility but unused at edge function level
  _signal?: AbortSignal
): Promise<Partial<Record<string, CryptoQuote>>> {
  if (symbols.length === 0) return {};

  const { data, error } = await supabase.functions.invoke('get-market-prices', {
    body: { symbols: symbols.map(s => s.toUpperCase()) },
  });

  if (error || !data) {
    console.warn('[coingecko] Edge function unavailable:', error?.message ?? 'no data');
    return {};
  }

  return data as Partial<Record<string, CryptoQuote>>;
}

export async function fetchAllPrices(
  _signal?: AbortSignal
): Promise<Partial<Record<string, CryptoQuote>>> {
  return fetchCoinGeckoUsdQuotes(getSupportedSymbols());
}

// ─── Exchange pair utilities (pure — no network calls) ───────────────────────

export interface TradingPair {
  base: string;
  quote: string;
  symbol: string;
  exchange: string;
}

export function generateTradingPairs(
  baseSymbols: string[],
  quoteSymbols = ['USDT', 'USD', 'BTC', 'ETH']
): TradingPair[] {
  const pairs: TradingPair[] = [];
  for (const base of baseSymbols) {
    for (const quote of quoteSymbols) {
      if (base !== quote) {
        pairs.push({ base, quote, symbol: `${base}/${quote}`, exchange: 'internal' });
      }
    }
  }
  return pairs;
}
