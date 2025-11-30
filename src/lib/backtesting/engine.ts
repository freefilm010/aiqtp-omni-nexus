/**
 * Backtesting Engine - Qlib-Inspired
 * Comprehensive backtesting framework with realistic simulation
 */

import { PriceData } from '../factors/technicalIndicators';

export interface BacktestConfig {
  initialCapital: number;
  commission: number; // Percentage fee per trade
  slippage: number; // Percentage price slippage
  positionSizing: 'fixed' | 'percent' | 'kelly' | 'volatility';
  positionSize: number; // Amount or percentage depending on sizing method
  maxPositions?: number;
  stopLoss?: number; // Percentage
  takeProfit?: number; // Percentage
  leverage?: number;
}

export interface Trade {
  timestamp: Date;
  symbol: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  commission: number;
  slippage: number;
  total: number;
  pnl?: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  entryTime: Date;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export interface BacktestResult {
  trades: Trade[];
  positions: Position[];
  equity: number[];
  timestamps: Date[];
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgHoldingPeriod: number;
}

export type SignalType = 'buy' | 'sell' | 'hold';

export interface Signal {
  timestamp: Date;
  symbol: string;
  signal: SignalType;
  strength: number; // 0-1
  reason?: string;
}

export class BacktestEngine {
  private config: BacktestConfig;
  private capital: number;
  private positions: Map<string, Position>;
  private trades: Trade[];
  private equity: number[];
  private timestamps: Date[];
  
  constructor(config: BacktestConfig) {
    this.config = config;
    this.capital = config.initialCapital;
    this.positions = new Map();
    this.trades = [];
    this.equity = [config.initialCapital];
    this.timestamps = [];
  }
  
  /**
   * Execute backtest with given price data and signal generator
   */
  async runBacktest(
    priceData: Map<string, PriceData[]>,
    signalGenerator: (symbol: string, prices: PriceData[], index: number) => Signal
  ): Promise<BacktestResult> {
    // Get all symbols and align timestamps
    const symbols = Array.from(priceData.keys());
    const maxLength = Math.max(...Array.from(priceData.values()).map(p => p.length));
    
    for (let i = 0; i < maxLength; i++) {
      const timestamp = priceData.get(symbols[0])?.[i]?.timestamp;
      if (!timestamp) continue;
      
      this.timestamps.push(timestamp);
      
      // Update current prices for all positions
      this.updatePositions(priceData, i);
      
      // Generate signals for each symbol
      for (const symbol of symbols) {
        const prices = priceData.get(symbol);
        if (!prices || i >= prices.length) continue;
        
        const signal = signalGenerator(symbol, prices, i);
        
        // Execute trades based on signals
        this.processSignal(signal, prices[i]);
      }
      
      // Check stop loss and take profit
      this.checkExitConditions(priceData, i);
      
      // Record equity
      const totalEquity = this.calculateTotalEquity(priceData, i);
      this.equity.push(totalEquity);
    }
    
    // Close all remaining positions
    this.closeAllPositions(priceData);
    
    return this.calculateResults();
  }
  
  private processSignal(signal: Signal, currentPrice: PriceData): void {
    const { symbol, signal: signalType, strength } = signal;
    
    if (signalType === 'buy' && !this.positions.has(symbol)) {
      this.openPosition(symbol, currentPrice, strength);
    } else if (signalType === 'sell' && this.positions.has(symbol)) {
      this.closePosition(symbol, currentPrice);
    }
  }
  
  private openPosition(symbol: string, priceData: PriceData, strength: number): void {
    const maxPositions = this.config.maxPositions || Infinity;
    if (this.positions.size >= maxPositions) return;
    
    const { quantity, cost } = this.calculatePositionSize(priceData.close, strength);
    
    if (cost > this.capital) return; // Not enough capital
    
    const slippageAmount = priceData.close * this.config.slippage;
    const entryPrice = priceData.close + slippageAmount;
    const commission = cost * this.config.commission;
    const totalCost = cost + commission + (slippageAmount * quantity);
    
    this.capital -= totalCost;
    
    this.positions.set(symbol, {
      symbol,
      quantity,
      entryPrice,
      entryTime: priceData.timestamp,
      currentPrice: priceData.close,
      marketValue: quantity * priceData.close,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0
    });
    
    this.trades.push({
      timestamp: priceData.timestamp,
      symbol,
      type: 'buy',
      price: entryPrice,
      quantity,
      commission,
      slippage: slippageAmount * quantity,
      total: totalCost
    });
  }
  
  private closePosition(symbol: string, priceData: PriceData): void {
    const position = this.positions.get(symbol);
    if (!position) return;
    
    const slippageAmount = priceData.close * this.config.slippage;
    const exitPrice = priceData.close - slippageAmount;
    const proceeds = position.quantity * exitPrice;
    const commission = proceeds * this.config.commission;
    const totalProceeds = proceeds - commission - (slippageAmount * position.quantity);
    
    const pnl = totalProceeds - (position.quantity * position.entryPrice);
    
    this.capital += totalProceeds;
    
    this.trades.push({
      timestamp: priceData.timestamp,
      symbol,
      type: 'sell',
      price: exitPrice,
      quantity: position.quantity,
      commission,
      slippage: slippageAmount * position.quantity,
      total: totalProceeds,
      pnl
    });
    
    this.positions.delete(symbol);
  }
  
  private calculatePositionSize(price: number, strength: number): { quantity: number; cost: number } {
    let quantity = 0;
    
    switch (this.config.positionSizing) {
      case 'fixed':
        quantity = this.config.positionSize;
        break;
      
      case 'percent':
        const positionValue = this.capital * (this.config.positionSize / 100) * strength;
        quantity = Math.floor(positionValue / price);
        break;
      
      case 'kelly':
        // Simplified Kelly criterion
        const winRate = 0.55; // Would be calculated from historical data
        const avgWinLoss = 1.5; // Would be calculated from historical data
        const kellyPercent = (winRate - ((1 - winRate) / avgWinLoss)) * strength;
        const kellyValue = this.capital * Math.max(0, Math.min(kellyPercent, 0.25));
        quantity = Math.floor(kellyValue / price);
        break;
      
      case 'volatility':
        // Risk-based position sizing
        const riskAmount = this.capital * (this.config.positionSize / 100);
        const volatility = 0.02; // Would be calculated from price data
        const positionRisk = price * volatility;
        quantity = Math.floor(riskAmount / positionRisk);
        break;
    }
    
    const leverage = this.config.leverage || 1;
    quantity = Math.floor(quantity * leverage);
    const cost = quantity * price;
    
    return { quantity, cost };
  }
  
  private updatePositions(priceData: Map<string, PriceData[]>, index: number): void {
    for (const [symbol, position] of this.positions) {
      const prices = priceData.get(symbol);
      if (!prices || index >= prices.length) continue;
      
      const currentPrice = prices[index].close;
      position.currentPrice = currentPrice;
      position.marketValue = position.quantity * currentPrice;
      position.unrealizedPnl = (currentPrice - position.entryPrice) * position.quantity;
      position.unrealizedPnlPercent = (currentPrice / position.entryPrice - 1) * 100;
    }
  }
  
  private checkExitConditions(priceData: Map<string, PriceData[]>, index: number): void {
    for (const [symbol, position] of this.positions) {
      const prices = priceData.get(symbol);
      if (!prices || index >= prices.length) continue;
      
      // Stop loss
      if (this.config.stopLoss && position.unrealizedPnlPercent <= -this.config.stopLoss) {
        this.closePosition(symbol, prices[index]);
        continue;
      }
      
      // Take profit
      if (this.config.takeProfit && position.unrealizedPnlPercent >= this.config.takeProfit) {
        this.closePosition(symbol, prices[index]);
      }
    }
  }
  
  private calculateTotalEquity(priceData: Map<string, PriceData[]>, index: number): number {
    let totalValue = this.capital;
    
    for (const [symbol, position] of this.positions) {
      const prices = priceData.get(symbol);
      if (prices && index < prices.length) {
        totalValue += position.quantity * prices[index].close;
      }
    }
    
    return totalValue;
  }
  
  private closeAllPositions(priceData: Map<string, PriceData[]>): void {
    const symbols = Array.from(this.positions.keys());
    for (const symbol of symbols) {
      const prices = priceData.get(symbol);
      if (prices && prices.length > 0) {
        this.closePosition(symbol, prices[prices.length - 1]);
      }
    }
  }
  
  private calculateResults(): BacktestResult {
    const finalCapital = this.capital;
    const totalReturn = (finalCapital / this.config.initialCapital - 1) * 100;
    
    // Calculate time period
    const daysDiff = this.timestamps.length > 0
      ? (this.timestamps[this.timestamps.length - 1].getTime() - this.timestamps[0].getTime()) / (1000 * 60 * 60 * 24)
      : 1;
    const years = daysDiff / 365;
    const annualizedReturn = years > 0 ? (Math.pow(finalCapital / this.config.initialCapital, 1 / years) - 1) * 100 : 0;
    
    // Calculate returns for each period
    const returns = this.equity.slice(1).map((eq, i) => (eq - this.equity[i]) / this.equity[i]);
    
    // Sharpe Ratio (assuming 2% risk-free rate)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const returnStd = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = returnStd > 0 ? ((avgReturn * 252 - 0.02) / (returnStd * Math.sqrt(252))) : 0;
    
    // Sortino Ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideStd = downsideReturns.length > 0
      ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length)
      : returnStd;
    const sortinoRatio = downsideStd > 0 ? ((avgReturn * 252 - 0.02) / (downsideStd * Math.sqrt(252))) : 0;
    
    // Max Drawdown
    let maxDrawdown = 0;
    let peak = this.equity[0];
    let drawdownStart = 0;
    let maxDrawdownDuration = 0;
    
    for (let i = 0; i < this.equity.length; i++) {
      if (this.equity[i] > peak) {
        peak = this.equity[i];
        drawdownStart = i;
      }
      const drawdown = (peak - this.equity[i]) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownDuration = i - drawdownStart;
      }
    }
    
    // Trade statistics
    const completedTrades = this.trades.filter(t => t.type === 'sell');
    const winningTrades = completedTrades.filter(t => t.pnl && t.pnl > 0);
    const losingTrades = completedTrades.filter(t => t.pnl && t.pnl <= 0);
    
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    return {
      trades: this.trades,
      positions: Array.from(this.positions.values()),
      equity: this.equity,
      timestamps: this.timestamps,
      finalCapital,
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      maxDrawdownDuration,
      winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      totalTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      avgWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0,
      avgHoldingPeriod: 0 // Would calculate based on entry/exit times
    };
  }
}

/**
 * Walk-Forward Analysis: Split data into training and testing periods
 */
export async function walkForwardAnalysis(
  priceData: Map<string, PriceData[]>,
  trainPeriod: number,
  testPeriod: number,
  config: BacktestConfig,
  signalGenerator: (symbol: string, prices: PriceData[], index: number) => Signal
): Promise<BacktestResult[]> {
  const results: BacktestResult[] = [];
  const maxLength = Math.max(...Array.from(priceData.values()).map(p => p.length));
  
  for (let start = 0; start + trainPeriod + testPeriod <= maxLength; start += testPeriod) {
    const trainData = new Map<string, PriceData[]>();
    const testData = new Map<string, PriceData[]>();
    
    for (const [symbol, prices] of priceData) {
      trainData.set(symbol, prices.slice(start, start + trainPeriod));
      testData.set(symbol, prices.slice(start + trainPeriod, start + trainPeriod + testPeriod));
    }
    
    // Run backtest on test period
    const engine = new BacktestEngine(config);
    const result = await engine.runBacktest(testData, signalGenerator);
    results.push(result);
  }
  
  return results;
}
