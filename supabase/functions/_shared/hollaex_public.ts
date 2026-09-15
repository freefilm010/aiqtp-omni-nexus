// Public market data from the platform's own venue (HollaEx).
// No third-party exchange feeds. No API key required for these endpoints.

export const HOLLAEX_BASE = (Deno.env.get("HOLLAEX_BASE_URL") ?? "https://api.hollaex.com").replace(/\/+$/, "");

/** Accepts "BTC/USDT", "BTCUSDT" or "btc-usdt" and returns the venue pair "btc-usdt". */
export function toVenuePair(symbol: string): string {
  const s = symbol.trim().toLowerCase();
  if (s.includes("-")) return s;
  if (s.includes("/")) return s.replace("/", "-");
  const quotes = ["usdt", "usdc", "usd", "eur", "btc", "eth"];
  for (const q of quotes) {
    if (s.endsWith(q) && s.length > q.length) return `${s.slice(0, -q.length)}-${q}`;
  }
  return s;
}

/** "btc-usdt" -> "BTC/USDT" */
export function fromVenuePair(pair: string): string {
  return pair.toUpperCase().replace("-", "/");
}

async function get(path: string, timeoutMs = 10000): Promise<any> {
  const res = await fetch(`${HOLLAEX_BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof body?.message === "string" ? body.message : `HTTP ${res.status}`;
    throw new Error(`Venue market data error [${res.status}]: ${msg}`);
  }
  return body;
}

export interface VenueTicker {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  quoteVolume: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

function normalizeTicker(symbol: string, t: any): VenueTicker {
  const last = Number(t?.last ?? t?.close ?? 0);
  const open = Number(t?.open ?? 0);
  const change = open > 0 ? last - open : 0;
  return {
    symbol,
    last,
    bid: Number(t?.bid ?? 0),
    ask: Number(t?.ask ?? 0),
    high: Number(t?.high ?? 0),
    low: Number(t?.low ?? 0),
    open,
    volume: Number(t?.volume ?? 0),
    quoteVolume: Number(t?.volume ?? 0) * (last || 0),
    change,
    changePercent: open > 0 ? (change / open) * 100 : 0,
    timestamp: t?.time ? new Date(t.time).getTime() : Date.now(),
  };
}

export async function fetchTicker(symbol: string): Promise<VenueTicker> {
  const pair = toVenuePair(symbol);
  const data = await get(`/v2/ticker?symbol=${encodeURIComponent(pair)}`);
  const ticker = normalizeTicker(fromVenuePair(pair), data);
  if (!Number.isFinite(ticker.last) || ticker.last <= 0) {
    throw new Error(`Venue ticker unavailable for ${fromVenuePair(pair)}`);
  }
  return ticker;
}

export async function fetchAllTickers(): Promise<VenueTicker[]> {
  const data = await get(`/v2/tickers`);
  if (!data || typeof data !== "object") throw new Error("Venue tickers unavailable");
  return Object.entries(data)
    .map(([pair, t]) => normalizeTicker(fromVenuePair(pair), t))
    .filter((t) => Number.isFinite(t.last) && t.last > 0);
}

const RESOLUTION_MINUTES: Record<string, number> = {
  "1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440, "1w": 10080,
};

export interface VenueCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchOhlcv(symbol: string, timeframe = "1h", limit = 200): Promise<VenueCandle[]> {
  const pair = toVenuePair(symbol);
  const minutes = RESOLUTION_MINUTES[timeframe] ?? 60;
  const to = Math.floor(Date.now() / 1000);
  const from = to - minutes * 60 * Math.max(1, limit);
  const data = await get(
    `/v2/chart?symbol=${encodeURIComponent(pair)}&resolution=${minutes}` +
      `&from=${new Date(from * 1000).toISOString()}&to=${new Date(to * 1000).toISOString()}`,
  );
  if (!Array.isArray(data)) throw new Error("Venue chart data unavailable");
  return data
    .map((c: any) => ({
      timestamp: new Date(c.time).getTime(),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume ?? 0),
    }))
    .filter((c) => Number.isFinite(c.close) && c.close > 0)
    .slice(-limit);
}

export async function fetchOrderBook(symbol: string, limit = 20) {
  const pair = toVenuePair(symbol);
  const data = await get(`/v2/orderbooks?symbol=${encodeURIComponent(pair)}`);
  const book = data?.[pair] ?? data;
  const map = (rows: any[]) =>
    (Array.isArray(rows) ? rows : []).slice(0, limit).map((r: any[]) => ({
      price: Number(r[0]),
      amount: Number(r[1]),
    }));
  return {
    symbol: fromVenuePair(pair),
    bids: map(book?.bids),
    asks: map(book?.asks),
    source: "hollaex",
    timestamp: book?.timestamp ? new Date(book.timestamp).getTime() : Date.now(),
  };
}

export async function fetchMarkets() {
  const data = await get(`/v2/constants`);
  const pairs = data?.pairs ?? {};
  return Object.entries(pairs).map(([pair, p]: [string, any]) => ({
    id: pair,
    symbol: fromVenuePair(pair),
    base: String(p?.pair_base ?? "").toUpperCase(),
    quote: String(p?.pair_2 ?? "").toUpperCase(),
    active: p?.active !== false,
    minAmount: Number(p?.min_size ?? 0),
    maxAmount: Number(p?.max_size ?? 0),
    increment: Number(p?.increment_size ?? 0),
  }));
}
