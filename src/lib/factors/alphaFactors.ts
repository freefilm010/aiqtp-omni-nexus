/**
 * Alpha Factors Library - Qlib-Inspired
 * Advanced alpha factors for quantitative trading strategies
 */

import { PriceData } from './technicalIndicators';

export interface AlphaFactorResult {
  name: string;
  values: number[];
  timestamps: Date[];
}

// ============= Price-Based Alpha Factors =============

/**
 * Alpha #1: (rank(Ts_ArgMax(SignedPower(((returns < 0) ? stddev(returns, 20) : close), 2.), 5)) - 0.5)
 */
export function alpha001(prices: PriceData[]): number[] {
  const closes = prices.map(p => p.close);
  const n = closes.length;
  const returns: number[] = [0];
  
  for (let i = 1; i < n; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  
  const result: number[] = [];
  const windowSize = 20;
  const argMaxWindow = 5;
  
  for (let i = 0; i < n; i++) {
    if (i < windowSize + argMaxWindow - 1) {
      result.push(NaN);
      continue;
    }
    
    // Calculate stddev of returns over 20 periods
    const returnSlice = returns.slice(i - windowSize + 1, i + 1);
    const mean = returnSlice.reduce((a, b) => a + b, 0) / windowSize;
    const stddev = Math.sqrt(returnSlice.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / windowSize);
    
    // For each of last 5 periods, compute SignedPower
    const signedPowers: number[] = [];
    for (let j = i - argMaxWindow + 1; j <= i; j++) {
      const val = returns[j] < 0 ? stddev : closes[j];
      signedPowers.push(Math.sign(val) * Math.pow(Math.abs(val), 2));
    }
    
    // Find argmax (position of max value)
    let maxIdx = 0;
    let maxVal = signedPowers[0];
    for (let k = 1; k < signedPowers.length; k++) {
      if (signedPowers[k] > maxVal) {
        maxVal = signedPowers[k];
        maxIdx = k;
      }
    }
    
    // Rank and normalize to [-0.5, 0.5]
    result.push((maxIdx / (argMaxWindow - 1)) - 0.5);
  }
  
  return result;
}

/**
 * Alpha #2: (-1 * correlation(rank(delta(log(volume), 2)), rank(((close - open) / open)), 6))
 */
export function alpha002(prices: PriceData[]): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < 6) {
      result.push(NaN);
    } else {
      const volumeChanges = prices.slice(i - 5, i + 1).map((p, idx, arr) => 
        idx > 0 ? Math.log(p.volume) - Math.log(arr[idx - 1].volume) : 0
      );
      const priceRatios = prices.slice(i - 5, i + 1).map(p => 
        p.open !== 0 ? (p.close - p.open) / p.open : 0
      );
      
      const corr = calculateCorrelation(volumeChanges, priceRatios);
      result.push(-1 * corr);
    }
  }
  return result;
}

/**
 * Mean Reversion Factor: Distance from moving average
 */
export function meanReversionFactor(prices: PriceData[], maPeriod: number = 20): number[] {
  const closes = prices.map(p => p.close);
  const result: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < maPeriod - 1) {
      result.push(NaN);
    } else {
      const ma = closes.slice(i - maPeriod + 1, i + 1).reduce((a, b) => a + b, 0) / maPeriod;
      result.push((closes[i] - ma) / ma);
    }
  }
  return result;
}

/**
 * Momentum Factor: Price momentum over period
 */
export function momentumFactor(prices: PriceData[], period: number = 20): number[] {
  const closes = prices.map(p => p.close);
  const result: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      result.push((closes[i] - closes[i - period]) / closes[i - period]);
    }
  }
  return result;
}

/**
 * Volatility Factor: Realized volatility
 */
export function volatilityFactor(prices: PriceData[], period: number = 20): number[] {
  const returns = prices.slice(1).map((p, i) => 
    Math.log(p.close / prices[i].close)
  );
  
  const result: number[] = [NaN];
  
  for (let i = 0; i < returns.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = returns.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / period;
      result.push(Math.sqrt(variance * 252)); // Annualized
    }
  }
  return result;
}

/**
 * Liquidity Factor: Volume-based liquidity measure
 */
export function liquidityFactor(prices: PriceData[], period: number = 20): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const volumes = prices.slice(i - period + 1, i + 1).map(p => p.volume);
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / period;
      const currentVolume = prices[i].volume;
      
      result.push(currentVolume / avgVolume);
    }
  }
  return result;
}

// ============= Microstructure Alpha Factors =============

/**
 * Order Imbalance Factor: Proxy using price-volume relationship
 */
export function orderImbalanceFactor(prices: PriceData[]): number[] {
  const result: number[] = [NaN];
  
  for (let i = 1; i < prices.length; i++) {
    const priceChange = prices[i].close - prices[i - 1].close;
    const volumeChange = prices[i].volume - prices[i - 1].volume;
    
    if (Math.abs(priceChange) > 0) {
      result.push((Math.sign(priceChange) * volumeChange) / Math.abs(priceChange));
    } else {
      result.push(0);
    }
  }
  return result;
}

/**
 * Price Impact Factor: Volume-adjusted price movement
 */
export function priceImpactFactor(prices: PriceData[], period: number = 10): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      let totalImpact = 0;
      for (let j = i - period + 1; j <= i; j++) {
        if (j > 0) {
          const priceChange = Math.abs(prices[j].close - prices[j - 1].close);
          const volume = prices[j].volume;
          totalImpact += volume > 0 ? priceChange / volume : 0;
        }
      }
      result.push(totalImpact / period);
    }
  }
  return result;
}

// ============= Statistical Arbitrage Factors =============

/**
 * Z-Score Factor: Standardized price deviation
 */
export function zScoreFactor(prices: PriceData[], period: number = 20): number[] {
  const closes = prices.map(p => p.close);
  const result: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const std = Math.sqrt(slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period);
      
      result.push(std > 0 ? (closes[i] - mean) / std : 0);
    }
  }
  return result;
}

/**
 * Correlation Factor: Price correlation with benchmark
 */
export function correlationFactor(prices: PriceData[], benchmark: number[], period: number = 60): number[] {
  const closes = prices.map(p => p.close);
  const result: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1 || i >= benchmark.length) {
      result.push(NaN);
    } else {
      const priceSlice = closes.slice(i - period + 1, i + 1);
      const benchSlice = benchmark.slice(i - period + 1, i + 1);
      
      result.push(calculateCorrelation(priceSlice, benchSlice));
    }
  }
  return result;
}

// ============= Machine Learning Features =============

/**
 * Feature Engineering: Create ML-ready features
 */
export function createMLFeatures(prices: PriceData[], lookback: number = 20): number[][] {
  const features: number[][] = [];
  
  for (let i = lookback; i < prices.length; i++) {
    const window = prices.slice(i - lookback, i);
    
    const feat: number[] = [
      // Price features
      window[window.length - 1].close / window[0].close - 1, // Return
      Math.max(...window.map(p => p.high)) / Math.min(...window.map(p => p.low)) - 1, // Range
      
      // Volume features
      window[window.length - 1].volume / (window.map(p => p.volume).reduce((a, b) => a + b, 0) / lookback),
      
      // Volatility
      calculateVolatility(window.map(p => p.close)),
      
      // Trend
      (window[window.length - 1].close - window[0].close) / lookback,
    ];
    
    features.push(feat);
  }
  
  return features;
}

/**
 * Rolling Beta Factor: Beta with respect to benchmark
 */
export function rollingBeta(prices: PriceData[], benchmark: number[], period: number = 60): number[] {
  const returns = prices.slice(1).map((p, i) => 
    (p.close - prices[i].close) / prices[i].close
  );
  const benchReturns = benchmark.slice(1).map((b, i) => 
    (b - benchmark[i]) / benchmark[i]
  );
  
  const result: number[] = [NaN];
  
  for (let i = 0; i < returns.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const retSlice = returns.slice(i - period + 1, i + 1);
      const benchSlice = benchReturns.slice(i - period + 1, i + 1);
      
      const covariance = calculateCovariance(retSlice, benchSlice);
      const benchVariance = calculateVariance(benchSlice);
      
      result.push(benchVariance > 0 ? covariance / benchVariance : 0);
    }
  }
  return result;
}

/**
 * Idiosyncratic Volatility Factor: Volatility unexplained by market
 */
export function idiosyncraticVolatility(prices: PriceData[], benchmark: number[], period: number = 60): number[] {
  const beta = rollingBeta(prices, benchmark, period);
  const returns = prices.slice(1).map((p, i) => 
    (p.close - prices[i].close) / prices[i].close
  );
  const benchReturns = benchmark.slice(1).map((b, i) => 
    (b - benchmark[i]) / benchmark[i]
  );
  
  const result: number[] = [NaN];
  
  for (let i = 0; i < returns.length; i++) {
    if (i < period - 1 || isNaN(beta[i + 1])) {
      result.push(NaN);
    } else {
      const residuals: number[] = [];
      for (let j = i - period + 1; j <= i; j++) {
        const expectedReturn = beta[i + 1] * benchReturns[j];
        residuals.push(returns[j] - expectedReturn);
      }
      
      const variance = residuals.reduce((sum, r) => sum + r * r, 0) / period;
      result.push(Math.sqrt(variance * 252)); // Annualized
    }
  }
  return result;
}

// ============= Helper Functions =============

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return NaN;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const denom = Math.sqrt(denomX * denomY);
  return denom > 0 ? numerator / denom : 0;
}

function calculateCovariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return NaN;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / n;
}

function calculateVariance(x: number[]): number {
  if (x.length === 0) return NaN;
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  return x.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / x.length;
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance * 252); // Annualized
}

/**
 * Factor Combination: Combine multiple alpha factors
 */
export function combineFactors(
  factors: number[][],
  weights: number[]
): number[] {
  if (factors.length === 0 || factors.length !== weights.length) {
    return [];
  }
  
  const length = factors[0].length;
  const result: number[] = [];
  
  for (let i = 0; i < length; i++) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let j = 0; j < factors.length; j++) {
      if (!isNaN(factors[j][i])) {
        weightedSum += factors[j][i] * weights[j];
        totalWeight += weights[j];
      }
    }
    
    result.push(totalWeight > 0 ? weightedSum / totalWeight : NaN);
  }
  
  return result;
}
