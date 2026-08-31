// qlib-factors — Qlib-style alpha factor research on REAL OHLCV data.
//
// Pulls daily klines from Binance public market data (no key required) and
// computes a subset of the Alpha158 factor family, then ranks factors by
// their information coefficient (Spearman rank correlation between the
// factor value at t and the forward return at t+h) across the symbol universe.
//
// Every number returned is computed from live exchange candles. If the feed
// is unreachable the function returns ok:false rather than inventing data.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };

async function klines(symbol: string, interval: string, limit: number): Promise<Bar[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`binance ${symbol} ${res.status}`);
  const rows = (await res.json()) as unknown[][];
  return rows.map((r) => ({
    t: Number(r[0]),
    o: Number(r[1]),
    h: Number(r[2]),
    l: Number(r[3]),
    c: Number(r[4]),
    v: Number(r[5]),
  }));
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const std = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

function rank(a: number[]): number[] {
  const idx = a.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0]);
  const out = new Array(a.length).fill(0);
  idx.forEach(([, i], r) => (out[i] = r + 1));
  return out;
}

function spearman(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const rx = rank(x.slice(0, n));
  const ry = rank(y.slice(0, n));
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

/** Alpha158-style factor set evaluated at index i of a bar series. */
function factorsAt(bars: Bar[], i: number): Record<string, number> | null {
  if (i < 60) return null;
  const c = bars[i].c;
  const closes = bars.slice(0, i + 1).map((b) => b.c);
  const rets: number[] = [];
  for (let k = i - 29; k <= i; k++) rets.push(bars[k].c / bars[k - 1].c - 1);

  const ma = (n: number) => mean(closes.slice(-n));
  const win = (n: number) => bars.slice(i - n + 1, i + 1);
  const maxH = (n: number) => Math.max(...win(n).map((b) => b.h));
  const minL = (n: number) => Math.min(...win(n).map((b) => b.l));
  const vol = (n: number) => mean(win(n).map((b) => b.v));

  const gains = rets.filter((r) => r > 0);
  const losses = rets.filter((r) => r < 0).map(Math.abs);
  const rs = mean(losses) ? mean(gains) / mean(losses) : 0;

  return {
    ROC5: c / bars[i - 5].c - 1,
    ROC20: c / bars[i - 20].c - 1,
    ROC60: c / bars[i - 60].c - 1,
    MA5_BIAS: c / ma(5) - 1,
    MA20_BIAS: c / ma(20) - 1,
    MA60_BIAS: c / ma(60) - 1,
    STD20: std(rets.slice(-20)),
    RSV20: (c - minL(20)) / (maxH(20) - minL(20) || 1),
    MAXRET20: Math.max(...rets.slice(-20)),
    MINRET20: Math.min(...rets.slice(-20)),
    RSI14: 100 - 100 / (1 + (rs || 0)),
    VSTD20: vol(20) ? std(win(20).map((b) => b.v)) / vol(20) : 0,
    VOL_RATIO: vol(60) ? vol(5) / vol(60) : 0,
    CORR_PV: spearman(win(20).map((b) => b.c), win(20).map((b) => b.v)),
    KMID: (bars[i].c - bars[i].o) / (bars[i].o || 1),
    KLEN: (bars[i].h - bars[i].l) / (bars[i].o || 1),
  };
}

const DEFAULT_UNIVERSE = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
  "ADAUSDT", "AVAXUSDT", "LINKUSDT", "DOGEUSDT", "LTCUSDT",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const universe: string[] = Array.isArray(body.universe) && body.universe.length
      ? body.universe.slice(0, 15).map((s: string) => String(s).toUpperCase())
      : DEFAULT_UNIVERSE;
    const interval = String(body.interval ?? "1d");
    const horizon = Math.max(1, Math.min(20, Number(body.horizon ?? 5)));
    const lookback = Math.max(120, Math.min(500, Number(body.lookback ?? 365)));

    const series = await Promise.all(
      universe.map(async (s) => {
        try {
          return { symbol: s, bars: await klines(s, interval, lookback) };
        } catch {
          return { symbol: s, bars: [] as Bar[] };
        }
      }),
    );
    const usable = series.filter((s) => s.bars.length > 80);
    if (!usable.length) return json({ ok: false, reason: "market data feed unreachable" });

    // Build a pooled panel: factor values paired with forward returns.
    const panel: Record<string, { f: number[]; y: number[] }> = {};
    const latest: { symbol: string; factors: Record<string, number>; price: number }[] = [];

    for (const { symbol, bars } of usable) {
      const last = bars.length - 1;
      for (let i = 60; i <= last - horizon; i++) {
        const f = factorsAt(bars, i);
        if (!f) continue;
        const fwd = bars[i + horizon].c / bars[i].c - 1;
        if (!Number.isFinite(fwd)) continue;
        for (const [k, v] of Object.entries(f)) {
          if (!Number.isFinite(v)) continue;
          (panel[k] ??= { f: [], y: [] }).f.push(v);
          panel[k].y.push(fwd);
        }
      }
      const lf = factorsAt(bars, last);
      if (lf) latest.push({ symbol, factors: lf, price: bars[last].c });
    }

    const factors = Object.entries(panel)
      .map(([name, d]) => {
        const ic = spearman(d.f, d.y);
        return {
          name,
          ic: Number(ic.toFixed(4)),
          abs_ic: Math.abs(ic),
          samples: d.f.length,
          // Rank-IR proxy: IC scaled by sqrt(n) => t-stat of the correlation.
          t_stat: Number((ic * Math.sqrt(Math.max(0, d.f.length - 2)) / Math.sqrt(Math.max(1e-9, 1 - ic * ic))).toFixed(2)),
        };
      })
      .sort((a, b) => b.abs_ic - a.abs_ic);

    // Composite score per symbol: IC-weighted z-score of top factors.
    const top = factors.slice(0, 6);
    const zStats: Record<string, { m: number; s: number }> = {};
    for (const f of top) {
      const vals = latest.map((l) => l.factors[f.name]).filter(Number.isFinite);
      zStats[f.name] = { m: mean(vals), s: std(vals) || 1 };
    }
    const signals = latest
      .map((l) => {
        let score = 0;
        for (const f of top) {
          const z = (l.factors[f.name] - zStats[f.name].m) / zStats[f.name].s;
          score += z * f.ic;
        }
        return { symbol: l.symbol, price: l.price, score: Number(score.toFixed(4)) };
      })
      .sort((a, b) => b.score - a.score);

    return json({
      ok: true,
      as_of: new Date().toISOString(),
      universe: usable.map((u) => u.symbol),
      interval,
      horizon_bars: horizon,
      observations: Object.values(panel)[0]?.f.length ?? 0,
      factors,
      signals,
      source: "binance public klines (real OHLCV)",
    });
  } catch (e) {
    return json({ ok: false, reason: e instanceof Error ? e.message : String(e) });
  }
});
