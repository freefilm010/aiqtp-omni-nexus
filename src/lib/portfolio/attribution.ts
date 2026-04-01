/**
 * Performance Attribution Engine
 * Decomposes total PnL into:
 *   - Trading PnL (alpha): skill-based returns
 *   - FX PnL: currency movement impact
 *   - Market PnL: benchmark-driven returns
 */

export interface AttributionInput {
  /** Total realized + unrealized PnL */
  totalPnL: number;
  /** FX impact on portfolio value (sum of currency gains/losses) */
  fxImpact: number;
  /** Benchmark return rate for the period (e.g. 0.05 = 5%) */
  benchmarkReturnRate: number;
  /** Average position value over the period */
  averagePositionValue: number;
}

export interface Attribution {
  /** Returns from active trading decisions (alpha) */
  tradingPnL: number;
  /** Returns from currency movements */
  fxPnL: number;
  /** Returns attributable to general market movement */
  marketPnL: number;
  /** Total PnL (should equal tradingPnL + fxPnL + marketPnL) */
  totalPnL: number;
  /** Trading alpha as percentage of total */
  alphaPercent: number;
}

export function computeAttribution(input: AttributionInput): Attribution {
  const marketPnL = input.averagePositionValue * input.benchmarkReturnRate;
  const fxPnL = input.fxImpact;
  const tradingPnL = input.totalPnL - fxPnL - marketPnL;
  const alphaPercent =
    input.totalPnL !== 0 ? (tradingPnL / Math.abs(input.totalPnL)) * 100 : 0;

  return {
    tradingPnL: Math.round(tradingPnL * 100) / 100,
    fxPnL: Math.round(fxPnL * 100) / 100,
    marketPnL: Math.round(marketPnL * 100) / 100,
    totalPnL: Math.round(input.totalPnL * 100) / 100,
    alphaPercent: Math.round(alphaPercent * 100) / 100,
  };
}
