// Evidence-based graduation: re-evaluates strategies against REAL exchange candles.
// No synthetic scoring. Every graduation is backed by stored backtest_results rows.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THRESHOLDS = { profitability: 77, consistency: 77, winRate: 60, maxDrawdown: 18 };
const UNIVERSE = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const TIMEFRAME = "1h";
const CANDLES = 1000;

type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

async function fetchCandles(symbol: string): Promise<Candle[]> {
  const urls = [
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${TIMEFRAME}&limit=${CANDLES}`,
    `https://api.binance.us/api/v3/klines?symbol=${symbol}&interval=${TIMEFRAME}&limit=${CANDLES}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const raw = await res.json();
      if (!Array.isArray(raw) || raw.length === 0) continue;
      return raw.map((k: any[]) => ({
        t: Number(k[0]),
        o: Number(k[1]),
        h: Number(k[2]),
        l: Number(k[3]),
        c: Number(k[4]),
        v: Number(k[5]),
      }));
    } catch (_e) {
      continue;
    }
  }
  throw new Error(`No live candles available for ${symbol}`);
}

function sma(values: number[], period: number, index: number): number | null {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i++) sum += values[i];
  return sum / period;
}

function rsiSeries(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  let gain = 0, loss = 0;
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const up = Math.max(diff, 0);
    const down = Math.max(-diff, 0);
    if (i <= period) {
      gain += up; loss += down;
      if (i === period) {
        gain /= period; loss /= period;
        out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
      }
    } else {
      gain = (gain * (period - 1) + up) / period;
      loss = (loss * (period - 1) + down) / period;
      out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    }
  }
  return out;
}

/** Rule-driven long-only backtest on real candles. */
function backtest(candles: Candle[], stopLossPct: number, takeProfitPct: number, riskPct: number) {
  const closes = candles.map((c) => c.c);
  const rsi = rsiSeries(closes);
  const initial = 10000;
  let equity = initial;
  let peak = initial;
  let maxDD = 0;
  let position: { entry: number; size: number; bars: number } | null = null;
  const trades: number[] = [];
  const monthly = new Map<string, number>();

  for (let i = 50; i < candles.length; i++) {
    const price = closes[i];
    const fast = sma(closes, 12, i);
    const slow = sma(closes, 48, i);
    const prevFast = sma(closes, 12, i - 1);
    const prevSlow = sma(closes, 48, i - 1);
    const r = rsi[i];
    if (fast === null || slow === null || prevFast === null || prevSlow === null || r === null) continue;

    if (position) {
      position.bars++;
      const change = (price - position.entry) / position.entry;
      const hitStop = change <= -stopLossPct / 100;
      const hitTarget = change >= takeProfitPct / 100;
      const trendExit = fast < slow;
      if (hitStop || hitTarget || trendExit) {
        const pnl = position.size * change - position.size * 0.001; // 10bps round-trip cost
        equity += pnl;
        trades.push(pnl);
        const key = new Date(candles[i].t).toISOString().slice(0, 7);
        monthly.set(key, (monthly.get(key) || 0) + pnl);
        position = null;
      }
    } else {
      const crossUp = prevFast <= prevSlow && fast > slow;
      if (crossUp && r < 70) {
        position = { entry: price, size: equity * (riskPct / 100) * 10, bars: 0 };
      }
    }

    peak = Math.max(peak, equity);
    maxDD = Math.max(maxDD, ((peak - equity) / peak) * 100);
  }

  const wins = trades.filter((t) => t > 0);
  const losses = trades.filter((t) => t <= 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const monthlyValues = [...monthly.values()];
  const positiveMonths = monthlyValues.filter((v) => v > 0).length;
  const consistency = monthlyValues.length ? (positiveMonths / monthlyValues.length) * 100 : 0;
  const returns = trades.map((t) => t / initial);
  const mean = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length
    ? returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length
    : 0;
  const sharpe = variance > 0 ? (mean / Math.sqrt(variance)) * Math.sqrt(252) : 0;

  return {
    totalReturn: ((equity - initial) / initial) * 100,
    finalCapital: equity,
    maxDrawdown: maxDD,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 10 : 0,
    sharpe,
    consistency,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body?.limit) || 25, 100);

    const { data: strategies, error } = await userClient
      .from("ai_strategies")
      .select("id,user_id,name,exit_rules,risk_parameters,is_graduated,backtest_count")
      .eq("user_id", user.id)
      .eq("is_graduated", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    if (!strategies?.length) {
      return new Response(
        JSON.stringify({ success: true, evaluated: 0, graduated: 0, results: [], message: "No pending strategies" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const candleCache = new Map<string, Candle[]>();
    for (const sym of UNIVERSE) {
      try {
        candleCache.set(sym, await fetchCandles(sym));
      } catch (e) {
        console.warn(`candles unavailable: ${sym}`, (e as Error).message);
      }
    }
    if (candleCache.size === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Live market data unavailable — graduation halted (no synthetic fallback)" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: any[] = [];
    let graduatedCount = 0;

    for (const s of strategies) {
      const stopLoss = Number((s.exit_rules as any)?.stop_loss) || 2;
      const takeProfit = Number((s.exit_rules as any)?.take_profit) || 5;
      const riskPct = Number((s.risk_parameters as any)?.max_position_size) || 5;

      const perSymbol: any[] = [];
      for (const [sym, candles] of candleCache) {
        const r = backtest(candles, stopLoss, takeProfit, riskPct);
        perSymbol.push({ symbol: sym, ...r });

        await userClient.from("backtest_results").insert({
          user_id: s.user_id,
          strategy_id: s.id,
          symbol: `${sym.replace("USDT", "")}/USDT`,
          timeframe: TIMEFRAME,
          start_date: new Date(candles[0].t).toISOString(),
          end_date: new Date(candles[candles.length - 1].t).toISOString(),
          initial_capital: 10000,
          final_capital: r.finalCapital,
          total_return: r.totalReturn,
          max_drawdown: r.maxDrawdown,
          sharpe_ratio: r.sharpe,
          win_rate: r.winRate,
          total_trades: r.totalTrades,
          winning_trades: r.winningTrades,
          losing_trades: r.losingTrades,
          profit_factor: r.profitFactor,
          results_data: { source: "binance_klines", timeframe: TIMEFRAME, candles: candles.length },
        });
      }

      const avg = (k: string) => perSymbol.reduce((a, b) => a + (b[k] || 0), 0) / perSymbol.length;
      const profitability = avg("totalReturn");
      const consistency = avg("consistency");
      const winRate = avg("winRate");
      const maxDrawdown = avg("maxDrawdown");
      const totalTrades = perSymbol.reduce((a, b) => a + b.totalTrades, 0);

      const graduated =
        totalTrades >= 20 &&
        profitability >= THRESHOLDS.profitability &&
        consistency >= THRESHOLDS.consistency &&
        winRate >= THRESHOLDS.winRate &&
        maxDrawdown <= THRESHOLDS.maxDrawdown;

      await userClient
        .from("ai_strategies")
        .update({
          profitability_score: Math.round(profitability * 100) / 100,
          consistency_score: Math.round(consistency * 100) / 100,
          backtest_count: (s.backtest_count || 0) + perSymbol.length,
          is_graduated: graduated,
          status: graduated ? "live" : "backtesting",
          ...(graduated ? { graduation_date: new Date().toISOString() } : {}),
        })
        .eq("id", s.id);

      if (graduated) graduatedCount++;
      results.push({
        id: s.id,
        name: s.name,
        profitability: Math.round(profitability * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        totalTrades,
        graduated,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        evaluated: results.length,
        graduated: graduatedCount,
        thresholds: THRESHOLDS,
        dataSource: `binance ${TIMEFRAME} candles`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("strategy-graduation error", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
