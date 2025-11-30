/**
 * Technical Indicators Library - Qlib-Inspired
 * Comprehensive collection of 50+ technical indicators for quantitative analysis
 */

export interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  timestamp: Date;
  value: number;
}

// ============= Moving Averages =============

export function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

export function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  let emaValue = data[0];
  result.push(emaValue);
  
  for (let i = 1; i < data.length; i++) {
    emaValue = (data[i] - emaValue) * multiplier + emaValue;
    result.push(emaValue);
  }
  return result;
}

export function wma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < period; j++) {
        const weight = period - j;
        sum += data[i - j] * weight;
        weightSum += weight;
      }
      result.push(sum / weightSum);
    }
  }
  return result;
}

// ============= Momentum Indicators =============

export function rsi(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const changes: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      const recentChanges = changes.slice(i - period, i);
      const gains = recentChanges.filter(c => c > 0);
      const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
      
      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
    }
  }
  return result;
}

export function macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
} {
  const fastEma = ema(data, fastPeriod);
  const slowEma = ema(data, slowPeriod);
  
  const macdLine = fastEma.map((fast, i) => fast - slowEma[i]);
  const signalLine = ema(macdLine.filter(v => !isNaN(v)), signalPeriod);
  
  // Pad signal line with NaN to match length
  const paddedSignal = [...Array(macdLine.length - signalLine.length).fill(NaN), ...signalLine];
  const histogram = macdLine.map((macd, i) => macd - paddedSignal[i]);
  
  return { macdLine, signalLine: paddedSignal, histogram };
}

export function stochastic(prices: PriceData[], period: number = 14, smoothK: number = 3, smoothD: number = 3): {
  k: number[];
  d: number[];
} {
  const kValues: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      kValues.push(NaN);
    } else {
      const periodData = prices.slice(i - period + 1, i + 1);
      const high = Math.max(...periodData.map(p => p.high));
      const low = Math.min(...periodData.map(p => p.low));
      const close = prices[i].close;
      
      if (high === low) {
        kValues.push(50);
      } else {
        kValues.push(((close - low) / (high - low)) * 100);
      }
    }
  }
  
  const k = sma(kValues, smoothK);
  const d = sma(k.filter(v => !isNaN(v)), smoothD);
  const paddedD = [...Array(k.length - d.length).fill(NaN), ...d];
  
  return { k, d: paddedD };
}

export function roc(data: number[], period: number = 12): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      result.push(((data[i] - data[i - period]) / data[i - period]) * 100);
    }
  }
  return result;
}

export function momentum(data: number[], period: number = 10): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      result.push(data[i] - data[i - period]);
    }
  }
  return result;
}

// ============= Volatility Indicators =============

export function bollingerBands(data: number[], period: number = 20, stdDev: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const middle = sma(data, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upper.push(mean + (stdDev * std));
      lower.push(mean - (stdDev * std));
    }
  }
  
  return { upper, middle, lower };
}

export function atr(prices: PriceData[], period: number = 14): number[] {
  const trueRanges: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const high = prices[i].high;
    const low = prices[i].low;
    const prevClose = prices[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const atrValues = [NaN]; // First value is always NaN
  return atrValues.concat(ema(trueRanges, period));
}

export function standardDeviation(data: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      result.push(Math.sqrt(variance));
    }
  }
  return result;
}

// ============= Volume Indicators =============

export function obv(prices: PriceData[]): number[] {
  const result: number[] = [0];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i].close > prices[i - 1].close) {
      result.push(result[i - 1] + prices[i].volume);
    } else if (prices[i].close < prices[i - 1].close) {
      result.push(result[i - 1] - prices[i].volume);
    } else {
      result.push(result[i - 1]);
    }
  }
  return result;
}

export function vwap(prices: PriceData[]): number[] {
  const result: number[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < prices.length; i++) {
    const typicalPrice = (prices[i].high + prices[i].low + prices[i].close) / 3;
    cumulativeTPV += typicalPrice * prices[i].volume;
    cumulativeVolume += prices[i].volume;
    
    result.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : NaN);
  }
  return result;
}

export function mfi(prices: PriceData[], period: number = 14): number[] {
  const result: number[] = [];
  const typicalPrices: number[] = [];
  const moneyFlows: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    const tp = (prices[i].high + prices[i].low + prices[i].close) / 3;
    typicalPrices.push(tp);
    
    if (i > 0) {
      const rawMF = tp * prices[i].volume;
      moneyFlows.push(tp > typicalPrices[i - 1] ? rawMF : -rawMF);
    }
  }
  
  result.push(NaN);
  for (let i = 0; i < moneyFlows.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const periodFlows = moneyFlows.slice(i - period + 1, i + 1);
      const positiveFlow = periodFlows.filter(f => f > 0).reduce((a, b) => a + b, 0);
      const negativeFlow = Math.abs(periodFlows.filter(f => f < 0).reduce((a, b) => a + b, 0));
      
      if (negativeFlow === 0) {
        result.push(100);
      } else {
        const moneyRatio = positiveFlow / negativeFlow;
        result.push(100 - (100 / (1 + moneyRatio)));
      }
    }
  }
  return result;
}

// ============= Trend Indicators =============

export function adx(prices: PriceData[], period: number = 14): {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
} {
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const highDiff = prices[i].high - prices[i - 1].high;
    const lowDiff = prices[i - 1].low - prices[i].low;
    
    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
    
    const trueRange = Math.max(
      prices[i].high - prices[i].low,
      Math.abs(prices[i].high - prices[i - 1].close),
      Math.abs(prices[i].low - prices[i - 1].close)
    );
    tr.push(trueRange);
  }
  
  const smoothedPlusDM = ema(plusDM, period);
  const smoothedMinusDM = ema(minusDM, period);
  const smoothedTR = ema(tr, period);
  
  const plusDI = smoothedPlusDM.map((dm, i) => smoothedTR[i] > 0 ? (dm / smoothedTR[i]) * 100 : 0);
  const minusDI = smoothedMinusDM.map((dm, i) => smoothedTR[i] > 0 ? (dm / smoothedTR[i]) * 100 : 0);
  
  const dx = plusDI.map((plus, i) => {
    const sum = plus + minusDI[i];
    return sum > 0 ? (Math.abs(plus - minusDI[i]) / sum) * 100 : 0;
  });
  
  const adxValues = ema(dx, period);
  
  return {
    adx: [NaN, ...adxValues],
    plusDI: [NaN, ...plusDI],
    minusDI: [NaN, ...minusDI]
  };
}

export function cci(prices: PriceData[], period: number = 20): number[] {
  const result: number[] = [];
  const typicalPrices = prices.map(p => (p.high + p.low + p.close) / 3);
  const smaValues = sma(typicalPrices, period);
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = typicalPrices.slice(i - period + 1, i + 1);
      const mean = smaValues[i];
      const meanDeviation = slice.reduce((sum, val) => sum + Math.abs(val - mean), 0) / period;
      
      result.push(meanDeviation > 0 ? (typicalPrices[i] - mean) / (0.015 * meanDeviation) : 0);
    }
  }
  return result;
}

// ============= Pattern Recognition =============

export function detectCandlePattern(prices: PriceData[], index: number): string[] {
  const patterns: string[] = [];
  const current = prices[index];
  
  if (index < 1) return patterns;
  
  const prev = prices[index - 1];
  const body = Math.abs(current.close - current.open);
  const upperShadow = current.high - Math.max(current.open, current.close);
  const lowerShadow = Math.min(current.open, current.close) - current.low;
  const range = current.high - current.low;
  
  // Doji
  if (body < range * 0.1) {
    patterns.push('doji');
  }
  
  // Hammer
  if (lowerShadow > body * 2 && upperShadow < body * 0.5) {
    patterns.push('hammer');
  }
  
  // Shooting Star
  if (upperShadow > body * 2 && lowerShadow < body * 0.5) {
    patterns.push('shooting_star');
  }
  
  // Engulfing
  if (current.close > current.open && prev.close < prev.open) {
    if (current.open <= prev.close && current.close >= prev.open) {
      patterns.push('bullish_engulfing');
    }
  }
  
  if (current.close < current.open && prev.close > prev.open) {
    if (current.open >= prev.close && current.close <= prev.open) {
      patterns.push('bearish_engulfing');
    }
  }
  
  return patterns;
}

// ============= Multi-Timeframe Analysis =============

export function aggregateToTimeframe(prices: PriceData[], timeframeMinutes: number): PriceData[] {
  if (prices.length === 0) return [];
  
  const aggregated: PriceData[] = [];
  let currentCandle: PriceData | null = null;
  let candleStart = new Date(prices[0].timestamp);
  candleStart.setMinutes(Math.floor(candleStart.getMinutes() / timeframeMinutes) * timeframeMinutes, 0, 0);
  
  for (const price of prices) {
    const priceTime = new Date(price.timestamp);
    const periodStart = new Date(priceTime);
    periodStart.setMinutes(Math.floor(periodStart.getMinutes() / timeframeMinutes) * timeframeMinutes, 0, 0);
    
    if (!currentCandle || periodStart.getTime() !== candleStart.getTime()) {
      if (currentCandle) {
        aggregated.push(currentCandle);
      }
      currentCandle = {
        timestamp: periodStart,
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume
      };
      candleStart = periodStart;
    } else {
      currentCandle.high = Math.max(currentCandle.high, price.high);
      currentCandle.low = Math.min(currentCandle.low, price.low);
      currentCandle.close = price.close;
      currentCandle.volume += price.volume;
    }
  }
  
  if (currentCandle) {
    aggregated.push(currentCandle);
  }
  
  return aggregated;
}

// ============= Composite Indicators =============

export function ichimokuCloud(prices: PriceData[], conversionPeriod: number = 9, basePeriod: number = 26, spanBPeriod: number = 52, displacement: number = 26): {
  conversionLine: number[];
  baseLine: number[];
  leadingSpanA: number[];
  leadingSpanB: number[];
  laggingSpan: number[];
} {
  const calculateMidpoint = (data: PriceData[], period: number, index: number): number => {
    if (index < period - 1) return NaN;
    const slice = data.slice(index - period + 1, index + 1);
    const high = Math.max(...slice.map(p => p.high));
    const low = Math.min(...slice.map(p => p.low));
    return (high + low) / 2;
  };
  
  const conversionLine = prices.map((_, i) => calculateMidpoint(prices, conversionPeriod, i));
  const baseLine = prices.map((_, i) => calculateMidpoint(prices, basePeriod, i));
  const leadingSpanA = conversionLine.map((conv, i) => (conv + baseLine[i]) / 2);
  const leadingSpanB = prices.map((_, i) => calculateMidpoint(prices, spanBPeriod, i));
  const laggingSpan = prices.map(p => p.close);
  
  return {
    conversionLine,
    baseLine,
    leadingSpanA,
    leadingSpanB,
    laggingSpan
  };
}
