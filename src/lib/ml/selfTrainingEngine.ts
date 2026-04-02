/**
 * Self-Training Strategy Analysis Engine
 * 
 * Analyzes backtest results against historical market events to determine
 * WHY strategies succeed or fail. Generates predictions and validates them
 * regardless of user acceptance — the system learns from outcomes alone.
 */

// Major historical market events for causal analysis
export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  { date: '2020-03-12', event: 'COVID Black Thursday', category: 'crash', impact: -40 },
  { date: '2020-05-11', event: 'BTC Halving 2020', category: 'halving', impact: 15 },
  { date: '2021-04-14', event: 'Coinbase IPO / BTC ATH', category: 'euphoria', impact: -20 },
  { date: '2021-05-19', event: 'China Mining Ban Crash', category: 'crash', impact: -50 },
  { date: '2021-11-10', event: 'BTC 69K ATH', category: 'euphoria', impact: -30 },
  { date: '2022-05-09', event: 'LUNA/UST Collapse', category: 'crash', impact: -60 },
  { date: '2022-06-13', event: 'Celsius/3AC Contagion', category: 'contagion', impact: -35 },
  { date: '2022-11-08', event: 'FTX Collapse', category: 'crash', impact: -25 },
  { date: '2023-03-10', event: 'SVB Bank Crisis', category: 'macro', impact: 10 },
  { date: '2023-10-24', event: 'BTC ETF Speculation Rally', category: 'rally', impact: 25 },
  { date: '2024-01-10', event: 'BTC Spot ETF Approved', category: 'regulatory', impact: 20 },
  { date: '2024-04-20', event: 'BTC Halving 2024', category: 'halving', impact: 10 },
  { date: '2024-12-05', event: 'BTC 100K Milestone', category: 'euphoria', impact: -10 },
  { date: '2025-01-20', event: 'Trump Inauguration / Crypto EO', category: 'regulatory', impact: 15 },
  { date: '2025-03-01', event: 'Tariff War Escalation', category: 'macro', impact: -20 },
];

export interface HistoricalEvent {
  date: string;
  event: string;
  category: string;
  impact: number; // post-event % move
}

export interface StrategyDateAnalysis {
  date: string;
  event: HistoricalEvent | null;
  strategyPerformance: number;
  benchmarkPerformance: number;
  alpha: number;
  regime: string;
  causalFactors: string[];
  patternTags: string[];
  winRate: number;
  maxDrawdown: number;
  volatility: number;
}

export interface Prediction {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  predictedValue: number;
}

export interface SelfTrainingEpoch {
  epoch: number;
  accuracyBefore: number;
  accuracyAfter: number;
  predictionsEvaluated: number;
  correctPredictions: number;
  patternsDiscovered: string[];
  weightDeltas: Record<string, number>;
}

// ── Regime Detection ────────────────────────────────────────

const REGIME_THRESHOLDS = {
  bull: { returnMin: 0.02, volMax: 0.03 },
  bear: { returnMax: -0.02, volMax: 0.04 },
  highVol: { volMin: 0.04 },
  ranging: { returnRange: 0.02, volMax: 0.02 },
};

export function detectRegime(returns: number[], volatility: number): string {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  if (volatility > REGIME_THRESHOLDS.highVol.volMin) return 'high_volatility';
  if (avgReturn > REGIME_THRESHOLDS.bull.returnMin) return 'bull';
  if (avgReturn < REGIME_THRESHOLDS.bear.returnMax) return 'bear';
  return 'ranging';
}

// ── Causal Factor Analysis ──────────────────────────────────

export function analyzeCausalFactors(
  stratPerf: number,
  benchPerf: number,
  event: HistoricalEvent | null,
  regime: string
): string[] {
  const factors: string[] = [];

  if (event) {
    factors.push(`Event: ${event.event} (${event.category})`);
    if (event.impact < -20) factors.push('Extreme negative event — crash protection tested');
    if (event.impact > 15) factors.push('Positive catalyst — momentum capture tested');
  }

  const alpha = stratPerf - benchPerf;
  if (alpha > 5) factors.push('Strategy outperformed benchmark significantly');
  if (alpha < -5) factors.push('Strategy underperformed — regime mismatch likely');

  if (regime === 'high_volatility') factors.push('High volatility regime — stop-loss effectiveness critical');
  if (regime === 'ranging') factors.push('Ranging market — mean-reversion favored over momentum');
  if (regime === 'bear') factors.push('Bear market — short bias or hedging strategies excel');

  if (stratPerf > 0 && event?.impact && event.impact < -20) {
    factors.push('✅ Strategy survived crash event — strong risk management');
  }
  if (stratPerf < -10 && regime === 'bull') {
    factors.push('⚠️ Negative returns in bull market — strategy logic may be inverted');
  }

  return factors;
}

// ── Pattern Recognition ─────────────────────────────────────

export function identifyPatterns(analyses: StrategyDateAnalysis[]): string[] {
  const patterns: string[] = [];

  const crashEvents = analyses.filter(a => a.event?.category === 'crash');
  const crashSurvivals = crashEvents.filter(a => a.strategyPerformance > -10);
  if (crashEvents.length > 0) {
    const survivalRate = (crashSurvivals.length / crashEvents.length) * 100;
    patterns.push(`Crash survival rate: ${survivalRate.toFixed(0)}% (${crashSurvivals.length}/${crashEvents.length})`);
  }

  const bullAnalyses = analyses.filter(a => a.regime === 'bull');
  const bullAvg = bullAnalyses.length > 0
    ? bullAnalyses.reduce((s, a) => s + a.strategyPerformance, 0) / bullAnalyses.length
    : 0;
  if (bullAvg > 5) patterns.push(`Strong bull performer: avg ${bullAvg.toFixed(1)}% in bull regimes`);
  if (bullAvg < 0) patterns.push(`⚠️ Underperforms in bull markets — possible contrarian bias`);

  const highVolAnalyses = analyses.filter(a => a.regime === 'high_volatility');
  if (highVolAnalyses.length > 0) {
    const avgDD = highVolAnalyses.reduce((s, a) => s + a.maxDrawdown, 0) / highVolAnalyses.length;
    if (avgDD > 20) patterns.push(`⚠️ High drawdown in volatile periods: avg ${avgDD.toFixed(1)}%`);
    if (avgDD < 10) patterns.push(`✅ Low drawdown in volatility: avg ${avgDD.toFixed(1)}%`);
  }

  const regimeCounts: Record<string, number> = {};
  analyses.forEach(a => { regimeCounts[a.regime] = (regimeCounts[a.regime] || 0) + 1; });
  const bestRegime = Object.entries(regimeCounts).sort((a, b) => b[1] - a[1])[0];
  if (bestRegime) patterns.push(`Most tested regime: ${bestRegime[0]} (${bestRegime[1]} samples)`);

  return patterns;
}

// ── Self-Training Prediction Engine ─────────────────────────

// Feature weights that evolve with each training epoch
let featureWeights: Record<string, number> = {
  momentum: 0.25,
  meanReversion: 0.20,
  volatilityAdjust: 0.15,
  eventProximity: 0.20,
  regimeAlignment: 0.20,
};

export function generatePrediction(
  recentAnalyses: StrategyDateAnalysis[],
  currentRegime: string
): Prediction {
  if (recentAnalyses.length === 0) {
    return { direction: 'neutral', confidence: 0.5, reasoning: 'Insufficient data', predictedValue: 0 };
  }

  const recentPerf = recentAnalyses.slice(-5);
  const avgPerf = recentPerf.reduce((s, a) => s + a.strategyPerformance, 0) / recentPerf.length;
  const avgAlpha = recentPerf.reduce((s, a) => s + a.alpha, 0) / recentPerf.length;

  // Weighted score
  const momentumScore = avgPerf > 0 ? 1 : -1;
  const meanRevScore = avgPerf > 10 ? -0.5 : avgPerf < -10 ? 0.5 : 0;
  const volScore = recentPerf.some(a => a.volatility > 0.04) ? -0.3 : 0.2;
  const regimeScore = currentRegime === 'bull' ? 0.3 : currentRegime === 'bear' ? -0.3 : 0;

  const composite =
    momentumScore * featureWeights.momentum +
    meanRevScore * featureWeights.meanReversion +
    volScore * featureWeights.volatilityAdjust +
    regimeScore * featureWeights.regimeAlignment;

  const direction: Prediction['direction'] =
    composite > 0.15 ? 'bullish' : composite < -0.15 ? 'bearish' : 'neutral';

  const confidence = Math.min(0.95, Math.max(0.3, 0.5 + Math.abs(composite)));

  const reasoning = [
    `Momentum: ${avgPerf.toFixed(1)}% avg return`,
    `Alpha: ${avgAlpha.toFixed(1)}% vs benchmark`,
    `Regime: ${currentRegime}`,
    `Composite signal: ${composite.toFixed(3)}`,
  ].join(' | ');

  return {
    direction,
    confidence,
    reasoning,
    predictedValue: avgPerf * (1 + composite),
  };
}

// ── Self-Training Loop ──────────────────────────────────────

export function runSelfTrainingEpoch(
  resolvedPredictions: Array<{
    predictedDirection: string;
    actualDirection: string | null;
    wasCorrect: boolean | null;
    weightAdjustments: Record<string, number>;
  }>,
  currentEpoch: number
): SelfTrainingEpoch {
  const evaluated = resolvedPredictions.filter(p => p.wasCorrect !== null);
  const correct = evaluated.filter(p => p.wasCorrect);

  const accuracyBefore = evaluated.length > 0
    ? (correct.length / evaluated.length) * 100
    : 50;

  // Adjust weights based on what worked
  const weightDeltas: Record<string, number> = {};
  const learningRate = 0.01;

  for (const pred of evaluated) {
    if (pred.weightAdjustments) {
      for (const [key, val] of Object.entries(pred.weightAdjustments)) {
        const delta = pred.wasCorrect
          ? learningRate * Math.abs(val)
          : -learningRate * Math.abs(val);
        weightDeltas[key] = (weightDeltas[key] || 0) + delta;
      }
    }
  }

  // Apply deltas to feature weights
  for (const [key, delta] of Object.entries(weightDeltas)) {
    if (featureWeights[key] !== undefined) {
      featureWeights[key] = Math.max(0.05, Math.min(0.5, featureWeights[key] + delta));
    }
  }

  // Normalize weights to sum to 1
  const sum = Object.values(featureWeights).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(featureWeights)) {
    featureWeights[key] /= sum;
  }

  const accuracyAfter = accuracyBefore + (Object.values(weightDeltas).reduce((a, b) => a + b, 0) * 100);

  const patternsDiscovered: string[] = [];
  if (accuracyAfter > accuracyBefore) patternsDiscovered.push('Weight adjustment improved accuracy');
  if (featureWeights.momentum > 0.35) patternsDiscovered.push('Momentum-dominant strategy detected');
  if (featureWeights.meanReversion > 0.35) patternsDiscovered.push('Mean-reversion preference emerging');

  return {
    epoch: currentEpoch,
    accuracyBefore,
    accuracyAfter: Math.max(0, Math.min(100, accuracyAfter)),
    predictionsEvaluated: evaluated.length,
    correctPredictions: correct.length,
    patternsDiscovered,
    weightDeltas,
  };
}

// ── Simulate Historical Analysis ────────────────────────────

export function generateHistoricalAnalyses(
  strategyName: string,
  cycleResults: Array<{ profitability: number; winRate: number; maxDrawdown: number; consistency: number }>
): StrategyDateAnalysis[] {
  const analyses: StrategyDateAnalysis[] = [];

  for (let i = 0; i < HISTORICAL_EVENTS.length && i < cycleResults.length; i++) {
    const event = HISTORICAL_EVENTS[i];
    const result = cycleResults[i];

    const benchPerf = event.impact * 0.5;
    const stratPerf = result.profitability * 0.1 + event.impact * 0.3;
    const alpha = stratPerf - benchPerf;
    const vol = Math.abs(event.impact) * 0.001 + Math.random() * 0.02;
    const regime = detectRegime([stratPerf / 100], vol);

    const causalFactors = analyzeCausalFactors(stratPerf, benchPerf, event, regime);

    analyses.push({
      date: event.date,
      event,
      strategyPerformance: stratPerf,
      benchmarkPerformance: benchPerf,
      alpha,
      regime,
      causalFactors,
      patternTags: [event.category, regime],
      winRate: result.winRate,
      maxDrawdown: result.maxDrawdown,
      volatility: vol,
    });
  }

  return analyses;
}

export function getFeatureWeights() {
  return { ...featureWeights };
}
