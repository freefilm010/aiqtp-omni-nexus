// CryptoSymbol kept minimal for backward compatibility
// Full symbol list available via getSupportedSymbols()
export type CryptoSymbol =
  | "BTC" | "ETH" | "USDC" | "SOL" | "PEPE" | "WIF" | "UNI" | "AAVE" | "ARB" | "BONK";

// Extended symbol type for full coverage
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

// Complete CoinGecko ID mapping
const COINGECKO_ID_BY_SYMBOL: Record<string, string> = {
  // Major L1s
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
  
  // L2s
  ARB: "arbitrum",
  OP: "optimism",
  STRK: "starknet",
  BASE: "base-protocol",
  
  // Alt L1s
  XLM: "stellar",
  ALGO: "algorand",
  RVN: "ravencoin",
  
  // Privacy coins
  XMR: "monero",
  ZEC: "zcash",
  DASH: "dash",
  
  // DeFi
  UNI: "uniswap",
  AAVE: "aave",
  MKR: "maker",
  COMP: "compound-governance-token",
  LDO: "lido-dao",
  RPL: "rocket-pool",
  CRV: "curve-dao-token",
  CVX: "convex-finance",
  
  // AI & Data
  RNDR: "render-token",
  FET: "fetch-ai",
  OCEAN: "ocean-protocol",
  AGIX: "singularitynet",
  GRT: "the-graph",
  FIL: "filecoin",
  AR: "arweave",
  HNT: "helium",
  AKT: "akash-network",
  
  // Meme coins
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
  SHIB: "shiba-inu",
  FLOKI: "floki",
  
  // Stablecoins
  USDC: "usd-coin",
  USDT: "tether",
  DAI: "dai",
  FRAX: "frax",
};

// Reverse mapping for lookup
const SYMBOL_BY_COINGECKO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COINGECKO_ID_BY_SYMBOL).map(([k, v]) => [v, k])
);

export function getCoingeckoId(symbol: string): string | undefined {
  return COINGECKO_ID_BY_SYMBOL[symbol.toUpperCase()];
}

export function getSymbolFromCoingeckoId(id: string): string | undefined {
  return SYMBOL_BY_COINGECKO_ID[id];
}

export async function fetchCoinGeckoUsdQuotes(
  symbols: string[],
  signal?: AbortSignal
): Promise<Partial<Record<string, CryptoQuote>>> {
  const ids = Array.from(
    new Set(symbols.map((s) => COINGECKO_ID_BY_SYMBOL[s.toUpperCase()]).filter(Boolean))
  );

  if (ids.length === 0) return {};

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_market_cap", "true");
  url.searchParams.set("include_24hr_vol", "true");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Price feed error (${res.status})`);
  }

  const json = (await res.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number; usd_market_cap?: number; usd_24h_vol?: number }
  >;

  const out: Partial<Record<string, CryptoQuote>> = {};

  for (const symbol of symbols) {
    const id = COINGECKO_ID_BY_SYMBOL[symbol.toUpperCase()];
    const row = json?.[id];

    if (!row || typeof row.usd !== "number") continue;

    out[symbol.toUpperCase()] = {
      priceUsd: row.usd,
      change24hPercent: typeof row.usd_24h_change === "number" ? row.usd_24h_change : null,
      marketCap: row.usd_market_cap,
      volume24h: row.usd_24h_vol,
    };
  }

  return out;
}

// Batch fetch for many symbols
export async function fetchAllPrices(
  signal?: AbortSignal
): Promise<Partial<Record<string, CryptoQuote>>> {
  const allSymbols = Object.keys(COINGECKO_ID_BY_SYMBOL);
  
  // Split into batches of 50 to avoid API limits
  const batches: string[][] = [];
  for (let i = 0; i < allSymbols.length; i += 50) {
    batches.push(allSymbols.slice(i, i + 50));
  }

  const results: Partial<Record<string, CryptoQuote>> = {};
  
  for (const batch of batches) {
    try {
      const batchResults = await fetchCoinGeckoUsdQuotes(batch, signal);
      Object.assign(results, batchResults);
      // Rate limit delay
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error('Batch fetch failed:', e);
    }
  }

  return results;
}

// Get supported symbols
export function getSupportedSymbols(): string[] {
  return Object.keys(COINGECKO_ID_BY_SYMBOL);
}

// Exchange pair utilities
export interface TradingPair {
  base: string;
  quote: string;
  symbol: string;
  exchange: string;
}

export function generateTradingPairs(baseSymbols: string[], quoteSymbols = ['USDT', 'USD', 'BTC', 'ETH']): TradingPair[] {
  const pairs: TradingPair[] = [];
  
  for (const base of baseSymbols) {
    for (const quote of quoteSymbols) {
      if (base !== quote) {
        pairs.push({
          base,
          quote,
          symbol: `${base}/${quote}`,
          exchange: 'internal'
        });
      }
    }
  }
  
  return pairs;
}