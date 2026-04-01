/**
 * Volatility Surface Engine
 * Bilinear interpolation over strike × maturity grid.
 */

export interface VolPoint {
  strike: number;
  maturity: number; // years
  iv: number;
}

export class VolSurface {
  private grid: VolPoint[];
  private strikes: number[];
  private maturities: number[];

  constructor(points: VolPoint[]) {
    this.grid = points;
    this.strikes = [...new Set(points.map((p) => p.strike))].sort((a, b) => a - b);
    this.maturities = [...new Set(points.map((p) => p.maturity))].sort((a, b) => a - b);
  }

  /** Bilinear interpolation to get IV at any (strike, maturity). */
  getIV(strike: number, maturity: number): number {
    const kLow = this.findBracket(this.strikes, strike);
    const tLow = this.findBracket(this.maturities, maturity);

    const k0 = this.strikes[kLow];
    const k1 = this.strikes[Math.min(kLow + 1, this.strikes.length - 1)];
    const t0 = this.maturities[tLow];
    const t1 = this.maturities[Math.min(tLow + 1, this.maturities.length - 1)];

    const iv00 = this.lookup(k0, t0);
    const iv10 = this.lookup(k1, t0);
    const iv01 = this.lookup(k0, t1);
    const iv11 = this.lookup(k1, t1);

    const kFrac = k1 !== k0 ? (strike - k0) / (k1 - k0) : 0;
    const tFrac = t1 !== t0 ? (maturity - t0) / (t1 - t0) : 0;

    const ivLow = iv00 + kFrac * (iv10 - iv00);
    const ivHigh = iv01 + kFrac * (iv11 - iv01);

    return ivLow + tFrac * (ivHigh - ivLow);
  }

  /** Generate a full surface grid for visualization. */
  toGrid(strikeSteps: number = 20, maturitySteps: number = 10) {
    const kMin = this.strikes[0];
    const kMax = this.strikes[this.strikes.length - 1];
    const tMin = this.maturities[0];
    const tMax = this.maturities[this.maturities.length - 1];

    const surface: { strike: number; maturity: number; iv: number }[] = [];

    for (let i = 0; i <= strikeSteps; i++) {
      const k = kMin + (i / strikeSteps) * (kMax - kMin);
      for (let j = 0; j <= maturitySteps; j++) {
        const t = tMin + (j / maturitySteps) * (tMax - tMin);
        surface.push({ strike: k, maturity: t, iv: this.getIV(k, t) });
      }
    }

    return surface;
  }

  private lookup(strike: number, maturity: number): number {
    const p = this.grid.find((g) => g.strike === strike && g.maturity === maturity);
    if (p) return p.iv;

    // Nearest neighbour fallback
    let best = this.grid[0];
    let minD = Infinity;
    for (const g of this.grid) {
      const d = Math.abs(g.strike - strike) + Math.abs(g.maturity - maturity) * 1000;
      if (d < minD) { minD = d; best = g; }
    }
    return best.iv;
  }

  private findBracket(sorted: number[], value: number): number {
    for (let i = 0; i < sorted.length - 1; i++) {
      if (value >= sorted[i] && value <= sorted[i + 1]) return i;
    }
    return value <= sorted[0] ? 0 : sorted.length - 1;
  }
}
