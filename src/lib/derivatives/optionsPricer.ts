/**
 * Options Pricing Engine
 * Black-Scholes pricing, Greeks, implied volatility, and volatility surface.
 */

// ── Normal CDF (Abramowitz & Stegun approximation) ───────────

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y =
    1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
  return sign * y;
}

export function normCdf(x: number): number {
  return (1 + erf(x / Math.SQRT2)) / 2;
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ── Black-Scholes ────────────────────────────────────────────

export type OptionType = "call" | "put";

export interface BSInput {
  S: number;      // spot price
  K: number;      // strike
  r: number;      // risk-free rate (annualized)
  t: number;      // time to expiry (years)
  sigma: number;  // implied volatility
}

function d1d2(inp: BSInput) {
  const { S, K, r, t, sigma } = inp;
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * t) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return { d1, d2, sqrtT };
}

export function blackScholes(inp: BSInput, type: OptionType = "call"): number {
  if (inp.t <= 0) {
    return type === "call"
      ? Math.max(inp.S - inp.K, 0)
      : Math.max(inp.K - inp.S, 0);
  }
  const { d1, d2 } = d1d2(inp);
  const discount = Math.exp(-inp.r * inp.t);
  if (type === "call") {
    return inp.S * normCdf(d1) - inp.K * discount * normCdf(d2);
  }
  return inp.K * discount * normCdf(-d2) - inp.S * normCdf(-d1);
}

// ── Greeks ───────────────────────────────────────────────────

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;   // per day
  vega: number;     // per 1% vol move
  rho: number;      // per 1% rate move
}

export function greeks(inp: BSInput, type: OptionType = "call"): Greeks {
  if (inp.t <= 0) {
    const itm =
      type === "call" ? inp.S > inp.K : inp.S < inp.K;
    return { delta: itm ? (type === "call" ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const { d1, d2, sqrtT } = d1d2(inp);
  const { S, K, r, t, sigma } = inp;
  const pdf1 = normPdf(d1);
  const discount = Math.exp(-r * t);

  const gamma = pdf1 / (S * sigma * sqrtT);
  const vega = (S * pdf1 * sqrtT) / 100; // per 1% move

  if (type === "call") {
    return {
      delta: normCdf(d1),
      gamma,
      theta: (-(S * pdf1 * sigma) / (2 * sqrtT) - r * K * discount * normCdf(d2)) / 365,
      vega,
      rho: (K * t * discount * normCdf(d2)) / 100,
    };
  }

  return {
    delta: normCdf(d1) - 1,
    gamma,
    theta: (-(S * pdf1 * sigma) / (2 * sqrtT) + r * K * discount * normCdf(-d2)) / 365,
    vega,
    rho: (-K * t * discount * normCdf(-d2)) / 100,
  };
}

// ── Implied Volatility (Newton-Raphson) ──────────────────────

export function impliedVolatility(
  marketPrice: number,
  inp: Omit<BSInput, "sigma">,
  type: OptionType = "call",
  maxIter = 100,
  tol = 1e-6
): number {
  let sigma = 0.3; // initial guess

  for (let i = 0; i < maxIter; i++) {
    const bsInp: BSInput = { ...inp, sigma };
    const price = blackScholes(bsInp, type);
    const diff = price - marketPrice;

    if (Math.abs(diff) < tol) return sigma;

    const { d1 } = d1d2(bsInp);
    const vegaVal = inp.S * normPdf(d1) * Math.sqrt(inp.t);

    if (vegaVal < 1e-12) break;

    sigma -= diff / vegaVal;
    if (sigma <= 0.001) sigma = 0.001;
    if (sigma > 5) sigma = 5;
  }

  return sigma;
}

// ── Volatility Surface ──────────────────────────────────────

export interface VolSurfacePoint {
  strike: number;
  expiry: number; // years
  iv: number;
}

export function buildVolSurface(
  S: number,
  r: number,
  marketPrices: { strike: number; expiry: number; price: number; type: OptionType }[]
): VolSurfacePoint[] {
  return marketPrices.map(({ strike, expiry, price, type }) => ({
    strike,
    expiry,
    iv: impliedVolatility(price, { S, K: strike, r, t: expiry }, type),
  }));
}
