import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import {
  getCandles,
  runMarketReplayCycle,
  cyclePassed,
  deterministicFloat as sharedRandom,
  PASS_CRITERIA,
  type Candle,
} from "../_shared/market_replay.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TEMPLATES = [
  { name: "EMA 8/21 Crossover", cat: "trend", ind: ["EMA8","EMA21"], desc: "Short/medium EMA crossover" },
  { name: "Triple EMA (5/13/34)", cat: "trend", ind: ["EMA5","EMA13","EMA34"], desc: "Triple EMA alignment" },
  { name: "Supertrend", cat: "trend", ind: ["Supertrend"], desc: "ATR-based trend with dynamic stop" },
  { name: "Ichimoku Cloud", cat: "trend", ind: ["Ichimoku"], desc: "Full Ichimoku system" },
  { name: "ADX Trend Strength", cat: "trend", ind: ["ADX","DI+","DI-"], desc: "ADX>25 with DI crossover" },
  { name: "RSI Overbought/Oversold", cat: "momentum", ind: ["RSI14"], desc: "RSI 14 with 30/70 levels" },
  { name: "MACD Standard", cat: "momentum", ind: ["MACD"], desc: "MACD 12/26/9 crossover" },
  { name: "Stochastic RSI", cat: "momentum", ind: ["StochRSI"], desc: "StochRSI extreme levels" },
  { name: "Bollinger Band Squeeze", cat: "volatility", ind: ["BB","BBWidth"], desc: "BB squeeze breakout" },
  { name: "ATR Breakout", cat: "volatility", ind: ["ATR"], desc: "ATR-based breakout detection" },
  { name: "OBV Divergence", cat: "volume", ind: ["OBV","Price"], desc: "On-Balance Volume divergence" },
  { name: "VWAP Reversion", cat: "mean_reversion", ind: ["VWAP"], desc: "VWAP mean reversion intraday" },
  { name: "Donchian Breakout", cat: "breakout", ind: ["Donchian20"], desc: "20-period channel breakout" },
  { name: "RSI+MACD Confluence", cat: "combo", ind: ["RSI14","MACD"], desc: "Multi-indicator confluence" },
  { name: "BB+RSI Mean Reversion", cat: "combo", ind: ["BB","RSI14"], desc: "Bollinger+RSI oversold bounce" },
  { name: "EMA+ADX Trend", cat: "combo", ind: ["EMA20","ADX"], desc: "EMA direction + ADX strength" },
  { name: "Momentum ROC", cat: "momentum", ind: ["ROC14"], desc: "Rate of change momentum" },
  { name: "CCI Reversal", cat: "momentum", ind: ["CCI20"], desc: "CCI +/-100 level reversals" },
  { name: "Keltner Channel", cat: "trend", ind: ["Keltner"], desc: "Keltner channel breakout" },
  { name: "Parabolic SAR Trail", cat: "trend", ind: ["PSAR"], desc: "PSAR trailing stop reversal" },
];

function deterministicFloat(seed: string, index: number): number {
  return sharedRandom(seed, index);
}

const SAMPLE_CYCLES = 60; // real market-replay windows evaluated per strategy

function trainOnRealMarket(
  entryRules: unknown,
  exitRules: unknown,
  riskParams: unknown,
  candles: Candle[],
) {
  let profit = 0, consistency = 0, winRate = 0, sharpe = 0, maxDD = 0, trades = 0, passed = 0;
  for (let i = 0; i < SAMPLE_CYCLES; i++) {
    const r = runMarketReplayCycle(entryRules, exitRules, riskParams, i, candles);
    profit += r.profitability;
    consistency += r.consistency;
    winRate += r.winRate;
    sharpe += r.sharpeRatio;
    maxDD += r.maxDrawdown;
    trades += r.trades;
    if (cyclePassed(r)) passed++;
  }
  const passRate = (passed / SAMPLE_CYCLES) * 100;
  return {
    avgProfit: profit / SAMPLE_CYCLES,
    avgConsistency: consistency / SAMPLE_CYCLES,
    avgWinRate: winRate / SAMPLE_CYCLES,
    avgSharpe: sharpe / SAMPLE_CYCLES,
    avgMaxDD: maxDD / SAMPLE_CYCLES,
    totalTrades: trades,
    passRate,
    graduated: passRate >= PASS_CRITERIA.minPassRate,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, batchSize } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Real exchange candles are mandatory — fail closed, never simulate.
    let candles: Candle[];
    let marketSymbol: string;
    const needsMarket = action === 'full-pipeline' || action === 'train-existing';
    if (needsMarket) {
      try {
        const market = await getCandles();
        candles = market.candles;
        marketSymbol = market.symbol;
      } catch {
        return new Response(JSON.stringify({
          error: 'Market data unavailable — pipeline requires live exchange candles',
        }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    async function persist(strategyId: string, stats: ReturnType<typeof trainOnRealMarket>) {
      const rentalPrice = stats.graduated
        ? Math.round(29 + Math.max(0, stats.avgProfit) * 5 + stats.passRate * 0.3)
        : null;
      const updateData: Record<string, unknown> = {
        status: stats.graduated ? 'graduated' : 'backtesting',
        profitability_score: Math.round(stats.avgProfit * 100) / 100,
        consistency_score: Math.round(stats.avgConsistency * 100) / 100,
        backtest_count: SAMPLE_CYCLES,
        is_graduated: stats.graduated,
      };
      if (stats.graduated) {
        updateData.graduation_date = new Date().toISOString();
        updateData.is_available_for_rent = true;
        updateData.rental_price_monthly = rentalPrice;
      }
      await supabase.from('ai_strategies').update(updateData).eq('id', strategyId);

      await supabase.from('bot_training_queue').insert({
        user_id: user!.id,
        strategy_id: strategyId,
        status: stats.graduated ? 'graduated' : 'completed',
        profitability_score: stats.avgProfit,
        consistency_score: stats.avgConsistency,
        graduation_eligible: stats.graduated,
        training_started_at: new Date(Date.now() - 60000).toISOString(),
        training_completed_at: new Date().toISOString(),
        test_results: {
          cycle_type: 'market_replay',
          market_symbol: marketSymbol,
          source: 'binance_klines_1h',
          sampled_cycles: SAMPLE_CYCLES,
          pass_rate: stats.passRate,
          avg_win_rate: stats.avgWinRate,
          avg_sharpe: stats.avgSharpe,
          avg_max_drawdown: stats.avgMaxDD,
          total_trades: stats.totalTrades,
        },
      });
      return rentalPrice;
    }

    // Train strategies that already exist (no new records created).
    if (action === 'train-existing') {
      const limit = Math.min(batchSize || 25, 100);
      const { data: pending } = await supabase
        .from('ai_strategies')
        .select('id, name, entry_rules, exit_rules, risk_parameters')
        .eq('user_id', user.id)
        .eq('is_graduated', false)
        .order('created_at', { ascending: true })
        .limit(limit);

      const results: any[] = [];
      for (const s of pending ?? []) {
        const stats = trainOnRealMarket(s.entry_rules, s.exit_rules, s.risk_parameters, candles!);
        const rentalPrice = await persist(s.id, stats);
        results.push({
          id: s.id,
          name: s.name,
          profitability: Math.round(stats.avgProfit * 100) / 100,
          consistency: Math.round(stats.avgConsistency * 100) / 100,
          winRate: Math.round(stats.avgWinRate * 100) / 100,
          passRate: Math.round(stats.passRate * 100) / 100,
          graduated: stats.graduated,
          rentalPrice,
        });
      }
      const graduatedCount = results.filter(r => r.graduated).length;
      return new Response(JSON.stringify({
        success: true,
        total: results.length,
        graduated: graduatedCount,
        market: { symbol: marketSymbol!, source: 'binance_klines_1h', cycles_per_strategy: SAMPLE_CYCLES },
        results,
        message: `Replayed real ${marketSymbol} history for ${results.length} strategies; ${graduatedCount} graduated.`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'full-pipeline') {
      const count = Math.min(batchSize || 5, 10);
      const results: any[] = [];

      const templateOffset = Math.floor(deterministicFloat(user.id, count) * TEMPLATES.length);
      const selectedTemplates = Array.from({ length: Math.min(count, TEMPLATES.length) }, (_, i) => TEMPLATES[(templateOffset + i) % TEMPLATES.length]);

      for (const [templateIndex, tpl] of selectedTemplates.entries()) {
        const entryRules = { conditions: tpl.ind.map(i => `${i} signal confirmation`), logic: 'AND' };
        const ruleSeed = `${user.id}:${tpl.name}:${templateIndex}`;
        const exitRules = {
          stop_loss: `${(1 + deterministicFloat(ruleSeed, 1) * 3).toFixed(2)}%`,
          take_profit: `${(3 + deterministicFloat(ruleSeed, 2) * 7).toFixed(2)}%`,
          trailing_stop: '1.5%'
        };
        const riskParams = { max_position_size: '5%', max_drawdown: '12%', diversification: '5' };

        const { data: strategy, error: buildErr } = await supabase
          .from('ai_strategies')
          .insert({
            user_id: user.id,
            name: tpl.name,
            description: tpl.desc,
            status: 'draft',
            entry_rules: entryRules,
            exit_rules: exitRules,
            risk_parameters: riskParams,
            code: `# ${tpl.name}\n# Category: ${tpl.cat}\n# Indicators: ${tpl.ind.join(', ')}`,
          })
          .select()
          .single();

        if (buildErr || !strategy) {
          console.error('Build error:', buildErr);
          continue;
        }

        const stats = trainOnRealMarket(entryRules, exitRules, riskParams, candles!);
        const rentalPrice = await persist(strategy.id, stats);

        results.push({
          id: strategy.id,
          name: tpl.name,
          profitability: Math.round(stats.avgProfit * 100) / 100,
          consistency: Math.round(stats.avgConsistency * 100) / 100,
          winRate: Math.round(stats.avgWinRate * 100) / 100,
          passRate: Math.round(stats.passRate * 100) / 100,
          graduated: stats.graduated,
          rentalPrice,
        });
      }

      const graduatedCount = results.filter(r => r.graduated).length;
      return new Response(JSON.stringify({
        success: true,
        total: results.length,
        graduated: graduatedCount,
        earning: graduatedCount > 0,
        market: { symbol: marketSymbol!, source: 'binance_klines_1h', cycles_per_strategy: SAMPLE_CYCLES },
        results,
        message: `Built ${results.length} strategies on real ${marketSymbol} history, ${graduatedCount} graduated.`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'pipeline-status') {
      const { data: strategies } = await supabase
        .from('ai_strategies')
        .select('status, is_graduated, is_available_for_rent, rental_price_monthly, profitability_score, consistency_score')
        .eq('user_id', user.id);

      const stats = {
        total: strategies?.length || 0,
        draft: strategies?.filter(s => s.status === 'draft').length || 0,
        trained: strategies?.filter(s => s.status === 'backtesting').length || 0,
        graduated: strategies?.filter(s => s.is_graduated).length || 0,
        renting: strategies?.filter(s => s.is_available_for_rent).length || 0,
        avgProfitability: strategies?.length
          ? strategies.reduce((a, s) => a + (s.profitability_score || 0), 0) / strategies.length : 0,
        potentialMonthlyRevenue: strategies
          ?.filter(s => s.is_available_for_rent)
          .reduce((a, s) => a + (s.rental_price_monthly || 0), 0) || 0,
      };

      return new Response(JSON.stringify({ success: true, stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Use action: full-pipeline, train-existing or pipeline-status' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });


  } catch (error) {
    console.error('auto-pipeline error:', error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
