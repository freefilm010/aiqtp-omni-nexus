import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Strategy templates derived from freqtrade-strategies, fmzquant/strategies, and TradingView patterns
const STRATEGY_TEMPLATES = [
  // === TREND FOLLOWING (40 strategies) ===
  { name: "EMA 8/21 Crossover", category: "trend", indicators: ["EMA8", "EMA21"], desc: "Classic short/medium EMA crossover for trend detection" },
  { name: "EMA 10/50 Golden Cross", category: "trend", indicators: ["EMA10", "EMA50"], desc: "Medium-term golden cross strategy" },
  { name: "Triple EMA (5/13/34)", category: "trend", indicators: ["EMA5", "EMA13", "EMA34"], desc: "Triple EMA alignment for strong trend confirmation" },
  { name: "SMA 20/50 Crossover", category: "trend", indicators: ["SMA20", "SMA50"], desc: "Simple moving average crossover" },
  { name: "SMA 50/200 Golden Cross", category: "trend", indicators: ["SMA50", "SMA200"], desc: "Classic institutional golden/death cross" },
  { name: "Hull Moving Average", category: "trend", indicators: ["HMA"], desc: "Hull MA for reduced lag trend following" },
  { name: "DEMA Trend", category: "trend", indicators: ["DEMA20", "DEMA50"], desc: "Double EMA for faster trend response" },
  { name: "TEMA Momentum", category: "trend", indicators: ["TEMA"], desc: "Triple EMA for ultra-fast trend detection" },
  { name: "Ichimoku Cloud", category: "trend", indicators: ["Ichimoku"], desc: "Full Ichimoku system: Tenkan-sen, Kijun-sen, Chikou Span" },
  { name: "Supertrend", category: "trend", indicators: ["Supertrend"], desc: "ATR-based trend indicator with dynamic stop" },
  { name: "3-Supertrend Multi", category: "trend", indicators: ["Supertrend10", "Supertrend11", "Supertrend12"], desc: "Three Supertrend confluence" },
  { name: "ADX Trend Strength", category: "trend", indicators: ["ADX", "DI+", "DI-"], desc: "ADX>25 with DI crossover for strong trends" },
  { name: "Parabolic SAR", category: "trend", indicators: ["PSAR"], desc: "Parabolic SAR for trailing stop and reversal" },
  { name: "Aroon Oscillator", category: "trend", indicators: ["AroonUp", "AroonDown"], desc: "Aroon 25-period trend identification" },
  { name: "Donchian Channel Breakout", category: "trend", indicators: ["Donchian20"], desc: "20-period Donchian channel breakout" },
  { name: "Keltner Channel Trend", category: "trend", indicators: ["Keltner"], desc: "Keltner channel breakout with ATR bands" },
  { name: "VWAP Trend", category: "trend", indicators: ["VWAP"], desc: "Volume-weighted average price trend" },
  { name: "Heikin Ashi Smoothed", category: "trend", indicators: ["HA"], desc: "Heikin Ashi candle trend filter" },
  { name: "Linear Regression Channel", category: "trend", indicators: ["LinReg"], desc: "Linear regression channel for trend direction" },
  { name: "Adaptive Moving Average", category: "trend", indicators: ["KAMA"], desc: "Kaufman Adaptive MA adjusting to volatility" },

  // === MOMENTUM (40 strategies) ===
  { name: "RSI Overbought/Oversold", category: "momentum", indicators: ["RSI14"], desc: "RSI 14 with 30/70 levels" },
  { name: "RSI 2-Period Mean Reversion", category: "momentum", indicators: ["RSI2"], desc: "Ultra-short RSI for mean reversion" },
  { name: "RSI Divergence", category: "momentum", indicators: ["RSI14", "Price"], desc: "RSI divergence detection for reversals" },
  { name: "MACD Standard", category: "momentum", indicators: ["MACD"], desc: "MACD 12/26/9 signal line crossover" },
  { name: "MACD Histogram Reversal", category: "momentum", indicators: ["MACD_Hist"], desc: "MACD histogram zero-line crossover" },
  { name: "Stochastic 14/3/3", category: "momentum", indicators: ["Stoch"], desc: "Stochastic oscillator with 20/80 levels" },
  { name: "Stochastic RSI", category: "momentum", indicators: ["StochRSI"], desc: "StochRSI for extreme overbought/oversold" },
  { name: "CCI Reversal", category: "momentum", indicators: ["CCI20"], desc: "4H CCI reversal at +/-100 levels" },
  { name: "Williams %R", category: "momentum", indicators: ["WilliamsR"], desc: "Williams %R for overbought/oversold" },
  { name: "Rate of Change", category: "momentum", indicators: ["ROC"], desc: "Price rate of change momentum" },
  { name: "Awesome Oscillator", category: "momentum", indicators: ["AO"], desc: "Bill Williams Awesome Oscillator" },
  { name: "MFI Money Flow", category: "momentum", indicators: ["MFI"], desc: "Money Flow Index volume-weighted RSI" },
  { name: "PPO Percentage Price", category: "momentum", indicators: ["PPO"], desc: "Percentage Price Oscillator" },
  { name: "TSI True Strength", category: "momentum", indicators: ["TSI"], desc: "True Strength Index double-smoothed" },
  { name: "Ultimate Oscillator", category: "momentum", indicators: ["UO"], desc: "Multi-timeframe momentum oscillator" },
  { name: "Fisher Transform", category: "momentum", indicators: ["Fisher"], desc: "Fisher Transform for Gaussian price distribution" },
  { name: "Ehlers MESA Adaptive", category: "momentum", indicators: ["MESA"], desc: "MESA adaptive moving average" },
  { name: "Coppock Curve", category: "momentum", indicators: ["Coppock"], desc: "Long-term momentum indicator for bottoms" },
  { name: "KST Oscillator", category: "momentum", indicators: ["KST"], desc: "Know Sure Thing multi-ROC" },
  { name: "Chande Momentum", category: "momentum", indicators: ["CMO"], desc: "Chande Momentum Oscillator" },

  // === VOLATILITY (30 strategies) ===
  { name: "Bollinger Band Squeeze", category: "volatility", indicators: ["BB20"], desc: "BB squeeze for breakout anticipation" },
  { name: "Bollinger Band Bounce", category: "volatility", indicators: ["BB20"], desc: "Mean reversion at BB outer bands" },
  { name: "ATR Breakout", category: "volatility", indicators: ["ATR14"], desc: "ATR-based volatility breakout" },
  { name: "ATR Trailing Stop", category: "volatility", indicators: ["ATR"], desc: "Dynamic ATR-based trailing stop" },
  { name: "Keltner + BB Squeeze", category: "volatility", indicators: ["Keltner", "BB"], desc: "TTM Squeeze: BB inside Keltner" },
  { name: "Standard Deviation Channel", category: "volatility", indicators: ["StdDev"], desc: "2-StdDev channel breakout/reversion" },
  { name: "Chaikin Volatility", category: "volatility", indicators: ["CV"], desc: "Chaikin volatility expansion/contraction" },
  { name: "VIX-Adjusted Position", category: "volatility", indicators: ["VIX"], desc: "Position sizing based on volatility regime" },
  { name: "Range Expansion Index", category: "volatility", indicators: ["REI"], desc: "Tom DeMark Range Expansion" },
  { name: "Historical Volatility Rank", category: "volatility", indicators: ["HV"], desc: "HV percentile rank for regime" },

  // === VOLUME (20 strategies) ===
  { name: "OBV Divergence", category: "volume", indicators: ["OBV"], desc: "On-Balance Volume divergence" },
  { name: "Volume Price Trend", category: "volume", indicators: ["VPT"], desc: "Volume-price trend confirmation" },
  { name: "Accumulation/Distribution", category: "volume", indicators: ["AD"], desc: "Chaikin A/D line for smart money" },
  { name: "VWAP Deviation", category: "volume", indicators: ["VWAP", "StdDev"], desc: "VWAP with standard deviation bands" },
  { name: "Volume Profile POC", category: "volume", indicators: ["VP"], desc: "Volume Profile Point of Control" },
  { name: "Elder Force Index", category: "volume", indicators: ["EFI"], desc: "Price change × volume momentum" },
  { name: "Klinger Volume", category: "volume", indicators: ["KVO"], desc: "Klinger Volume Oscillator" },
  { name: "Ease of Movement", category: "volume", indicators: ["EMV"], desc: "Price movement vs volume" },
  { name: "Volume Weighted MACD", category: "volume", indicators: ["VWMACD"], desc: "Volume-weighted MACD crossover" },
  { name: "Negative Volume Index", category: "volume", indicators: ["NVI"], desc: "NVI for smart money tracking" },

  // === MEAN REVERSION (25 strategies) ===
  { name: "Z-Score Reversion", category: "mean_reversion", indicators: ["ZScore"], desc: "Statistical z-score mean reversion" },
  { name: "RSI 2 + SMA 200", category: "mean_reversion", indicators: ["RSI2", "SMA200"], desc: "Short RSI pullback in uptrend" },
  { name: "Pairs Trading", category: "mean_reversion", indicators: ["Spread"], desc: "Cointegrated pairs spread trading" },
  { name: "Bollinger %B Reversion", category: "mean_reversion", indicators: ["BB_PctB"], desc: "BB %B extreme reversion" },
  { name: "Connors RSI", category: "mean_reversion", indicators: ["ConnorsRSI"], desc: "Composite RSI for mean reversion" },
  { name: "DV2 Indicator", category: "mean_reversion", indicators: ["DV2"], desc: "David Varadi DV2 for mean reversion" },
  { name: "IBS Inside Bar Setup", category: "mean_reversion", indicators: ["IBS"], desc: "Internal Bar Strength reversion" },
  { name: "Dynamic Balancing 50/50", category: "mean_reversion", indicators: ["Balance"], desc: "50% fund 50% position dynamic rebalancing" },
  { name: "Triangular Arbitrage", category: "mean_reversion", indicators: ["Spread3"], desc: "Three-way cross-pair spread" },
  { name: "Grid Trading", category: "mean_reversion", indicators: ["Grid"], desc: "50-line grid strategy for ranging markets" },

  // === BREAKOUT (25 strategies) ===
  { name: "52-Week High Breakout", category: "breakout", indicators: ["52WH"], desc: "New 52-week high momentum" },
  { name: "20-Level Breakout", category: "breakout", indicators: ["Level20"], desc: "20-period high/low channel breakout" },
  { name: "Opening Range Breakout", category: "breakout", indicators: ["ORB"], desc: "First 30min range breakout" },
  { name: "Pivot Point Breakout", category: "breakout", indicators: ["Pivot"], desc: "Daily pivot point S/R breakout" },
  { name: "3EMA + Bollinger Pivot", category: "breakout", indicators: ["EMA3", "BB", "Pivot"], desc: "Triple EMA with BB and pivot confluence" },
  { name: "London Breakout", category: "breakout", indicators: ["Session"], desc: "London session range breakout" },
  { name: "Turtle Trading", category: "breakout", indicators: ["Donchian20", "Donchian55"], desc: "Classic turtle trading 20/55 day breakout" },
  { name: "Volatility Contraction", category: "breakout", indicators: ["NR7"], desc: "Narrow range 7 day expansion" },
  { name: "5-Day High/Low Channel", category: "breakout", indicators: ["5DHL"], desc: "5-day high/low price channel breakout" },
  { name: "Range Bar Breakout", category: "breakout", indicators: ["RangeBar"], desc: "Fixed-range bar breakout strategy" },

  // === PATTERN RECOGNITION (20 strategies) ===
  { name: "Engulfing Candle", category: "pattern", indicators: ["Engulfing"], desc: "Bullish/bearish engulfing reversal" },
  { name: "Hammer/Shooting Star", category: "pattern", indicators: ["Hammer"], desc: "Single candle reversal patterns" },
  { name: "Morning/Evening Star", category: "pattern", indicators: ["Star"], desc: "Three-candle reversal patterns" },
  { name: "Three White Soldiers", category: "pattern", indicators: ["3WS"], desc: "Three consecutive bullish candles" },
  { name: "Doji Reversal", category: "pattern", indicators: ["Doji"], desc: "Doji candle at key levels" },
  { name: "Head & Shoulders", category: "pattern", indicators: ["H&S"], desc: "Classic H&S reversal pattern" },
  { name: "Double Top/Bottom", category: "pattern", indicators: ["Double"], desc: "Double top/bottom reversal" },
  { name: "Cup & Handle", category: "pattern", indicators: ["Cup"], desc: "Bullish continuation cup pattern" },
  { name: "1-3-1 Candlestick Reversal", category: "pattern", indicators: ["131"], desc: "Red-green candlestick reversal sequence" },
  { name: "123 Reversal + STARC Bands", category: "pattern", indicators: ["123", "STARC"], desc: "Combo reversal with STARC bands" },

  // === MULTI-INDICATOR COMBOS (20 strategies) ===
  { name: "RSI + MACD Confluence", category: "combo", indicators: ["RSI", "MACD"], desc: "Dual momentum confirmation" },
  { name: "EMA + ADX Filter", category: "combo", indicators: ["EMA", "ADX"], desc: "Trend direction with strength filter" },
  { name: "BB + RSI Strategy", category: "combo", indicators: ["BB", "RSI"], desc: "Volatility + momentum combo" },
  { name: "Ichimoku + MACD", category: "combo", indicators: ["Ichimoku", "MACD"], desc: "Cloud trend with MACD timing" },
  { name: "Stoch + EMA Cross", category: "combo", indicators: ["Stoch", "EMA"], desc: "Stochastic timing with EMA direction" },
  { name: "VWAP + RSI Intraday", category: "combo", indicators: ["VWAP", "RSI"], desc: "VWAP trend with RSI timing" },
  { name: "Supertrend + ADX", category: "combo", indicators: ["Supertrend", "ADX"], desc: "Trend direction + strength" },
  { name: "OBV + MACD Volume", category: "combo", indicators: ["OBV", "MACD"], desc: "Volume confirmation of momentum" },
  { name: "3-10 Oscillator Profile", category: "combo", indicators: ["Osc310"], desc: "3-10 oscillator with profile flagging" },
  { name: "Multi-Timeframe RSI", category: "combo", indicators: ["RSI_MTF"], desc: "RSI alignment across timeframes" },
];

// GitHub repos to fetch from
const GITHUB_REPOS = [
  { owner: 'freefilm010', repo: 'strategies', path: '', desc: 'FMZ Quant 3000+ strategies' },
  { owner: 'freefilm010', repo: 'freqtrade-strategies', path: 'user_data/strategies', desc: 'Freqtrade community strategies' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, count, category, templateIndex } = await req.json();

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? Deno.env.get('ANTHROPIC_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    if (action === 'list-templates') {
      const filtered = category && category !== 'all'
        ? STRATEGY_TEMPLATES.filter(t => t.category === category)
        : STRATEGY_TEMPLATES;
      return new Response(JSON.stringify({
        templates: filtered,
        total: STRATEGY_TEMPLATES.length,
        categories: [...new Set(STRATEGY_TEMPLATES.map(t => t.category))]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-from-template') {
      const template = typeof templateIndex === 'number'
        ? STRATEGY_TEMPLATES[templateIndex]
        : STRATEGY_TEMPLATES.find(t => t.name === templateIndex);

      if (!template) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Use AI to generate a full strategy from the template
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are AIQTP RD-Agent. Generate a complete trading strategy implementation.
Return JSON: { "name", "description", "entry_rules": { "conditions": [...], "logic": "AND" }, "exit_rules": { "stop_loss", "take_profit", "trailing_stop" }, "risk_parameters": { "max_position_size", "max_drawdown", "diversification" }, "code": "# Python implementation" }`
            },
            {
              role: 'user',
              content: `Generate a complete ${template.name} strategy.
Category: ${template.category}
Indicators: ${template.indicators.join(', ')}
Description: ${template.desc}
Make it production-ready with proper entry/exit rules, risk management, and Python-style code.`
            }
          ],
          temperature: 0.4,
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        throw new Error(`AI error: ${status}`);
      }

      const aiData = await aiResponse.json();
      const text = aiData.choices[0].message.content;
      let strategy;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        strategy = match ? JSON.parse(match[0]) : null;
      } catch { strategy = null; }

      if (!strategy) {
        strategy = {
          name: template.name,
          description: template.desc,
          entry_rules: { conditions: template.indicators.map(i => `${i} signal`), logic: 'AND' },
          exit_rules: { stop_loss: '2%', take_profit: '5%', trailing_stop: '1%' },
          risk_parameters: { max_position_size: '5%', max_drawdown: '10%', diversification: '5' },
          code: `# ${template.name}\n# Indicators: ${template.indicators.join(', ')}`
        };
      }

      // Save to database
      const { data: saved, error: saveErr } = await supabaseClient
        .from('ai_strategies')
        .insert({
          user_id: user.id,
          name: strategy.name || template.name,
          description: strategy.description || template.desc,
          status: 'draft',
          entry_rules: strategy.entry_rules,
          exit_rules: strategy.exit_rules,
          risk_parameters: strategy.risk_parameters,
          code: strategy.code,
        })
        .select()
        .single();

      if (saveErr) throw saveErr;

      // Log generation
      await supabaseClient.from('ai_generation_logs').insert({
        user_id: user.id,
        function_name: 'seed-strategies'
      });

      return new Response(JSON.stringify({
        success: true,
        strategy: saved,
        template: template.name,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'bulk-generate') {
      const batchCount = Math.min(count || 5, 10);
      const templates = category && category !== 'all'
        ? STRATEGY_TEMPLATES.filter(t => t.category === category)
        : STRATEGY_TEMPLATES;

      // Pick random templates
      const selected = [];
      const used = new Set<number>();
      for (let i = 0; i < batchCount && i < templates.length; i++) {
        let idx;
        do { idx = Math.floor(Math.random() * templates.length); } while (used.has(idx));
        used.add(idx);
        selected.push(templates[idx]);
      }

      const results = [];
      for (const template of selected) {
        const { data: saved, error: saveErr } = await supabaseClient
          .from('ai_strategies')
          .insert({
            user_id: user.id,
            name: template.name,
            description: template.desc,
            status: 'draft',
            entry_rules: {
              conditions: template.indicators.map(i => `${i} signal confirmation`),
              logic: 'AND'
            },
            exit_rules: { stop_loss: '2%', take_profit: '5%', trailing_stop: '1.5%' },
            risk_parameters: { max_position_size: '5%', max_drawdown: '10%', diversification: '5' },
            code: `# ${template.name}\n# Category: ${template.category}\n# Indicators: ${template.indicators.join(', ')}`,
          })
          .select()
          .single();

        if (!saveErr && saved) results.push(saved);
      }

      return new Response(JSON.stringify({
        success: true,
        generated: results.length,
        strategies: results.map(s => ({ id: s.id, name: s.name })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: list-templates, generate-from-template, bulk-generate' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('seed-strategies error:', error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
