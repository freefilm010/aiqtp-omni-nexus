export type CryptoSymbol =
  | "BTC"
  | "ETH"
  | "USDC"
  | "SOL"
  | "PEPE"
  | "WIF"
  | "UNI"
  | "AAVE"
  | "ARB"
  | "BONK";

export type CryptoQuote = {
  priceUsd: number;
  change24hPercent: number | null;
};

const COINGECKO_ID_BY_SYMBOL: Record<CryptoSymbol, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDC: "usd-coin",
  SOL: "solana",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  BONK: "bonk",
};

export async function fetchCoinGeckoUsdQuotes(
  symbols: CryptoSymbol[],
  signal?: AbortSignal
): Promise<Partial<Record<CryptoSymbol, CryptoQuote>>> {
  const ids = Array.from(
    new Set(symbols.map((s) => COINGECKO_ID_BY_SYMBOL[s]).filter(Boolean))
  );

  if (ids.length === 0) return {};

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");

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
    { usd?: number; usd_24h_change?: number }
  >;

  const out: Partial<Record<CryptoSymbol, CryptoQuote>> = {};

  for (const symbol of symbols) {
    const id = COINGECKO_ID_BY_SYMBOL[symbol];
    const row = json?.[id];

    if (!row || typeof row.usd !== "number") continue;

    out[symbol] = {
      priceUsd: row.usd,
      change24hPercent:
        typeof row.usd_24h_change === "number" ? row.usd_24h_change : null,
    };
  }

  return out;
}
