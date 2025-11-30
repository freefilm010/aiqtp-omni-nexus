/**
 * Portfolio Analytics - Qlib-Inspired
 * Advanced portfolio analysis and risk metrics
 */

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  weight: number;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalReturn: number;
  dailyReturn: number;
  volatility: number;
  beta: number;
  alpha: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  valueAtRisk: number; // VaR 95%
  conditionalVaR: number; // CVaR/Expected Shortfall
  informationRatio: number;
  treynorRatio: number;
  calmarRatio: number;
}

export interface RiskMetrics {
  volatility: number;
  beta: number;
  correlation: number;
  trackingError: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  conditionalVaR: number;
  maxDrawdown: number;
  downsideDeviation: number;
}

export interface PerformanceAttribution {
  assetAllocation: number; // Return from asset allocation decisions
  stockSelection: number; // Return from stock selection
  interaction: number; // Interaction effect
  totalActiveReturn: number;
}

/**
 * Calculate comprehensive portfolio analytics
 */
export function calculatePortfolioAnalytics(
  holdings: PortfolioHolding[],
  historicalReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number = 0.02
): PortfolioAnalytics {
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalReturn = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  
  // Daily return
  const dailyReturn = historicalReturns.length > 0 ? historicalReturns[historicalReturns.length - 1] * 100 : 0;
  
  // Volatility (annualized)
  const volatility = calculateVolatility(historicalReturns) * Math.sqrt(252) * 100;
  
  // Beta
  const beta = calculateBeta(historicalReturns, benchmarkReturns);
  
  // Alpha (annualized)
  const avgReturn = historicalReturns.reduce((a, b) => a + b, 0) / historicalReturns.length;
  const avgBenchmark = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
  const alpha = ((avgReturn - (riskFreeRate / 252 + beta * (avgBenchmark - riskFreeRate / 252))) * 252) * 100;
  
  // Sharpe Ratio (annualized)
  const excessReturn = avgReturn - riskFreeRate / 252;
  const sharpeRatio = calculateVolatility(historicalReturns) > 0
    ? (excessReturn / calculateVolatility(historicalReturns)) * Math.sqrt(252)
    : 0;
  
  // Sortino Ratio (annualized)
  const downsideReturns = historicalReturns.filter(r => r < 0);
  const downsideDeviation = downsideReturns.length > 0
    ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length)
    : calculateVolatility(historicalReturns);
  const sortinoRatio = downsideDeviation > 0
    ? (excessReturn / downsideDeviation) * Math.sqrt(252)
    : 0;
  
  // Max Drawdown
  const maxDrawdown = calculateMaxDrawdown(historicalReturns) * 100;
  
  // Value at Risk (95%)
  const valueAtRisk = calculateVaR(historicalReturns, 0.95) * 100;
  
  // Conditional VaR (Expected Shortfall)
  const conditionalVaR = calculateCVaR(historicalReturns, 0.95) * 100;
  
  // Information Ratio
  const trackingError = calculateTrackingError(historicalReturns, benchmarkReturns);
  const activeReturn = avgReturn - avgBenchmark;
  const informationRatio = trackingError > 0 ? (activeReturn / trackingError) * Math.sqrt(252) : 0;
  
  // Treynor Ratio (annualized)
  const treynorRatio = beta !== 0 ? ((avgReturn * 252 - riskFreeRate) / beta) * 100 : 0;
  
  // Calmar Ratio (annualized return / max drawdown)
  const calmarRatio = maxDrawdown !== 0 ? (avgReturn * 252 * 100) / Math.abs(maxDrawdown) : 0;
  
  return {
    totalValue,
    totalCost,
    totalPnl,
    totalReturn,
    dailyReturn,
    volatility,
    beta,
    alpha,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    valueAtRisk,
    conditionalVaR,
    informationRatio,
    treynorRatio,
    calmarRatio
  };
}

/**
 * Calculate risk metrics
 */
export function calculateRiskMetrics(
  returns: number[],
  benchmarkReturns: number[]
): RiskMetrics {
  const volatility = calculateVolatility(returns) * Math.sqrt(252) * 100;
  const beta = calculateBeta(returns, benchmarkReturns);
  const correlation = calculateCorrelation(returns, benchmarkReturns);
  const trackingError = calculateTrackingError(returns, benchmarkReturns) * Math.sqrt(252) * 100;
  
  const valueAtRisk95 = calculateVaR(returns, 0.95) * 100;
  const valueAtRisk99 = calculateVaR(returns, 0.99) * 100;
  const conditionalVaR = calculateCVaR(returns, 0.95) * 100;
  
  const maxDrawdown = calculateMaxDrawdown(returns) * 100;
  
  const downsideReturns = returns.filter(r => r < 0);
  const downsideDeviation = downsideReturns.length > 0
    ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length) * Math.sqrt(252) * 100
    : volatility;
  
  return {
    volatility,
    beta,
    correlation,
    trackingError,
    valueAtRisk95,
    valueAtRisk99,
    conditionalVaR,
    maxDrawdown,
    downsideDeviation
  };
}

/**
 * Performance Attribution Analysis
 */
export function performanceAttribution(
  portfolioWeights: Map<string, number>,
  portfolioReturns: Map<string, number>,
  benchmarkWeights: Map<string, number>,
  benchmarkReturns: Map<string, number>
): PerformanceAttribution {
  let assetAllocation = 0;
  let stockSelection = 0;
  let interaction = 0;
  
  const symbols = new Set([...portfolioWeights.keys(), ...benchmarkWeights.keys()]);
  
  for (const symbol of symbols) {
    const wp = portfolioWeights.get(symbol) || 0;
    const wb = benchmarkWeights.get(symbol) || 0;
    const rp = portfolioReturns.get(symbol) || 0;
    const rb = benchmarkReturns.get(symbol) || 0;
    
    // Asset Allocation Effect: (wp - wb) * rb
    assetAllocation += (wp - wb) * rb;
    
    // Stock Selection Effect: wb * (rp - rb)
    stockSelection += wb * (rp - rb);
    
    // Interaction Effect: (wp - wb) * (rp - rb)
    interaction += (wp - wb) * (rp - rb);
  }
  
  const totalActiveReturn = assetAllocation + stockSelection + interaction;
  
  return {
    assetAllocation: assetAllocation * 100,
    stockSelection: stockSelection * 100,
    interaction: interaction * 100,
    totalActiveReturn: totalActiveReturn * 100
  };
}

/**
 * Risk Decomposition: Contribution of each asset to portfolio risk
 */
export function riskDecomposition(
  holdings: PortfolioHolding[],
  correlationMatrix: number[][],
  returns: Map<string, number[]>
): Map<string, { contribution: number; percentage: number }> {
  const result = new Map<string, { contribution: number; percentage: number }>();
  
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const weights = holdings.map(h => h.marketValue / totalValue);
  
  // Calculate portfolio variance
  let portfolioVariance = 0;
  for (let i = 0; i < holdings.length; i++) {
    for (let j = 0; j < holdings.length; j++) {
      const returnsI = returns.get(holdings[i].symbol) || [];
      const returnsJ = returns.get(holdings[j].symbol) || [];
      
      const volI = calculateVolatility(returnsI);
      const volJ = calculateVolatility(returnsJ);
      const corr = correlationMatrix[i][j];
      
      portfolioVariance += weights[i] * weights[j] * volI * volJ * corr;
    }
  }
  
  const portfolioVol = Math.sqrt(portfolioVariance);
  
  // Calculate marginal contribution to risk for each asset
  for (let i = 0; i < holdings.length; i++) {
    let marginalContribution = 0;
    const returnsI = returns.get(holdings[i].symbol) || [];
    const volI = calculateVolatility(returnsI);
    
    for (let j = 0; j < holdings.length; j++) {
      const returnsJ = returns.get(holdings[j].symbol) || [];
      const volJ = calculateVolatility(returnsJ);
      const corr = correlationMatrix[i][j];
      
      marginalContribution += weights[j] * volI * volJ * corr;
    }
    
    const contribution = weights[i] * marginalContribution / portfolioVol;
    const percentage = portfolioVol > 0 ? (contribution / portfolioVol) * 100 : 0;
    
    result.set(holdings[i].symbol, {
      contribution: contribution * 100,
      percentage
    });
  }
  
  return result;
}

// ============= Helper Functions =============

function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function calculateBeta(returns: number[], benchmarkReturns: number[]): number {
  if (returns.length !== benchmarkReturns.length || returns.length < 2) return 1;
  
  const covariance = calculateCovariance(returns, benchmarkReturns);
  const benchmarkVariance = calculateVariance(benchmarkReturns);
  
  return benchmarkVariance > 0 ? covariance / benchmarkVariance : 1;
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  
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
  if (x.length !== y.length || x.length < 2) return 0;
  
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / n;
}

function calculateVariance(x: number[]): number {
  if (x.length < 2) return 0;
  
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  return x.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / x.length;
}

function calculateTrackingError(returns: number[], benchmarkReturns: number[]): number {
  if (returns.length !== benchmarkReturns.length) return 0;
  
  const trackingDiff = returns.map((r, i) => r - benchmarkReturns[i]);
  return calculateVolatility(trackingDiff);
}

function calculateMaxDrawdown(returns: number[]): number {
  let maxDrawdown = 0;
  let peak = 1;
  let wealth = 1;
  
  for (const ret of returns) {
    wealth *= (1 + ret);
    if (wealth > peak) {
      peak = wealth;
    }
    const drawdown = (peak - wealth) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

function calculateVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  
  return Math.abs(sorted[index] || 0);
}

function calculateCVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoffIndex = Math.floor((1 - confidence) * sorted.length);
  const tailReturns = sorted.slice(0, cutoffIndex + 1);
  
  if (tailReturns.length === 0) return 0;
  
  return Math.abs(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length);
}

/**
 * Calculate rolling metrics over time
 */
export function calculateRollingMetrics(
  returns: number[],
  window: number
): {
  rollingReturn: number[];
  rollingVolatility: number[];
  rollingSharpe: number[];
} {
  const rollingReturn: number[] = [];
  const rollingVolatility: number[] = [];
  const rollingSharpe: number[] = [];
  
  for (let i = window; i <= returns.length; i++) {
    const windowReturns = returns.slice(i - window, i);
    
    const avgReturn = windowReturns.reduce((a, b) => a + b, 0) / window;
    const vol = calculateVolatility(windowReturns);
    const sharpe = vol > 0 ? avgReturn / vol : 0;
    
    rollingReturn.push(avgReturn * 100);
    rollingVolatility.push(vol * Math.sqrt(252) * 100);
    rollingSharpe.push(sharpe * Math.sqrt(252));
  }
  
  return { rollingReturn, rollingVolatility, rollingSharpe };
}
