/**
 * Risk Engine
 * VaR, CVaR, Monte Carlo simulation, stress testing, portfolio risk metrics.
 */

// ── Random Normal (Box-Muller) ───────────────────────────────

function randNormal(): number {
  return (
    Math.sqrt(-2 * Math.log(Math.random())) *
    Math.cos(2 * Math.PI * Math.random())
  );
}

// ── Monte Carlo Return Simulation ────────────────────────────

export function monteCarloReturns(
  mu: number,
  sigma: number,
  simulations: number
): number[] {
  const results: number[] = new Array(simulations);
  for (let i = 0; i < simulations; i++) {
    results[i] = mu + sigma * randNormal();
  }
  return results;
}

/**
 * Multi-asset correlated Monte Carlo using Cholesky decomposition.
 */
export function correlatedMonteCarloReturns(
  mus: number[],
  sigmas: number[],
  correlationMatrix: number[][],
  simulations: number
): number[][] {
  const n = mus.length;
  const L = choleskyDecompose(correlationMatrix);

  const results: number[][] = [];
  for (let sim = 0; sim < simulations; sim++) {
    const z = Array.from({ length: n }, () => randNormal());
    const correlated = L.map((row, i) =>
      mus[i] + sigmas[i] * row.reduce((s, lij, j) => s + lij * z[j], 0)
    );
    results.push(correlated);
  }
  return results;
}

function choleskyDecompose(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      L[i][j] =
        i === j
          ? Math.sqrt(Math.max(matrix[i][i] - sum, 0))
          : L[j][j] > 0
          ? (matrix[i][j] - sum) / L[j][j]
          : 0;
    }
  }
  return L;
}

// ── Value at Risk ────────────────────────────────────────────

export function valueAtRisk(
  returns: number[],
  confidence: number = 0.95
): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  return sorted[Math.max(idx, 0)];
}

/** Conditional VaR (Expected Shortfall) */
export function conditionalVaR(
  returns: number[],
  confidence: number = 0.95
): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - confidence) * sorted.length);
  if (cutoff <= 0) return sorted[0] ?? 0;

  const tail = sorted.slice(0, cutoff);
  return tail.reduce((a, b) => a + b, 0) / tail.length;
}

// ── Stress Testing ──────────────────────────────────────────

export interface StressScenario {
  name: string;
  shocks: Record<string, number>; // symbol → % shock
}

export interface StressResult {
  scenario: string;
  portfolioLoss: number;
  portfolioLossPct: number;
  assetImpacts: { symbol: string; loss: number }[];
}

export function runStressTest(
  positions: { symbol: string; value: number }[],
  scenario: StressScenario
): StressResult {
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  let totalLoss = 0;

  const assetImpacts = positions.map((pos) => {
    const shock = scenario.shocks[pos.symbol] ?? 0;
    const loss = pos.value * shock;
    totalLoss += loss;
    return { symbol: pos.symbol, loss };
  });

  return {
    scenario: scenario.name,
    portfolioLoss: totalLoss,
    portfolioLossPct: totalValue > 0 ? totalLoss / totalValue : 0,
    assetImpacts,
  };
}

// ── Built-in Scenarios ──────────────────────────────────────

export const STRESS_SCENARIOS: StressScenario[] = [
  {
    name: "2008 Financial Crisis",
    shocks: { BTC: -0.50, ETH: -0.60, SOL: -0.70, SPY: -0.38, QQQ: -0.42 },
  },
  {
    name: "COVID-19 Crash (Mar 2020)",
    shocks: { BTC: -0.40, ETH: -0.45, SOL: -0.55, SPY: -0.34, QQQ: -0.30 },
  },
  {
    name: "Crypto Winter 2022",
    shocks: { BTC: -0.65, ETH: -0.68, SOL: -0.90, SPY: -0.10, QQQ: -0.15 },
  },
  {
    name: "Flash Crash (-20% instant)",
    shocks: { BTC: -0.20, ETH: -0.20, SOL: -0.20, SPY: -0.20, QQQ: -0.20 },
  },
];

// ── Portfolio Risk Metrics ──────────────────────────────────

export interface PortfolioRiskMetrics {
  var95: number;
  var99: number;
  cvar95: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
}

export function computePortfolioRisk(
  returns: number[],
  riskFreeRate: number = 0
): PortfolioRiskMetrics {
  if (returns.length === 0) {
    return { var95: 0, var99: 0, cvar95: 0, maxDrawdown: 0, sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0 };
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const std = Math.sqrt(
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
  );

  const downsideReturns = returns.filter((r) => r < riskFreeRate);
  const downsideDev =
    downsideReturns.length > 0
      ? Math.sqrt(
          downsideReturns.reduce((s, r) => s + (r - riskFreeRate) ** 2, 0) /
            downsideReturns.length
        )
      : 0;

  // Max drawdown from cumulative returns
  let peak = 0;
  let maxDD = 0;
  let cumulative = 0;
  for (const r of returns) {
    cumulative += r;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }

  const annualizedReturn = mean * 252;
  const annualizedStd = std * Math.sqrt(252);

  return {
    var95: valueAtRisk(returns, 0.95),
    var99: valueAtRisk(returns, 0.99),
    cvar95: conditionalVaR(returns, 0.95),
    maxDrawdown: maxDD,
    sharpeRatio: annualizedStd > 0 ? (annualizedReturn - riskFreeRate) / annualizedStd : 0,
    sortinoRatio: downsideDev > 0 ? (annualizedReturn - riskFreeRate) / (downsideDev * Math.sqrt(252)) : 0,
    calmarRatio: maxDD > 0 ? annualizedReturn / maxDD : 0,
  };
}
