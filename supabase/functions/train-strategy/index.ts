import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function deterministicFloat(seed: string, index: number): number {
  let hash = 2166136261;
  const input = `${seed}:${index}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

// --- Real market data (key-free public exchange candles) ---
interface Candle { o: number; h: number; l: number; c: number; }
let candleCache: { candles: Candle[]; fetchedAt: number; symbol: string } | null = null;

async function getCandles(): Promise<{ candles: Candle[]; symbol: string }> {
  if (candleCache && Date.now() - candleCache.fetchedAt < 10 * 60 * 1000) {
    return { candles: candleCache.candles, symbol: candleCache.symbol };
  }
  for (const symbol of ['BTCUSDT', 'ETHUSDT']) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=1000`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) continue;
      const raw = await res.json();
      const candles: Candle[] = raw.map((k: any[]) => ({
        o: parseFloat(k[1]), h: parseFloat(k[2]), l: parseFloat(k[3]), c: parseFloat(k[4]),
      })).filter((k: Candle) => Number.isFinite(k.c) && k.c > 0);
      if (candles.length >= 200) {
        candleCache = { candles, fetchedAt: Date.now(), symbol };
        return { candles, symbol };
      }
    } catch { /* try next symbol */ }
  }
  throw new Error('Market data unavailable');
}

// Training engine: replays real candle windows with the strategy's own
// stop-loss / take-profit parameters. No synthetic performance model.
function runTrainingCycle(
  entryRules: any,
  exitRules: any,
  riskParams: any,
  cycleIndex: number,
  totalCycles: number,
  candles: Candle[]
): {
  profitability: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consistency: number;
  trades: number;
  finalCapital: number;
} {
  const seed = JSON.stringify({ entryRules, exitRules, riskParams, cycleIndex });
  const stopLossPct = Math.max(0.2, parseFloat(exitRules?.stop_loss) || 2) / 100;
  const takeProfitPct = Math.max(0.2, parseFloat(exitRules?.take_profit) || 5) / 100;
  const maxPosSize = Math.max(1, parseFloat(riskParams?.max_position_size) || 5) / 100;

  // Deterministic per-cycle window over real history
  const windowLen = 168; // one week of hourly candles per validation cycle
  const maxStart = Math.max(1, candles.length - windowLen - 1);
  const start = Math.floor(deterministicFloat(seed, 0) * maxStart);
  const window = candles.slice(start, start + windowLen);

  const initialCapital = 10000;
  let capital = initialCapital;
  let peak = capital;
  let maxDrawdown = 0;
  let wins = 0, losses = 0;
  const tradeReturns: number[] = [];

  let i = 0;
  while (i < window.length - 1) {
    const entry = window[i].c;
    const positionCapital = capital * maxPosSize;
    let exitPrice = window[window.length - 1].c;
    let exitIdx = window.length - 1;
    for (let j = i + 1; j < window.length; j++) {
      if (window[j].l <= entry * (1 - stopLossPct)) { exitPrice = entry * (1 - stopLossPct); exitIdx = j; break; }
      if (window[j].h >= entry * (1 + takeProfitPct)) { exitPrice = entry * (1 + takeProfitPct); exitIdx = j; break; }
    }
    const ret = (exitPrice - entry) / entry;
    const pnl = positionCapital * ret;
    capital += pnl;
    tradeReturns.push(ret);
    if (ret > 0) wins++; else losses++;
    peak = Math.max(peak, capital);
    maxDrawdown = Math.max(maxDrawdown, ((peak - capital) / peak) * 100);
    i = exitIdx + 1;
  }

  const trades = tradeReturns.length;
  const winRate = trades > 0 ? (wins / trades) * 100 : 0;
  const profitability = ((capital - initialCapital) / initialCapital) * 100;

  // Sharpe from per-trade returns (annualized on hourly cadence)
  let sharpeRatio = 0;
  if (tradeReturns.length > 1) {
    const mean = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
    const variance = tradeReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / (tradeReturns.length - 1);
    const std = Math.sqrt(variance);
    sharpeRatio = std > 0 ? (mean / std) * Math.sqrt(trades) : 0;
  }

  // Consistency: fraction of 24h segments in the window that were profitable
  let profitableSegments = 0, segments = 0;
  for (let s = 0; s + 24 <= window.length; s += 24) {
    segments++;
    if (window[s + 24].c > window[s].c) profitableSegments++;
  }
  const marketConsistency = segments > 0 ? (profitableSegments / segments) * 100 : 50;
  const consistency = Math.max(0, Math.min(100,
    50 + (winRate - 50) * 0.6 + (marketConsistency - 50) * 0.4
  ));

  return {
    profitability: Math.round(profitability * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    consistency: Math.round(consistency * 100) / 100,
    trades,
    finalCapital: Math.round(capital * 100) / 100,
  };
}

// --- Legacy synthetic cycle (kept for reference, no longer used) ---
function runSyntheticCycle(
  entryRules: any,
  exitRules: any,
  riskParams: any,
  cycleIndex: number,
  totalCycles: number
): {
  profitability: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consistency: number;
  trades: number;
  finalCapital: number;
} {
  const seed = JSON.stringify({ entryRules, exitRules, riskParams, cycleIndex, totalCycles });
  const jitter = (index: number, range: number) => (deterministicFloat(seed, index) * 2 - 1) * range;
  const conditions = entryRules?.conditions || [];
  const stopLoss = parseFloat(exitRules?.stop_loss) || 2;
  const takeProfit = parseFloat(exitRules?.take_profit) || 5;
  const maxPosSize = parseFloat(riskParams?.max_position_size) || 5;
  
  // Factor complexity into performance
  const complexityBonus = Math.min(conditions.length * 2, 10);
  const riskRewardRatio = takeProfit / Math.max(stopLoss, 0.5);
  const positionSizePenalty = maxPosSize > 10 ? (maxPosSize - 10) * 0.5 : 0;
  
  // Market regime validation model (trending, ranging, volatile)
  const regimePhase = (cycleIndex / totalCycles) * Math.PI * 6;
  const regimeModifier = Math.sin(regimePhase) * 0.15;
  
  // Base performance from strategy quality
  const baseWinRate = 50 + complexityBonus + (riskRewardRatio > 2 ? 5 : 0) - positionSizePenalty;
  const winRate = Math.max(30, Math.min(85, baseWinRate + regimeModifier * 20 + jitter(1, 5)));
  
  const avgWin = takeProfit * 0.8;
  const avgLoss = stopLoss * 1.1;
  const trades = Math.floor(80 + deterministicFloat(seed, 2) * 120);
  const wins = Math.floor(trades * (winRate / 100));
  const losses = trades - wins;
  
  const totalPnl = (wins * avgWin) - (losses * avgLoss);
  const profitability = (totalPnl / (10000 * 0.01)) * 100;
  
  // Sharpe approximation
  const dailyReturns = totalPnl / 252;
  const volatility = Math.abs(avgLoss) * Math.sqrt(trades / 252);
  const sharpeRatio = volatility > 0 ? (dailyReturns / volatility) * Math.sqrt(252) : 0;
  
  // Max drawdown from position sizing and volatility
  const maxDrawdown = Math.min(50, stopLoss * 3 + positionSizePenalty + deterministicFloat(seed, 3) * 5);
  
  // Consistency from regime stability
  const consistency = Math.max(40, Math.min(99, 
    70 + complexityBonus - Math.abs(regimeModifier) * 30 + jitter(4, 5)
  ));
  
  const finalCapital = 10000 * (1 + totalPnl / 10000);

  return {
    profitability: Math.max(-50, Math.min(150, profitability)),
    winRate: Math.max(20, Math.min(90, winRate)),
    sharpeRatio: Math.max(-2, Math.min(5, sharpeRatio)),
    maxDrawdown: Math.max(1, maxDrawdown),
    consistency: Math.max(30, consistency),
    trades,
    finalCapital: Math.max(1000, finalCapital),
  };
}
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { strategyId, batchSize } = await req.json();
    if (!strategyId) {
      return new Response(JSON.stringify({ error: 'strategyId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestedBatch = Math.min(batchSize || 100, 500); // Max 500 cycles per request

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get strategy
    const { data: strategy, error: fetchErr } = await supabaseClient
      .from('ai_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !strategy) {
      return new Response(JSON.stringify({ error: 'Strategy not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get existing REAL market-replay test count (legacy synthetic rows don't count)
    const { count: existingTests } = await supabaseClient
      .from('graduation_tests')
      .select('*', { count: 'exact', head: true })
      .eq('strategy_id', strategyId)
      .filter('test_data->>cycle_type', 'eq', 'market_replay');

    const startCycle = (existingTests || 0) + 1;
    const TOTAL_CYCLES = 1000;
    const remainingCycles = TOTAL_CYCLES - (existingTests || 0);
    const cyclesToRun = Math.min(requestedBatch, remainingCycles);

    if (cyclesToRun <= 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Training complete - all 1,000 market-replay cycles finished',
        totalTests: existingTests,
        completed: true
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch real market candles once per request (fail closed if unavailable)
    let candles: Candle[];
    let marketSymbol: string;
    try {
      const market = await getCandles();
      candles = market.candles;
      marketSymbol = market.symbol;
    } catch {
      return new Response(JSON.stringify({ error: 'Market data unavailable — training requires live exchange candles' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Run training cycles against real market history
    const results = [];
    let passedCount = 0;
    let totalProfitability = 0;
    let totalConsistency = 0;
    let totalWinRate = 0;
    let totalSharpe = 0;
    let totalDrawdown = 0;

    for (let i = 0; i < cyclesToRun; i++) {
      const cycleNum = startCycle + i;
      const result = runTrainingCycle(
        strategy.entry_rules,
        strategy.exit_rules,
        strategy.risk_parameters,
        cycleNum,
        TOTAL_CYCLES,
        candles
      );

      const passed = result.profitability >= 77 &&
                    result.winRate >= 60 &&
                    result.maxDrawdown <= 18 &&
                    result.consistency >= 77;

      if (passed) passedCount++;
      totalProfitability += result.profitability;
      totalConsistency += result.consistency;
      totalWinRate += result.winRate;
      totalSharpe += result.sharpeRatio;
      totalDrawdown += result.maxDrawdown;

      results.push({
        strategy_id: strategyId,
        user_id: user.id,
        test_number: cycleNum,
        profitability: result.profitability,
        win_rate: result.winRate,
        sharpe_ratio: result.sharpeRatio,
        max_drawdown: result.maxDrawdown,
        consistency_score: result.consistency,
        passed,
        test_data: {
          trades: result.trades,
          period_days: 7,
          capital: 10000,
          final_capital: result.finalCapital,
          cycle_type: 'market_replay',
          market_symbol: marketSymbol,
          source: 'binance_klines_1h',
        }
      });
    }

    // Batch insert (Supabase handles up to 1000 rows per insert)
    const batchInserts = [];
    for (let i = 0; i < results.length; i += 500) {
      batchInserts.push(
        supabaseClient.from('graduation_tests').insert(results.slice(i, i + 500))
      );
    }
    await Promise.all(batchInserts);

    const totalCompleted = (existingTests || 0) + cyclesToRun;
    const avgProfitability = totalProfitability / cyclesToRun;
    const avgConsistency = totalConsistency / cyclesToRun;
    const avgWinRate = totalWinRate / cyclesToRun;
    const avgSharpe = totalSharpe / cyclesToRun;
    const avgDrawdown = totalDrawdown / cyclesToRun;
    const passRate = (passedCount / cyclesToRun) * 100;

    // Update strategy with latest training stats
    const shouldGraduate = totalCompleted >= TOTAL_CYCLES && passRate >= 80;
    
    await supabaseClient.from('ai_strategies').update({
      profitability_score: avgProfitability,
      consistency_score: avgConsistency,
      backtest_count: totalCompleted,
      ...(shouldGraduate ? {
        is_graduated: true,
        graduation_date: new Date().toISOString(),
        status: 'backtesting',
        is_available_for_rent: true,
        rental_price_monthly: Math.max(29, Math.floor(avgProfitability * 0.5)),
      } : {})
    }).eq('id', strategyId);

    // If graduated, also update bot training queue
    if (shouldGraduate) {
      await supabaseClient.from('bot_training_queue').upsert({
        user_id: user.id,
        strategy_id: strategyId,
        status: 'graduated',
        profitability_score: avgProfitability,
        consistency_score: avgConsistency,
        graduation_eligible: true,
        training_completed_at: new Date().toISOString(),
        test_results: {
          total_cycles: totalCompleted,
          pass_rate: passRate,
          avg_sharpe: avgSharpe,
          avg_drawdown: avgDrawdown,
          avg_win_rate: avgWinRate,
        }
      }, { onConflict: 'strategy_id' });
    }

    return new Response(JSON.stringify({
      success: true,
      cyclesRun: cyclesToRun,
      totalCompleted,
      remainingCycles: TOTAL_CYCLES - totalCompleted,
      completed: totalCompleted >= TOTAL_CYCLES,
      graduated: shouldGraduate,
      stats: {
        passRate,
        avgProfitability,
        avgConsistency,
        avgWinRate,
        avgSharpe,
        avgDrawdown,
        passedCount,
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('train-strategy error:', error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
