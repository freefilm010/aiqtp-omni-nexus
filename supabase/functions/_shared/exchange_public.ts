// Public market data across the platform's venues.
// HollaEx is the primary platform venue; Binance, Kraken and Coinbase were
// re-enabled by owner decision (2026-09-27) as secondary venues for market
// data and per-user connected-account execution. Alpaca remains banned.
// No API keys required — these are all public endpoints.

export type VenueId = "hollaex" | "binance" | "kraken" | "coinbase";

export const VENUE_IDS: VenueId[] = ["hollaex", "binance", "kraken", "coinbase"];

export const VENUE_LABELS: Record<VenueId, string> = {
  hollaex: "Platform Venue",
  binance: "Binance",
  kraken: "Kraken",
  coinbase: "Coinbase",
};

export function isVenueId(v: unknown): v is VenueId {
  return typeof v === "string" && (VENUE_IDS as string[]).includes(v);
}

/** Normalize "BTC/USDT" | "BTCUSDT" | "btc-usdt" -> canonical "BTC/USDT". */
export function toCanonicalPair(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (s.includes("/")) return s;
  if (s.includes("-")) return s.replace("-", "/");
  const quotes = ["USDT", "USDC", "USD", "EUR", "BTC", "ETH"];
  for (const q of quotes) {
    if (s.endsWith(q) && s.length > q.length) return `${s.slice(0, -q.length)}/${q}`;
  }
  return s;
}

async function getJson(url: string, timeoutMs = 10000): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "AIQTP/1.0" },
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
  venue: VenueId;
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface VenueCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface VenueOrderBook {
  venue: VenueId;
  symbol: string;
  bids: { price: number; amount: number }[];
  asks: { price: number; amount: number }[];
  timestamp: number;
}

function makeTicker(venue: VenueId, symbol: string, t: Partial<VenueTicker>): VenueTicker {
  const last = Number(t.last ?? 0);
  const open = Number(t.open ?? 0);
  const change = open > 0 ? last - open : Number(t.change ?? 0);
  return {
    venue,
    symbol,
    last,
    bid: Number(t.bid ?? 0),
    ask: Number(t.ask ?? 0),
    high: Number(t.high ?? 0),
    low: Number(t.low ?? 0),
    open,
    volume: Number(t.volume ?? 0),
    change,
    changePercent: open > 0 ? (change / open) * 100 : Number(t.changePercent ?? 0),
    timestamp: t.timestamp ?? Date.now(),
  };
}

// ── Binance (public, key-free) ───────────────────────────────────────────────

const BINANCE_BASE = "https://api.binance.com";

function binanceSymbol(pair: string): string {
  return pair.replace("/", "");
}

async function binanceTicker(symbol: string): Promise<VenueTicker> {
  const pair = toCanonicalPair(symbol);
  const t = await getJson(`${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${binanceSymbol(pair)}`);
  return makeTicker("binance", pair, {
    last: t.lastPrice,
    bid: t.bidPrice,
    ask: t.askPrice,
    high: t.highPrice,
    low: t.lowPrice,
    open: t.openPrice,
    volume: t.volume,
    changePercent: t.priceChangePercent,
    timestamp: t.closeTime ?? Date.now(),
  });
}

async function binanceOhlcv(symbol: string, timeframe = "1h", limit = 200): Promise<VenueCandle[]> {
  const interval: Record<string, string> = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w",
  };
  const rows: any[] = await getJson(
    `${BINANCE_BASE}/api/v3/klines?symbol=${binanceSymbol(symbol)}&interval=${interval[timeframe] ?? "1h"}&limit=${Math.min(1000, Math.max(1, limit))}`,
  );
  return rows.map((r) => ({
    timestamp: Number(r[0]),
    open: Number(r[1]),
    high: Number(r[2]),
    low: Number(r[3]),
    close: Number(r[4]),
    volume: Number(r[5]),
  }));
}

async function binanceOrderBook(symbol: string, limit = 20): Promise<VenueOrderBook> {
  const d = await getJson(`${BINANCE_BASE}/api/v3/depth?symbol=${binanceSymbol(symbol)}&limit=${Math.min(5000, limit)}`);
  const map = (rows: any[]) => (Array.isArray(rows) ? rows : []).slice(0, limit).map((r: any[]) => ({ price: Number(r[0]), amount: Number(r[1]) }));
  return { venue: "binance", symbol: toCanonicalPair(symbol), bids: map(d.bids), asks: map(d.asks), timestamp: Date.now() };
}

// ── Kraken (public, key-free) ────────────────────────────────────────────────

const KRAKEN_BASE = "https://api.kraken.com/0/public";

/** Kraken uses XBT for BTC and legacy pair naming; "BTC/USDT" -> "XBTUSDT". */
function krakenPair(pair: string): string {
  return pair.replace("/", "").replace("BTC", "XBT");
}

async function krakenTicker(symbol: string): Promise<VenueTicker> {
  const pair = krakenPair(toCanonicalPair(symbol));
  const j = await getJson(`${KRAKEN_BASE}/Ticker?pair=${pair}`);
  if (j.error?.length) throw new Error(`Kraken: ${j.error.join("; ")}`);
  const key = Object.keys(j.result ?? {})[0];
  const t = j.result?.[key];
  if (!t) throw new Error("Kraken ticker unavailable");
  const last = Number(t.c?.[0] ?? 0);
  const open = Number(t.o ?? 0);
  return makeTicker("kraken", toCanonicalPair(symbol), {
    last,
    bid: Number(t.b?.[0] ?? 0),
    ask: Number(t.a?.[0] ?? 0),
    high: Number(t.h?.[1] ?? 0),
    low: Number(t.l?.[1] ?? 0),
    open,
    volume: Number(t.v?.[1] ?? 0),
    change: open > 0 ? last - open : 0,
    changePercent: open > 0 ? ((last - open) / open) * 100 : 0,
    timestamp: Date.now(),
  });
}

async function krakenOhlcv(symbol: string, timeframe = "1h", limit = 200): Promise<VenueCandle[]> {
  const interval: Record<string, number> = {
    "1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440, "1w": 10080,
  };
  const minutes = interval[timeframe] ?? 60;
  const pair = krakenPair(toCanonicalPair(symbol));
  const j = await getJson(`${KRAKEN_BASE}/OHLC?pair=${pair}&interval=${minutes}`);
  if (j.error?.length) throw new Error(`Kraken: ${j.error.join("; ")}`);
  const key = Object.keys(j.result ?? {}).find((k) => k !== "last");
  const rows: any[][] = j.result?.[key] ?? [];
  return rows
    .slice(-Math.min(720, limit))
    .map((r) => ({
      timestamp: Number(r[0]) * 1000,
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[6]),
    }));
}

async function krakenOrderBook(symbol: string, limit = 20): Promise<VenueOrderBook> {
  const pair = krakenPair(toCanonicalPair(symbol));
  const j = await getJson(`${KRAKEN_BASE}/Depth?pair=${pair}&count=${Math.min(500, limit)}`);
  if (j.error?.length) throw new Error(`Kraken: ${j.error.join("; ")}`);
  const book = j.result?.[Object.keys(j.result ?? {})[0]];
  if (!book) throw new Error("Kraken order book unavailable");
  const map = (rows: any[]) => (Array.isArray(rows) ? rows : []).slice(0, limit).map((r: any[]) => ({ price: Number(r[0]), amount: Number(r[1]) }));
  return { venue: "kraken", symbol: toCanonicalPair(symbol), bids: map(book.bids), asks: map(book.asks), timestamp: Date.now() };
}

// ── Coinbase Exchange (public, key-free) ─────────────────────────────────────

const COINBASE_BASE = "https://api.exchange.coinbase.com";

function coinbasePair(pair: string): string {
  return pair.replace("/", "-");
}

async function coinbaseTicker(symbol: string): Promise<VenueTicker> {
  const cbPair = coinbasePair(toCanonicalPair(symbol));
  const [t, stats] = await Promise.all([
    getJson(`${COINBASE_BASE}/products/${cbPair}/ticker`),
    getJson(`${COINBASE_BASE}/products/${cbPair}/stats`).catch(() => null),
  ]);
  const last = Number(t.price ?? 0);
  const open = Number(stats?.open ?? 0);
  return makeTicker("coinbase", toCanonicalPair(symbol), {
    last,
    bid: Number(t.bid ?? 0),
    ask: Number(t.ask ?? 0),
    high: Number(stats?.high ?? 0),
    low: Number(stats?.low ?? 0),
    open,
    volume: Number(stats?.volume ?? 0),
    change: open > 0 ? last - open : 0,
    changePercent: open > 0 ? ((last - open) / open) * 100 : 0,
    timestamp: t.time ? new Date(t.time).getTime() : Date.now(),
  });
}

async function coinbaseOhlcv(symbol: string, timeframe = "1h", limit = 200): Promise<VenueCandle[]> {
  const granularity: Record<string, number> = {
    "1m": 60, "5m": 300, "15m": 900, "30m": 1800, "1h": 3600, "4h": 21600, "1d": 86400,
  };
  const g = granularity[timeframe] ?? 3600;
  const cbPair = coinbasePair(toCanonicalPair(symbol));
  const now = Math.floor(Date.now() / 1000);
  const rows: number[][] = await getJson(
    `${COINBASE_BASE}/products/${cbPair}/candles?granularity=${g}&start=${now - g * Math.min(300, limit)}&end=${now}`,
  );
  return rows
    .map((r) => ({
      timestamp: Number(r[0]) * 1000,
      low: Number(r[1]),
      high: Number(r[2]),
      open: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-limit);
}

async function coinbaseOrderBook(symbol: string, limit = 20): Promise<VenueOrderBook> {
  const cbPair = coinbasePair(toCanonicalPair(symbol));
  const book = await getJson(`${COINBASE_BASE}/products/${cbPair}/book?level=2`);
  const map = (rows: any[]) => (Array.isArray(rows) ? rows : []).slice(0, limit).map((r: any[]) => ({ price: Number(r[0]), amount: Number(r[1]) }));
  return { venue: "coinbase", symbol: toCanonicalPair(symbol), bids: map(book.bids), asks: map(book.asks), timestamp: Date.now() };
}

// ── Unified router ───────────────────────────────────────────────────────────

export async function fetchVenueTicker(venue: VenueId, symbol: string): Promise<VenueTicker> {
  switch (venue) {
    case "hollaex": {
      const { fetchTicker } = await import("./hollaex_public.ts");
      const t = await fetchTicker(symbol);
      return { ...t, venue: "hollaex" as VenueId };
    }
    case "binance": return binanceTicker(symbol);
    case "kraken": return krakenTicker(symbol);
    case "coinbase": return coinbaseTicker(symbol);
  }
}

export async function fetchVenueOhlcv(venue: VenueId, symbol: string, timeframe = "1h", limit = 200): Promise<VenueCandle[]> {
  switch (venue) {
    case "hollaex": {
      const { fetchOhlcv } = await import("./hollaex_public.ts");
      return fetchOhlcv(symbol, timeframe, limit);
    }
    case "binance": return binanceOhlcv(symbol, timeframe, limit);
    case "kraken": return krakenOhlcv(symbol, timeframe, limit);
    case "coinbase": return coinbaseOhlcv(symbol, timeframe, limit);
  }
}

export async function fetchVenueOrderBook(venue: VenueId, symbol: string, limit = 20): Promise<VenueOrderBook> {
  switch (venue) {
    case "hollaex": {
      const { fetchOrderBook } = await import("./hollaex_public.ts");
      const b = await fetchOrderBook(symbol, limit);
      return { ...b, venue: "hollaex" as VenueId };
    }
    case "binance": return binanceOrderBook(symbol, limit);
    case "kraken": return krakenOrderBook(symbol, limit);
    case "coinbase": return coinbaseOrderBook(symbol, limit);
  }
}

/** Best-effort tickers from every venue; failed venues are omitted, never faked. */
export async function fetchAllVenueTickers(symbol: string): Promise<VenueTicker[]> {
  const results = await Promise.allSettled(VENUE_IDS.map((v) => fetchVenueTicker(v, symbol)));
  return results
    .filter((r): r is PromiseFulfilledResult<VenueTicker> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((t) => Number.isFinite(t.last) && t.last > 0);
}
