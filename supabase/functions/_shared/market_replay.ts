// Real market replay engine — key-free public exchange candles (Binance).
// No synthetic performance model: every metric comes from replaying a
// strategy's own stop-loss / take-profit parameters over real price history.

export interface Candle { o: number; h: number; l: number; c: number }

export interface CycleResult {
  profitability: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consistency: number;
  trades: number;
  finalCapital: number;
}

export function deterministicFloat(seed: string, index: number): number {
  let hash = 2166136261;
  const input = `${seed}:${index}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

let candleCache: { candles: Candle[]; fetchedAt: number; symbol: string } | null = null;

export async function getCandles(): Promise<{ candles: Candle[]; symbol: string }> {
  if (candleCache && Date.now() - candleCache.fetchedAt < 10 * 60 * 1000) {
    return { candles: candleCache.candles, symbol: candleCache.symbol };
  }
  for (const symbol of ['BTCUSDT', 'ETHUSDT']) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=1000`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) continue;
      const raw = await res.json();
      const candles: Candle[] = raw
        .map((k: any[]) => ({
          o: parseFloat(k[1]), h: parseFloat(k[2]), l: parseFloat(k[3]), c: parseFloat(k[4]),
        }))
        .filter((k: Candle) => Number.isFinite(k.c) && k.c > 0);
      if (candles.length >= 200) {
        candleCache = { candles, fetchedAt: Date.now(), symbol };
        return { candles, symbol };
      }
    } catch { /* try next symbol */ }
  }
  throw new Error('Market data unavailable');
}

/** Replays one week (168 hourly candles) of real history for a strategy. */
export function runMarketReplayCycle(
  entryRules: unknown,
  exitRules: any,
  riskParams: any,
  cycleIndex: number,
  candles: Candle[],
): CycleResult {
  const seed = JSON.stringify({ entryRules, exitRules, riskParams, cycleIndex });
  const stopLossPct = Math.max(0.2, parseFloat(exitRules?.stop_loss) || 2) / 100;
  const takeProfitPct = Math.max(0.2, parseFloat(exitRules?.take_profit) || 5) / 100;
  const maxPosSize = Math.max(1, parseFloat(riskParams?.max_position_size) || 5) / 100;

  const windowLen = 168;
  const maxStart = Math.max(1, candles.length - windowLen - 1);
  const start = Math.floor(deterministicFloat(seed, 0) * maxStart);
  const window = candles.slice(start, start + windowLen);

  const initialCapital = 10000;
  let capital = initialCapital;
  let peak = capital;
  let maxDrawdown = 0;
  let wins = 0;
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
    capital += positionCapital * ret;
    tradeReturns.push(ret);
    if (ret > 0) wins++;
    peak = Math.max(peak, capital);
    maxDrawdown = Math.max(maxDrawdown, ((peak - capital) / peak) * 100);
    i = exitIdx + 1;
  }

  const trades = tradeReturns.length;
  const winRate = trades > 0 ? (wins / trades) * 100 : 0;
  const profitability = ((capital - initialCapital) / initialCapital) * 100;

  let sharpeRatio = 0;
  if (tradeReturns.length > 1) {
    const mean = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
    const variance = tradeReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / (tradeReturns.length - 1);
    const std = Math.sqrt(variance);
    sharpeRatio = std > 0 ? (mean / std) * Math.sqrt(trades) : 0;
  }

  let profitableSegments = 0, segments = 0;
  for (let s = 0; s + 24 < window.length; s += 24) {
    segments++;
    if (window[s + 24].c > window[s].c) profitableSegments++;
  }
  const marketConsistency = segments > 0 ? (profitableSegments / segments) * 100 : 50;
  const consistency = Math.max(0, Math.min(100,
    50 + (winRate - 50) * 0.6 + (marketConsistency - 50) * 0.4,
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

/**
 * Pass criteria calibrated for REAL returns (a weekly replay window),
 * not the legacy synthetic 0-100 score scale.
 */
export const PASS_CRITERIA = {
  minProfitability: 1.0, // % net return over the replay week
  minWinRate: 60,
  maxDrawdown: 18,
  minConsistency: 60,
  minPassRate: 60, // % of cycles that must pass to graduate
};

export function cyclePassed(r: CycleResult): boolean {
  return r.profitability >= PASS_CRITERIA.minProfitability &&
    r.winRate >= PASS_CRITERIA.minWinRate &&
    r.maxDrawdown <= PASS_CRITERIA.maxDrawdown &&
    r.consistency >= PASS_CRITERIA.minConsistency;
}
