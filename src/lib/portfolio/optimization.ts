/**
 * Portfolio Optimization - Qlib-Inspired
 * Modern Portfolio Theory and advanced optimization techniques
 */

export interface Asset {
  symbol: string;
  expectedReturn: number;
  volatility: number;
  weight: number;
}

export interface PortfolioMetrics {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  weights: Map<string, number>;
}

export interface OptimizationConstraints {
  minWeight?: number;
  maxWeight?: number;
  targetReturn?: number;
  targetVolatility?: number;
  riskFreeRate?: number;
}

/**
 * Calculate portfolio expected return
 */
export function calculatePortfolioReturn(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + (asset.weight * asset.expectedReturn), 0);
}

/**
 * Calculate portfolio volatility (requires correlation matrix)
 */
export function calculatePortfolioVolatility(
  assets: Asset[],
  correlationMatrix: number[][]
): number {
  let variance = 0;
  
  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const weight_i = assets[i].weight;
      const weight_j = assets[j].weight;
      const vol_i = assets[i].volatility;
      const vol_j = assets[j].volatility;
      const correlation = correlationMatrix[i][j];
      
      variance += weight_i * weight_j * vol_i * vol_j * correlation;
    }
  }
  
  return Math.sqrt(variance);
}

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(
  expectedReturn: number,
  volatility: number,
  riskFreeRate: number = 0.02
): number {
  return volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;
}

/**
 * Mean-Variance Optimization (Markowitz)
 * Uses numerical optimization to find optimal weights
 */
export function meanVarianceOptimization(
  assets: Asset[],
  correlationMatrix: number[][],
  constraints: OptimizationConstraints = {}
): PortfolioMetrics {
  const n = assets.length;
  const minWeight = constraints.minWeight ?? 0;
  const maxWeight = constraints.maxWeight ?? 1;
  const riskFreeRate = constraints.riskFreeRate ?? 0.02;
  
  // Generate random portfolios and find best Sharpe ratio
  let bestSharpe = -Infinity;
  let bestWeights: number[] = [];
  
  const iterations = 10000;
  for (let iter = 0; iter < iterations; iter++) {
    // Generate random weights
    const weights = Array(n).fill(0).map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / sum);
    
    // Check constraints
    const validWeights = normalizedWeights.every(w => w >= minWeight && w <= maxWeight);
    if (!validWeights) continue;
    
    // Apply weights to assets
    const testAssets = assets.map((asset, i) => ({
      ...asset,
      weight: normalizedWeights[i]
    }));
    
    const expectedReturn = calculatePortfolioReturn(testAssets);
    const volatility = calculatePortfolioVolatility(testAssets, correlationMatrix);
    const sharpe = calculateSharpeRatio(expectedReturn, volatility, riskFreeRate);
    
    if (sharpe > bestSharpe) {
      bestSharpe = sharpe;
      bestWeights = normalizedWeights;
    }
  }
  
  const optimizedAssets = assets.map((asset, i) => ({
    ...asset,
    weight: bestWeights[i] || 1 / n
  }));
  
  const expectedReturn = calculatePortfolioReturn(optimizedAssets);
  const volatility = calculatePortfolioVolatility(optimizedAssets, correlationMatrix);
  const sharpeRatio = calculateSharpeRatio(expectedReturn, volatility, riskFreeRate);
  
  const weights = new Map<string, number>();
  optimizedAssets.forEach(asset => weights.set(asset.symbol, asset.weight));
  
  return {
    expectedReturn,
    volatility,
    sharpeRatio,
    weights
  };
}

/**
 * Equal Weight Portfolio
 */
export function equalWeightPortfolio(assets: Asset[]): PortfolioMetrics {
  const weight = 1 / assets.length;
  const weightedAssets = assets.map(asset => ({ ...asset, weight }));
  
  const expectedReturn = calculatePortfolioReturn(weightedAssets);
  const correlationMatrix = createIdentityMatrix(assets.length);
  const volatility = calculatePortfolioVolatility(weightedAssets, correlationMatrix);
  const sharpeRatio = calculateSharpeRatio(expectedReturn, volatility);
  
  const weights = new Map<string, number>();
  weightedAssets.forEach(asset => weights.set(asset.symbol, weight));
  
  return { expectedReturn, volatility, sharpeRatio, weights };
}

/**
 * Risk Parity Portfolio
 */
export function riskParityPortfolio(
  assets: Asset[],
  correlationMatrix: number[][]
): PortfolioMetrics {
  const n = assets.length;
  
  // Initialize with equal weights
  let weights = Array(n).fill(1 / n);
  
  // Iteratively adjust weights to equalize risk contribution
  const maxIterations = 100;
  const tolerance = 0.0001;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const riskContributions = calculateRiskContributions(assets, weights, correlationMatrix);
    const avgRiskContribution = riskContributions.reduce((a, b) => a + b, 0) / n;
    
    // Adjust weights
    const newWeights = weights.map((w, i) => {
      const adjustment = avgRiskContribution / riskContributions[i];
      return w * adjustment;
    });
    
    // Normalize
    const sum = newWeights.reduce((a, b) => a + b, 0);
    weights = newWeights.map(w => w / sum);
    
    // Check convergence
    const maxDiff = Math.max(...weights.map((w, i) => Math.abs(w - newWeights[i] / sum)));
    if (maxDiff < tolerance) break;
  }
  
  const weightedAssets = assets.map((asset, i) => ({
    ...asset,
    weight: weights[i]
  }));
  
  const expectedReturn = calculatePortfolioReturn(weightedAssets);
  const volatility = calculatePortfolioVolatility(weightedAssets, correlationMatrix);
  const sharpeRatio = calculateSharpeRatio(expectedReturn, volatility);
  
  const weightsMap = new Map<string, number>();
  weightedAssets.forEach(asset => weightsMap.set(asset.symbol, asset.weight));
  
  return { expectedReturn, volatility, sharpeRatio, weights: weightsMap };
}

/**
 * Minimum Variance Portfolio
 */
export function minimumVariancePortfolio(
  assets: Asset[],
  correlationMatrix: number[][],
  constraints: OptimizationConstraints = {}
): PortfolioMetrics {
  const n = assets.length;
  const minWeight = constraints.minWeight ?? 0;
  const maxWeight = constraints.maxWeight ?? 1;
  
  let minVolatility = Infinity;
  let bestWeights: number[] = [];
  
  const iterations = 10000;
  for (let iter = 0; iter < iterations; iter++) {
    const weights = Array(n).fill(0).map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / sum);
    
    const validWeights = normalizedWeights.every(w => w >= minWeight && w <= maxWeight);
    if (!validWeights) continue;
    
    const testAssets = assets.map((asset, i) => ({
      ...asset,
      weight: normalizedWeights[i]
    }));
    
    const volatility = calculatePortfolioVolatility(testAssets, correlationMatrix);
    
    if (volatility < minVolatility) {
      minVolatility = volatility;
      bestWeights = normalizedWeights;
    }
  }
  
  const optimizedAssets = assets.map((asset, i) => ({
    ...asset,
    weight: bestWeights[i] || 1 / n
  }));
  
  const expectedReturn = calculatePortfolioReturn(optimizedAssets);
  const volatility = calculatePortfolioVolatility(optimizedAssets, correlationMatrix);
  const sharpeRatio = calculateSharpeRatio(expectedReturn, volatility);
  
  const weights = new Map<string, number>();
  optimizedAssets.forEach(asset => weights.set(asset.symbol, asset.weight));
  
  return { expectedReturn, volatility, sharpeRatio, weights };
}

/**
 * Maximum Diversification Portfolio
 */
export function maximumDiversificationPortfolio(
  assets: Asset[],
  correlationMatrix: number[][]
): PortfolioMetrics {
  const n = assets.length;
  
  let maxDiversification = -Infinity;
  let bestWeights: number[] = [];
  
  const iterations = 10000;
  for (let iter = 0; iter < iterations; iter++) {
    const weights = Array(n).fill(0).map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / sum);
    
    const testAssets = assets.map((asset, i) => ({
      ...asset,
      weight: normalizedWeights[i]
    }));
    
    // Weighted average volatility
    const weightedVol = testAssets.reduce((sum, a) => sum + a.weight * a.volatility, 0);
    const portfolioVol = calculatePortfolioVolatility(testAssets, correlationMatrix);
    
    const diversificationRatio = portfolioVol > 0 ? weightedVol / portfolioVol : 0;
    
    if (diversificationRatio > maxDiversification) {
      maxDiversification = diversificationRatio;
      bestWeights = normalizedWeights;
    }
  }
  
  const optimizedAssets = assets.map((asset, i) => ({
    ...asset,
    weight: bestWeights[i] || 1 / n
  }));
  
  const expectedReturn = calculatePortfolioReturn(optimizedAssets);
  const volatility = calculatePortfolioVolatility(optimizedAssets, correlationMatrix);
  const sharpeRatio = calculateSharpeRatio(expectedReturn, volatility);
  
  const weights = new Map<string, number>();
  optimizedAssets.forEach(asset => weights.set(asset.symbol, asset.weight));
  
  return { expectedReturn, volatility, sharpeRatio, weights };
}

/**
 * Black-Litterman Model
 * Combines market equilibrium with investor views
 */
export function blackLittermanOptimization(
  assets: Asset[],
  correlationMatrix: number[][],
  marketCap: number[],
  investorViews: { assetIndex: number; expectedReturn: number; confidence: number }[],
  riskAversion: number = 2.5
): PortfolioMetrics {
  // Simplified Black-Litterman implementation
  const n = assets.length;
  
  // Calculate market-implied equilibrium returns
  const marketWeights = marketCap.map(cap => cap / marketCap.reduce((a, b) => a + b, 0));
  
  // Adjust for investor views (simplified)
  const adjustedReturns = assets.map((asset, i) => {
    const view = investorViews.find(v => v.assetIndex === i);
    if (view) {
      return asset.expectedReturn * (1 - view.confidence) + view.expectedReturn * view.confidence;
    }
    return asset.expectedReturn;
  });
  
  // Optimize with adjusted returns
  const adjustedAssets = assets.map((asset, i) => ({
    ...asset,
    expectedReturn: adjustedReturns[i]
  }));
  
  return meanVarianceOptimization(adjustedAssets, correlationMatrix, { riskFreeRate: 0.02 });
}

// ============= Helper Functions =============

function calculateRiskContributions(
  assets: Asset[],
  weights: number[],
  correlationMatrix: number[][]
): number[] {
  const n = assets.length;
  const contributions: number[] = [];
  
  // Portfolio variance
  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += weights[i] * weights[j] * assets[i].volatility * assets[j].volatility * correlationMatrix[i][j];
    }
  }
  
  const portfolioVol = Math.sqrt(portfolioVariance);
  
  // Marginal contribution to risk
  for (let i = 0; i < n; i++) {
    let marginalContribution = 0;
    for (let j = 0; j < n; j++) {
      marginalContribution += weights[j] * assets[i].volatility * assets[j].volatility * correlationMatrix[i][j];
    }
    contributions.push(weights[i] * marginalContribution / portfolioVol);
  }
  
  return contributions;
}

function createIdentityMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      matrix[i][j] = i === j ? 1 : 0;
    }
  }
  return matrix;
}

/**
 * Calculate correlation matrix from return series
 */
export function calculateCorrelationMatrix(returnSeries: number[][]): number[][] {
  const n = returnSeries.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = calculateCorrelation(returnSeries[i], returnSeries[j]);
      }
    }
  }
  
  return matrix;
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
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
