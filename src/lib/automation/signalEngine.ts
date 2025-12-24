/**
 * Signal Engine - Automated Trading Signal Generation
 * Multi-factor signals, alerts, and automated execution logic
 */

import { PriceData } from '../factors/technicalIndicators';

export type SignalType = 'buy' | 'sell' | 'hold' | 'strong_buy' | 'strong_sell';
export type SignalStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';
export type SignalTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface TradingSignal {
  id: string;
  symbol: string;
  type: SignalType;
  strength: SignalStrength;
  timeframe: SignalTimeframe;
  price: number;
  timestamp: Date;
  confidence: number;
  factors: SignalFactor[];
  targetPrice: number;
  stopLoss: number;
  riskReward: number;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface SignalFactor {
  name: string;
  type: 'technical' | 'fundamental' | 'sentiment' | 'pattern' | 'ml';
  signal: SignalType;
  weight: number;
  value: number;
  threshold: number;
}

export interface Alert {
  id: string;
  type: 'price' | 'indicator' | 'pattern' | 'signal' | 'news';
  condition: AlertCondition;
  symbol: string;
  isTriggered: boolean;
  triggeredAt?: Date;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'crosses_above' | 'crosses_below';
  value: number;
}

export interface AutomatedRule {
  id: string;
  name: string;
  isActive: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  executionCount: number;
  lastExecuted?: Date;
}

export interface RuleCondition {
  type: 'signal' | 'price' | 'indicator' | 'time' | 'portfolio';
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface RuleAction {
  type: 'buy' | 'sell' | 'alert' | 'rebalance' | 'hedge' | 'stop_loss' | 'take_profit';
  params: Record<string, any>;
}

// ============= Signal Generator =============

export class SignalGenerator {
  private factors: SignalFactor[] = [];
  private signals: TradingSignal[] = [];
  private alerts: Alert[] = [];

  constructor() {
    this.initializeDefaultFactors();
  }

  private initializeDefaultFactors(): void {
    this.factors = [
      // Technical Factors
      { name: 'RSI', type: 'technical', signal: 'hold', weight: 0.15, value: 50, threshold: 30 },
      { name: 'MACD', type: 'technical', signal: 'hold', weight: 0.15, value: 0, threshold: 0 },
      { name: 'Moving Average Crossover', type: 'technical', signal: 'hold', weight: 0.12, value: 0, threshold: 0 },
      { name: 'Bollinger Bands', type: 'technical', signal: 'hold', weight: 0.10, value: 0.5, threshold: 0.2 },
      { name: 'Volume', type: 'technical', signal: 'hold', weight: 0.08, value: 1, threshold: 1.5 },
      { name: 'ADX', type: 'technical', signal: 'hold', weight: 0.08, value: 20, threshold: 25 },
      
      // Pattern Factors
      { name: 'Candlestick Pattern', type: 'pattern', signal: 'hold', weight: 0.10, value: 0, threshold: 0.7 },
      { name: 'Chart Pattern', type: 'pattern', signal: 'hold', weight: 0.08, value: 0, threshold: 0.7 },
      
      // ML Factors
      { name: 'ML Prediction', type: 'ml', signal: 'hold', weight: 0.14, value: 0.5, threshold: 0.6 },
    ];
  }

  generateSignal(
    symbol: string,
    prices: PriceData[],
    timeframe: SignalTimeframe,
    mlPrediction?: number
  ): TradingSignal {
    const currentPrice = prices[prices.length - 1].close;
    const updatedFactors = this.calculateFactors(prices, mlPrediction);
    
    // Calculate weighted signal score
    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;
    
    for (const factor of updatedFactors) {
      totalWeight += factor.weight;
      if (factor.signal === 'buy' || factor.signal === 'strong_buy') {
        bullishScore += factor.weight * (factor.signal === 'strong_buy' ? 1.5 : 1);
      } else if (factor.signal === 'sell' || factor.signal === 'strong_sell') {
        bearishScore += factor.weight * (factor.signal === 'strong_sell' ? 1.5 : 1);
      }
    }
    
    const netScore = (bullishScore - bearishScore) / totalWeight;
    
    // Determine signal type
    let type: SignalType;
    let strength: SignalStrength;
    
    if (netScore > 0.6) {
      type = 'strong_buy';
      strength = 'very_strong';
    } else if (netScore > 0.3) {
      type = 'buy';
      strength = 'strong';
    } else if (netScore > 0.1) {
      type = 'buy';
      strength = 'moderate';
    } else if (netScore < -0.6) {
      type = 'strong_sell';
      strength = 'very_strong';
    } else if (netScore < -0.3) {
      type = 'sell';
      strength = 'strong';
    } else if (netScore < -0.1) {
      type = 'sell';
      strength = 'moderate';
    } else {
      type = 'hold';
      strength = 'weak';
    }
    
    // Calculate targets
    const atr = this.calculateATR(prices, 14);
    const volatility = atr / currentPrice;
    
    let targetPrice: number;
    let stopLoss: number;
    
    if (type === 'buy' || type === 'strong_buy') {
      targetPrice = currentPrice * (1 + volatility * 2);
      stopLoss = currentPrice * (1 - volatility);
    } else if (type === 'sell' || type === 'strong_sell') {
      targetPrice = currentPrice * (1 - volatility * 2);
      stopLoss = currentPrice * (1 + volatility);
    } else {
      targetPrice = currentPrice;
      stopLoss = currentPrice * 0.95;
    }
    
    const riskReward = Math.abs(targetPrice - currentPrice) / Math.abs(currentPrice - stopLoss);
    const confidence = Math.abs(netScore);
    
    const signal: TradingSignal = {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      type,
      strength,
      timeframe,
      price: currentPrice,
      timestamp: new Date(),
      confidence,
      factors: updatedFactors,
      targetPrice,
      stopLoss,
      riskReward,
      expiresAt: this.calculateExpiry(timeframe),
      metadata: {
        netScore,
        bullishScore,
        bearishScore,
        volatility
      }
    };
    
    this.signals.push(signal);
    return signal;
  }

  private calculateFactors(prices: PriceData[], mlPrediction?: number): SignalFactor[] {
    const closes = prices.map(p => p.close);
    const highs = prices.map(p => p.high);
    const lows = prices.map(p => p.low);
    const volumes = prices.map(p => p.volume);
    const n = closes.length;
    
    const updatedFactors: SignalFactor[] = [];
    
    // RSI
    const rsi = this.calculateRSI(closes, 14);
    let rsiSignal: SignalType = 'hold';
    if (rsi < 30) rsiSignal = 'strong_buy';
    else if (rsi < 40) rsiSignal = 'buy';
    else if (rsi > 70) rsiSignal = 'strong_sell';
    else if (rsi > 60) rsiSignal = 'sell';
    updatedFactors.push({ name: 'RSI', type: 'technical', signal: rsiSignal, weight: 0.15, value: rsi, threshold: 30 });
    
    // MACD
    const macd = this.calculateMACD(closes);
    let macdSignal: SignalType = 'hold';
    if (macd.histogram > 0 && macd.macd > macd.signal) macdSignal = 'buy';
    if (macd.histogram < 0 && macd.macd < macd.signal) macdSignal = 'sell';
    if (macd.histogram > 0.5) macdSignal = 'strong_buy';
    if (macd.histogram < -0.5) macdSignal = 'strong_sell';
    updatedFactors.push({ name: 'MACD', type: 'technical', signal: macdSignal, weight: 0.15, value: macd.histogram, threshold: 0 });
    
    // Moving Average Crossover
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    let maSignal: SignalType = 'hold';
    if (sma20 > sma50 * 1.02) maSignal = 'buy';
    if (sma20 < sma50 * 0.98) maSignal = 'sell';
    updatedFactors.push({ name: 'Moving Average Crossover', type: 'technical', signal: maSignal, weight: 0.12, value: (sma20 - sma50) / sma50, threshold: 0 });
    
    // Bollinger Bands
    const bb = this.calculateBollingerBands(closes, 20, 2);
    const currentPrice = closes[n - 1];
    let bbSignal: SignalType = 'hold';
    const bbPosition = (currentPrice - bb.lower) / (bb.upper - bb.lower);
    if (bbPosition < 0.2) bbSignal = 'buy';
    if (bbPosition > 0.8) bbSignal = 'sell';
    if (bbPosition < 0.05) bbSignal = 'strong_buy';
    if (bbPosition > 0.95) bbSignal = 'strong_sell';
    updatedFactors.push({ name: 'Bollinger Bands', type: 'technical', signal: bbSignal, weight: 0.10, value: bbPosition, threshold: 0.2 });
    
    // Volume
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volumeRatio = volumes[n - 1] / avgVolume;
    let volumeSignal: SignalType = 'hold';
    if (volumeRatio > 2 && closes[n - 1] > closes[n - 2]) volumeSignal = 'buy';
    if (volumeRatio > 2 && closes[n - 1] < closes[n - 2]) volumeSignal = 'sell';
    updatedFactors.push({ name: 'Volume', type: 'technical', signal: volumeSignal, weight: 0.08, value: volumeRatio, threshold: 1.5 });
    
    // ADX
    const adx = this.calculateADX(highs, lows, closes, 14);
    let adxSignal: SignalType = 'hold';
    if (adx.adx > 25 && adx.plusDI > adx.minusDI) adxSignal = 'buy';
    if (adx.adx > 25 && adx.plusDI < adx.minusDI) adxSignal = 'sell';
    updatedFactors.push({ name: 'ADX', type: 'technical', signal: adxSignal, weight: 0.08, value: adx.adx, threshold: 25 });
    
    // Pattern signals (simplified)
    let patternSignal: SignalType = 'hold';
    const pattern = this.detectSimplePattern(prices.slice(-5));
    if (pattern === 'bullish') patternSignal = 'buy';
    if (pattern === 'bearish') patternSignal = 'sell';
    updatedFactors.push({ name: 'Candlestick Pattern', type: 'pattern', signal: patternSignal, weight: 0.10, value: pattern === 'bullish' ? 1 : pattern === 'bearish' ? -1 : 0, threshold: 0.7 });
    
    // ML Prediction
    if (mlPrediction !== undefined) {
      let mlSignal: SignalType = 'hold';
      if (mlPrediction > 0.7) mlSignal = 'strong_buy';
      else if (mlPrediction > 0.55) mlSignal = 'buy';
      else if (mlPrediction < 0.3) mlSignal = 'strong_sell';
      else if (mlPrediction < 0.45) mlSignal = 'sell';
      updatedFactors.push({ name: 'ML Prediction', type: 'ml', signal: mlSignal, weight: 0.14, value: mlPrediction, threshold: 0.6 });
    }
    
    return updatedFactors;
  }

  private calculateRSI(closes: number[], period: number): number {
    if (closes.length < period + 1) return 50;
    
    const changes = closes.slice(1).map((c, i) => c - closes[i]);
    const recentChanges = changes.slice(-period);
    
    const gains = recentChanges.filter(c => c > 0);
    const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
    
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;
    const signal = macd * 0.2; // Simplified
    const histogram = macd - signal;
    return { macd, signal, histogram };
  }

  private calculateEMA(data: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  private calculateSMA(data: number[], period: number): number {
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  private calculateBollingerBands(closes: number[], period: number, stdDev: number): { upper: number; middle: number; lower: number } {
    const slice = closes.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: middle + stdDev * std,
      middle,
      lower: middle - stdDev * std
    };
  }

  private calculateATR(prices: PriceData[], period: number): number {
    if (prices.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const tr = Math.max(
        prices[i].high - prices[i].low,
        Math.abs(prices[i].high - prices[i - 1].close),
        Math.abs(prices[i].low - prices[i - 1].close)
      );
      trueRanges.push(tr);
    }
    
    const recentTR = trueRanges.slice(-period);
    return recentTR.reduce((a, b) => a + b, 0) / period;
  }

  private calculateADX(highs: number[], lows: number[], closes: number[], period: number): { adx: number; plusDI: number; minusDI: number } {
    // Simplified ADX calculation
    const n = closes.length;
    if (n < period + 1) return { adx: 20, plusDI: 25, minusDI: 25 };
    
    let plusDM = 0;
    let minusDM = 0;
    let tr = 0;
    
    for (let i = 1; i < period + 1; i++) {
      const highDiff = highs[n - period + i] - highs[n - period + i - 1];
      const lowDiff = lows[n - period + i - 1] - lows[n - period + i];
      
      if (highDiff > lowDiff && highDiff > 0) plusDM += highDiff;
      if (lowDiff > highDiff && lowDiff > 0) minusDM += lowDiff;
      
      tr += Math.max(
        highs[n - period + i] - lows[n - period + i],
        Math.abs(highs[n - period + i] - closes[n - period + i - 1]),
        Math.abs(lows[n - period + i] - closes[n - period + i - 1])
      );
    }
    
    const plusDI = tr > 0 ? (plusDM / tr) * 100 : 0;
    const minusDI = tr > 0 ? (minusDM / tr) * 100 : 0;
    
    const dx = plusDI + minusDI > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
    
    return { adx: dx, plusDI, minusDI };
  }

  private detectSimplePattern(prices: PriceData[]): 'bullish' | 'bearish' | 'neutral' {
    if (prices.length < 3) return 'neutral';
    
    const last = prices[prices.length - 1];
    const prev = prices[prices.length - 2];
    
    const lastBody = Math.abs(last.close - last.open);
    const lastRange = last.high - last.low;
    const prevBullish = prev.close > prev.open;
    const lastBullish = last.close > last.open;
    
    // Engulfing patterns
    if (lastBullish && !prevBullish && last.close > prev.open && last.open < prev.close) {
      return 'bullish';
    }
    
    if (!lastBullish && prevBullish && last.close < prev.open && last.open > prev.close) {
      return 'bearish';
    }
    
    // Hammer
    const lowerShadow = Math.min(last.open, last.close) - last.low;
    const upperShadow = last.high - Math.max(last.open, last.close);
    
    if (lowerShadow > lastBody * 2 && upperShadow < lastBody * 0.5) {
      return 'bullish';
    }
    
    if (upperShadow > lastBody * 2 && lowerShadow < lastBody * 0.5) {
      return 'bearish';
    }
    
    return 'neutral';
  }

  private calculateExpiry(timeframe: SignalTimeframe): Date {
    const now = new Date();
    const multipliers: Record<SignalTimeframe, number> = {
      '1m': 5,
      '5m': 15,
      '15m': 45,
      '1h': 4 * 60,
      '4h': 12 * 60,
      '1d': 2 * 24 * 60,
      '1w': 7 * 24 * 60
    };
    
    return new Date(now.getTime() + multipliers[timeframe] * 60 * 1000);
  }

  getActiveSignals(): TradingSignal[] {
    const now = new Date();
    return this.signals.filter(s => s.expiresAt > now);
  }

  getSignalHistory(): TradingSignal[] {
    return this.signals;
  }
}

// ============= Alert Manager =============

export class AlertManager {
  private alerts: Alert[] = [];
  private callbacks: Map<string, (alert: Alert) => void> = new Map();

  createAlert(alert: Omit<Alert, 'id' | 'isTriggered'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isTriggered: false
    };
    
    this.alerts.push(newAlert);
    return newAlert;
  }

  checkAlerts(currentData: Record<string, number>): Alert[] {
    const triggeredAlerts: Alert[] = [];
    
    for (const alert of this.alerts) {
      if (alert.isTriggered) continue;
      
      const value = currentData[alert.condition.field];
      if (value === undefined) continue;
      
      let triggered = false;
      
      switch (alert.condition.operator) {
        case 'gt':
          triggered = value > alert.condition.value;
          break;
        case 'gte':
          triggered = value >= alert.condition.value;
          break;
        case 'lt':
          triggered = value < alert.condition.value;
          break;
        case 'lte':
          triggered = value <= alert.condition.value;
          break;
        case 'eq':
          triggered = Math.abs(value - alert.condition.value) < 0.0001;
          break;
      }
      
      if (triggered) {
        alert.isTriggered = true;
        alert.triggeredAt = new Date();
        triggeredAlerts.push(alert);
        
        const callback = this.callbacks.get(alert.id);
        if (callback) callback(alert);
      }
    }
    
    return triggeredAlerts;
  }

  onTrigger(alertId: string, callback: (alert: Alert) => void): void {
    this.callbacks.set(alertId, callback);
  }

  getAlerts(): Alert[] {
    return this.alerts;
  }

  removeAlert(alertId: string): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    this.callbacks.delete(alertId);
  }
}

// ============= Automation Engine =============

export class AutomationEngine {
  private rules: AutomatedRule[] = [];
  private signalGenerator: SignalGenerator;
  private alertManager: AlertManager;

  constructor() {
    this.signalGenerator = new SignalGenerator();
    this.alertManager = new AlertManager();
  }

  addRule(rule: Omit<AutomatedRule, 'id' | 'executionCount' | 'lastExecuted'>): AutomatedRule {
    const newRule: AutomatedRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionCount: 0
    };
    
    this.rules.push(newRule);
    return newRule;
  }

  evaluateRules(context: Record<string, any>): RuleAction[] {
    const actionsToExecute: RuleAction[] = [];
    
    for (const rule of this.rules) {
      if (!rule.isActive) continue;
      
      const conditionsMet = this.evaluateConditions(rule.conditions, context);
      
      if (conditionsMet) {
        actionsToExecute.push(...rule.actions);
        rule.executionCount++;
        rule.lastExecuted = new Date();
      }
    }
    
    return actionsToExecute;
  }

  private evaluateConditions(conditions: RuleCondition[], context: Record<string, any>): boolean {
    let result = true;
    let useOr = false;
    
    for (const condition of conditions) {
      const value = context[condition.field];
      let conditionResult = false;
      
      switch (condition.operator) {
        case 'gt':
          conditionResult = value > condition.value;
          break;
        case 'gte':
          conditionResult = value >= condition.value;
          break;
        case 'lt':
          conditionResult = value < condition.value;
          break;
        case 'lte':
          conditionResult = value <= condition.value;
          break;
        case 'eq':
          conditionResult = value === condition.value;
          break;
        case 'neq':
          conditionResult = value !== condition.value;
          break;
        case 'contains':
          conditionResult = String(value).includes(String(condition.value));
          break;
      }
      
      if (condition.logicalOperator === 'or') {
        useOr = true;
      }
      
      if (useOr) {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }
    
    return result;
  }

  getRules(): AutomatedRule[] {
    return this.rules;
  }

  toggleRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.isActive = !rule.isActive;
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  getSignalGenerator(): SignalGenerator {
    return this.signalGenerator;
  }

  getAlertManager(): AlertManager {
    return this.alertManager;
  }
}

// ============= Strategy Scheduler =============

export class StrategyScheduler {
  private schedules: Map<string, NodeJS.Timeout> = new Map();
  private tasks: Map<string, () => void> = new Map();

  schedule(
    id: string,
    task: () => void,
    intervalMs: number,
    startImmediately: boolean = true
  ): void {
    if (this.schedules.has(id)) {
      this.cancel(id);
    }
    
    this.tasks.set(id, task);
    
    if (startImmediately) {
      task();
    }
    
    const interval = setInterval(task, intervalMs);
    this.schedules.set(id, interval);
  }

  scheduleAt(id: string, task: () => void, date: Date): void {
    const delay = date.getTime() - Date.now();
    
    if (delay <= 0) {
      task();
      return;
    }
    
    this.tasks.set(id, task);
    const timeout = setTimeout(() => {
      task();
      this.schedules.delete(id);
      this.tasks.delete(id);
    }, delay);
    
    this.schedules.set(id, timeout);
  }

  cancel(id: string): void {
    const schedule = this.schedules.get(id);
    if (schedule) {
      clearInterval(schedule);
      clearTimeout(schedule);
      this.schedules.delete(id);
      this.tasks.delete(id);
    }
  }

  cancelAll(): void {
    for (const id of this.schedules.keys()) {
      this.cancel(id);
    }
  }

  getActiveSchedules(): string[] {
    return Array.from(this.schedules.keys());
  }
}
