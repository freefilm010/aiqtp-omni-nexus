/**
 * Pattern Recognition & Computer Vision for Charts
 * Technical pattern detection, candlestick patterns, and chart analysis
 */

export interface ChartPattern {
  name: string;
  type: 'continuation' | 'reversal' | 'bilateral';
  direction: 'bullish' | 'bearish' | 'neutral';
  reliability: number;
  startIndex: number;
  endIndex: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
}

export interface CandlestickPattern {
  name: string;
  type: 'single' | 'double' | 'triple' | 'complex';
  direction: 'bullish' | 'bearish' | 'neutral';
  significance: number;
  index: number;
}

export interface SupportResistance {
  level: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
  isBreaking: boolean;
}

export interface TrendLine {
  startPoint: { index: number; price: number };
  endPoint: { index: number; price: number };
  slope: number;
  type: 'support' | 'resistance';
  strength: number;
}

export interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============= Chart Pattern Detection =============

export class ChartPatternDetector {
  private prices: PriceData[];
  private tolerance: number;

  constructor(prices: PriceData[], tolerance: number = 0.02) {
    this.prices = prices;
    this.tolerance = tolerance;
  }

  detectAllPatterns(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    
    patterns.push(...this.detectHeadAndShoulders());
    patterns.push(...this.detectDoubleTopBottom());
    patterns.push(...this.detectTriangles());
    patterns.push(...this.detectWedges());
    patterns.push(...this.detectChannels());
    patterns.push(...this.detectFlags());
    patterns.push(...this.detectCupAndHandle());
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  detectHeadAndShoulders(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const closes = this.prices.map(p => p.close);
    const highs = this.prices.map(p => p.high);
    const lows = this.prices.map(p => p.low);
    
    // Find local maxima
    const peaks = this.findLocalExtrema(highs, true);
    
    for (let i = 0; i < peaks.length - 4; i++) {
      const leftShoulder = peaks[i];
      
      for (let j = i + 1; j < peaks.length - 2; j++) {
        const head = peaks[j];
        
        // Head should be higher than left shoulder
        if (highs[head] <= highs[leftShoulder]) continue;
        
        for (let k = j + 1; k < peaks.length; k++) {
          const rightShoulder = peaks[k];
          
          // Right shoulder should be roughly equal to left shoulder
          const shoulderDiff = Math.abs(highs[leftShoulder] - highs[rightShoulder]) / highs[leftShoulder];
          if (shoulderDiff > this.tolerance * 2) continue;
          
          // Head should be higher than right shoulder
          if (highs[head] <= highs[rightShoulder]) continue;
          
          // Find neckline
          const necklineLeft = this.findTroughBetween(lows, leftShoulder, head);
          const necklineRight = this.findTroughBetween(lows, head, rightShoulder);
          
          if (necklineLeft === -1 || necklineRight === -1) continue;
          
          const neckline = (lows[necklineLeft] + lows[necklineRight]) / 2;
          const patternHeight = highs[head] - neckline;
          
          patterns.push({
            name: 'Head and Shoulders',
            type: 'reversal',
            direction: 'bearish',
            reliability: 0.85,
            startIndex: leftShoulder,
            endIndex: rightShoulder,
            targetPrice: neckline - patternHeight,
            stopLoss: highs[head] * 1.02,
            confidence: this.calculatePatternConfidence([
              highs[leftShoulder], highs[head], highs[rightShoulder], neckline
            ])
          });
        }
      }
    }
    
    // Inverse Head and Shoulders
    const troughs = this.findLocalExtrema(lows, false);
    
    for (let i = 0; i < troughs.length - 4; i++) {
      const leftShoulder = troughs[i];
      
      for (let j = i + 1; j < troughs.length - 2; j++) {
        const head = troughs[j];
        
        if (lows[head] >= lows[leftShoulder]) continue;
        
        for (let k = j + 1; k < troughs.length; k++) {
          const rightShoulder = troughs[k];
          
          const shoulderDiff = Math.abs(lows[leftShoulder] - lows[rightShoulder]) / lows[leftShoulder];
          if (shoulderDiff > this.tolerance * 2) continue;
          
          if (lows[head] >= lows[rightShoulder]) continue;
          
          const necklineLeft = this.findPeakBetween(highs, leftShoulder, head);
          const necklineRight = this.findPeakBetween(highs, head, rightShoulder);
          
          if (necklineLeft === -1 || necklineRight === -1) continue;
          
          const neckline = (highs[necklineLeft] + highs[necklineRight]) / 2;
          const patternHeight = neckline - lows[head];
          
          patterns.push({
            name: 'Inverse Head and Shoulders',
            type: 'reversal',
            direction: 'bullish',
            reliability: 0.85,
            startIndex: leftShoulder,
            endIndex: rightShoulder,
            targetPrice: neckline + patternHeight,
            stopLoss: lows[head] * 0.98,
            confidence: this.calculatePatternConfidence([
              lows[leftShoulder], lows[head], lows[rightShoulder], neckline
            ])
          });
        }
      }
    }
    
    return patterns;
  }

  detectDoubleTopBottom(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const highs = this.prices.map(p => p.high);
    const lows = this.prices.map(p => p.low);
    
    // Double Top
    const peaks = this.findLocalExtrema(highs, true);
    
    for (let i = 0; i < peaks.length - 1; i++) {
      for (let j = i + 1; j < peaks.length; j++) {
        const peak1 = peaks[i];
        const peak2 = peaks[j];
        
        // Check if peaks are at similar levels
        const priceDiff = Math.abs(highs[peak1] - highs[peak2]) / highs[peak1];
        if (priceDiff > this.tolerance) continue;
        
        // Must have a trough between
        const trough = this.findTroughBetween(lows, peak1, peak2);
        if (trough === -1) continue;
        
        const support = lows[trough];
        const resistance = (highs[peak1] + highs[peak2]) / 2;
        const patternHeight = resistance - support;
        
        patterns.push({
          name: 'Double Top',
          type: 'reversal',
          direction: 'bearish',
          reliability: 0.75,
          startIndex: peak1,
          endIndex: peak2,
          targetPrice: support - patternHeight,
          stopLoss: resistance * 1.02,
          confidence: 0.7 + (1 - priceDiff) * 0.3
        });
      }
    }
    
    // Double Bottom
    const troughs = this.findLocalExtrema(lows, false);
    
    for (let i = 0; i < troughs.length - 1; i++) {
      for (let j = i + 1; j < troughs.length; j++) {
        const trough1 = troughs[i];
        const trough2 = troughs[j];
        
        const priceDiff = Math.abs(lows[trough1] - lows[trough2]) / lows[trough1];
        if (priceDiff > this.tolerance) continue;
        
        const peak = this.findPeakBetween(highs, trough1, trough2);
        if (peak === -1) continue;
        
        const resistance = highs[peak];
        const support = (lows[trough1] + lows[trough2]) / 2;
        const patternHeight = resistance - support;
        
        patterns.push({
          name: 'Double Bottom',
          type: 'reversal',
          direction: 'bullish',
          reliability: 0.75,
          startIndex: trough1,
          endIndex: trough2,
          targetPrice: resistance + patternHeight,
          stopLoss: support * 0.98,
          confidence: 0.7 + (1 - priceDiff) * 0.3
        });
      }
    }
    
    return patterns;
  }

  detectTriangles(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const highs = this.prices.map(p => p.high);
    const lows = this.prices.map(p => p.low);
    
    const windowSize = 20;
    
    for (let start = 0; start < this.prices.length - windowSize; start++) {
      const windowHighs = highs.slice(start, start + windowSize);
      const windowLows = lows.slice(start, start + windowSize);
      
      // Calculate trendlines
      const upperTrend = this.calculateTrendline(windowHighs, true);
      const lowerTrend = this.calculateTrendline(windowLows, false);
      
      // Ascending Triangle: Flat top, rising bottom
      if (Math.abs(upperTrend.slope) < 0.001 && lowerTrend.slope > 0.001) {
        const apex = this.findApex(upperTrend, lowerTrend, windowSize);
        if (apex > windowSize * 0.5) {
          patterns.push({
            name: 'Ascending Triangle',
            type: 'continuation',
            direction: 'bullish',
            reliability: 0.72,
            startIndex: start,
            endIndex: start + windowSize,
            targetPrice: upperTrend.intercept * 1.05,
            stopLoss: lowerTrend.intercept + lowerTrend.slope * windowSize * 0.9,
            confidence: this.calculateTriangleConfidence(windowHighs, windowLows, upperTrend, lowerTrend)
          });
        }
      }
      
      // Descending Triangle: Falling top, flat bottom
      if (upperTrend.slope < -0.001 && Math.abs(lowerTrend.slope) < 0.001) {
        const apex = this.findApex(upperTrend, lowerTrend, windowSize);
        if (apex > windowSize * 0.5) {
          patterns.push({
            name: 'Descending Triangle',
            type: 'continuation',
            direction: 'bearish',
            reliability: 0.72,
            startIndex: start,
            endIndex: start + windowSize,
            targetPrice: lowerTrend.intercept * 0.95,
            stopLoss: upperTrend.intercept + upperTrend.slope * windowSize * 0.9,
            confidence: this.calculateTriangleConfidence(windowHighs, windowLows, upperTrend, lowerTrend)
          });
        }
      }
      
      // Symmetrical Triangle: Converging trendlines
      if (upperTrend.slope < -0.001 && lowerTrend.slope > 0.001) {
        patterns.push({
          name: 'Symmetrical Triangle',
          type: 'bilateral',
          direction: 'neutral',
          reliability: 0.65,
          startIndex: start,
          endIndex: start + windowSize,
          targetPrice: (highs[start] + lows[start]) / 2,
          stopLoss: lows[start + windowSize - 1] * 0.98,
          confidence: this.calculateTriangleConfidence(windowHighs, windowLows, upperTrend, lowerTrend)
        });
      }
    }
    
    return patterns;
  }

  detectWedges(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const highs = this.prices.map(p => p.high);
    const lows = this.prices.map(p => p.low);
    
    const windowSize = 25;
    
    for (let start = 0; start < this.prices.length - windowSize; start++) {
      const windowHighs = highs.slice(start, start + windowSize);
      const windowLows = lows.slice(start, start + windowSize);
      
      const upperTrend = this.calculateTrendline(windowHighs, true);
      const lowerTrend = this.calculateTrendline(windowLows, false);
      
      // Rising Wedge: Both lines rising, converging
      if (upperTrend.slope > 0.0005 && lowerTrend.slope > 0.0005 && 
          upperTrend.slope < lowerTrend.slope * 1.5) {
        patterns.push({
          name: 'Rising Wedge',
          type: 'reversal',
          direction: 'bearish',
          reliability: 0.68,
          startIndex: start,
          endIndex: start + windowSize,
          targetPrice: lows[start],
          stopLoss: highs[start + windowSize - 1] * 1.02,
          confidence: 0.65
        });
      }
      
      // Falling Wedge: Both lines falling, converging
      if (upperTrend.slope < -0.0005 && lowerTrend.slope < -0.0005 && 
          Math.abs(upperTrend.slope) > Math.abs(lowerTrend.slope) * 0.5) {
        patterns.push({
          name: 'Falling Wedge',
          type: 'reversal',
          direction: 'bullish',
          reliability: 0.68,
          startIndex: start,
          endIndex: start + windowSize,
          targetPrice: highs[start],
          stopLoss: lows[start + windowSize - 1] * 0.98,
          confidence: 0.65
        });
      }
    }
    
    return patterns;
  }

  detectChannels(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const highs = this.prices.map(p => p.high);
    const lows = this.prices.map(p => p.low);
    
    const windowSize = 30;
    
    for (let start = 0; start < this.prices.length - windowSize; start++) {
      const windowHighs = highs.slice(start, start + windowSize);
      const windowLows = lows.slice(start, start + windowSize);
      
      const upperTrend = this.calculateTrendline(windowHighs, true);
      const lowerTrend = this.calculateTrendline(windowLows, false);
      
      // Check if lines are parallel
      const slopeDiff = Math.abs(upperTrend.slope - lowerTrend.slope);
      if (slopeDiff > 0.002) continue;
      
      const direction = upperTrend.slope > 0.001 ? 'bullish' : 
                       upperTrend.slope < -0.001 ? 'bearish' : 'neutral';
      
      patterns.push({
        name: `${direction === 'bullish' ? 'Ascending' : direction === 'bearish' ? 'Descending' : 'Horizontal'} Channel`,
        type: 'continuation',
        direction: direction,
        reliability: 0.70,
        startIndex: start,
        endIndex: start + windowSize,
        targetPrice: upperTrend.intercept + upperTrend.slope * (windowSize + 10),
        stopLoss: lowerTrend.intercept + lowerTrend.slope * windowSize * 0.9,
        confidence: 0.7
      });
    }
    
    return patterns;
  }

  detectFlags(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const closes = this.prices.map(p => p.close);
    
    // Look for strong move followed by consolidation
    for (let i = 10; i < this.prices.length - 10; i++) {
      // Check for strong move (pole)
      const poleReturn = (closes[i] - closes[i - 10]) / closes[i - 10];
      
      if (Math.abs(poleReturn) > 0.05) { // 5% move
        // Check for consolidation (flag)
        const flagHighs = this.prices.slice(i, i + 10).map(p => p.high);
        const flagLows = this.prices.slice(i, i + 10).map(p => p.low);
        
        const flagRange = (Math.max(...flagHighs) - Math.min(...flagLows)) / closes[i];
        
        if (flagRange < 0.03) { // Tight consolidation
          patterns.push({
            name: poleReturn > 0 ? 'Bull Flag' : 'Bear Flag',
            type: 'continuation',
            direction: poleReturn > 0 ? 'bullish' : 'bearish',
            reliability: 0.67,
            startIndex: i - 10,
            endIndex: i + 10,
            targetPrice: poleReturn > 0 
              ? closes[i] + Math.abs(closes[i] - closes[i - 10])
              : closes[i] - Math.abs(closes[i] - closes[i - 10]),
            stopLoss: poleReturn > 0 
              ? Math.min(...flagLows) * 0.98
              : Math.max(...flagHighs) * 1.02,
            confidence: 0.65
          });
        }
      }
    }
    
    return patterns;
  }

  detectCupAndHandle(): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    const closes = this.prices.map(p => p.close);
    
    const windowSize = 40;
    
    for (let start = 0; start < this.prices.length - windowSize - 10; start++) {
      const window = closes.slice(start, start + windowSize);
      
      // Find the bottom of the cup
      const minIdx = window.indexOf(Math.min(...window));
      
      // Cup should form in middle portion
      if (minIdx < windowSize * 0.3 || minIdx > windowSize * 0.7) continue;
      
      // Check for U-shape
      const leftRim = window[0];
      const rightRim = window[windowSize - 1];
      const bottom = window[minIdx];
      
      // Rims should be at similar levels
      if (Math.abs(leftRim - rightRim) / leftRim > 0.05) continue;
      
      // Cup depth should be 12-33%
      const depth = (leftRim - bottom) / leftRim;
      if (depth < 0.12 || depth > 0.33) continue;
      
      // Check for handle (small pullback after cup)
      const handleData = closes.slice(start + windowSize, start + windowSize + 10);
      if (handleData.length < 5) continue;
      
      const handleDrop = (rightRim - Math.min(...handleData)) / rightRim;
      
      if (handleDrop > 0.02 && handleDrop < 0.12) {
        patterns.push({
          name: 'Cup and Handle',
          type: 'continuation',
          direction: 'bullish',
          reliability: 0.70,
          startIndex: start,
          endIndex: start + windowSize + 10,
          targetPrice: rightRim + (rightRim - bottom),
          stopLoss: Math.min(...handleData) * 0.98,
          confidence: 0.7 - Math.abs(depth - 0.2)
        });
      }
    }
    
    return patterns;
  }

  // Helper methods
  private findLocalExtrema(data: number[], findMaxima: boolean, window: number = 5): number[] {
    const extrema: number[] = [];
    
    for (let i = window; i < data.length - window; i++) {
      const windowData = data.slice(i - window, i + window + 1);
      const current = data[i];
      
      if (findMaxima) {
        if (current === Math.max(...windowData)) {
          extrema.push(i);
        }
      } else {
        if (current === Math.min(...windowData)) {
          extrema.push(i);
        }
      }
    }
    
    return extrema;
  }

  private findTroughBetween(data: number[], start: number, end: number): number {
    if (start >= end) return -1;
    const slice = data.slice(start, end + 1);
    const minIdx = slice.indexOf(Math.min(...slice));
    return start + minIdx;
  }

  private findPeakBetween(data: number[], start: number, end: number): number {
    if (start >= end) return -1;
    const slice = data.slice(start, end + 1);
    const maxIdx = slice.indexOf(Math.max(...slice));
    return start + maxIdx;
  }

  private calculateTrendline(data: number[], isUpper: boolean): { slope: number; intercept: number } {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (data[i] - yMean);
      denominator += (x[i] - xMean) * (x[i] - xMean);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;
    
    return { slope, intercept };
  }

  private findApex(upper: { slope: number; intercept: number }, lower: { slope: number; intercept: number }, windowSize: number): number {
    // Point where lines meet
    if (upper.slope === lower.slope) return Infinity;
    return (lower.intercept - upper.intercept) / (upper.slope - lower.slope);
  }

  private calculatePatternConfidence(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const cv = Math.sqrt(variance) / mean;
    
    return Math.max(0.5, Math.min(0.95, 1 - cv));
  }

  private calculateTriangleConfidence(
    highs: number[], 
    lows: number[], 
    upper: { slope: number; intercept: number },
    lower: { slope: number; intercept: number }
  ): number {
    let totalDeviation = 0;
    
    for (let i = 0; i < highs.length; i++) {
      const expectedHigh = upper.intercept + upper.slope * i;
      const expectedLow = lower.intercept + lower.slope * i;
      
      totalDeviation += Math.abs(highs[i] - expectedHigh) / expectedHigh;
      totalDeviation += Math.abs(lows[i] - expectedLow) / expectedLow;
    }
    
    const avgDeviation = totalDeviation / (highs.length * 2);
    return Math.max(0.5, Math.min(0.9, 1 - avgDeviation * 10));
  }
}

// ============= Candlestick Pattern Detection =============

export function detectCandlestickPatterns(prices: PriceData[]): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    // Single candle patterns
    const singlePatterns = detectSingleCandlePatterns(prices, i);
    patterns.push(...singlePatterns);
    
    // Double candle patterns
    if (i >= 1) {
      const doublePatterns = detectDoubleCandlePatterns(prices, i);
      patterns.push(...doublePatterns);
    }
    
    // Triple candle patterns
    if (i >= 2) {
      const triplePatterns = detectTripleCandlePatterns(prices, i);
      patterns.push(...triplePatterns);
    }
  }
  
  return patterns;
}

function detectSingleCandlePatterns(prices: PriceData[], index: number): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = [];
  const candle = prices[index];
  
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const isBullish = candle.close > candle.open;
  
  // Doji
  if (body < range * 0.1) {
    patterns.push({
      name: 'Doji',
      type: 'single',
      direction: 'neutral',
      significance: 0.6,
      index
    });
  }
  
  // Hammer / Hanging Man
  if (lowerShadow > body * 2 && upperShadow < body * 0.5 && body > 0) {
    patterns.push({
      name: isBullish ? 'Hammer' : 'Hanging Man',
      type: 'single',
      direction: isBullish ? 'bullish' : 'bearish',
      significance: 0.7,
      index
    });
  }
  
  // Inverted Hammer / Shooting Star
  if (upperShadow > body * 2 && lowerShadow < body * 0.5 && body > 0) {
    patterns.push({
      name: isBullish ? 'Inverted Hammer' : 'Shooting Star',
      type: 'single',
      direction: isBullish ? 'bullish' : 'bearish',
      significance: 0.7,
      index
    });
  }
  
  // Marubozu
  if (upperShadow < body * 0.05 && lowerShadow < body * 0.05 && range > 0) {
    patterns.push({
      name: isBullish ? 'Bullish Marubozu' : 'Bearish Marubozu',
      type: 'single',
      direction: isBullish ? 'bullish' : 'bearish',
      significance: 0.8,
      index
    });
  }
  
  // Spinning Top
  if (body < range * 0.3 && upperShadow > body && lowerShadow > body) {
    patterns.push({
      name: 'Spinning Top',
      type: 'single',
      direction: 'neutral',
      significance: 0.5,
      index
    });
  }
  
  return patterns;
}

function detectDoubleCandlePatterns(prices: PriceData[], index: number): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = [];
  const curr = prices[index];
  const prev = prices[index - 1];
  
  const currBody = Math.abs(curr.close - curr.open);
  const prevBody = Math.abs(prev.close - prev.open);
  const currBullish = curr.close > curr.open;
  const prevBullish = prev.close > prev.open;
  
  // Engulfing
  if (currBody > prevBody * 1.3) {
    if (currBullish && !prevBullish && curr.open <= prev.close && curr.close >= prev.open) {
      patterns.push({
        name: 'Bullish Engulfing',
        type: 'double',
        direction: 'bullish',
        significance: 0.8,
        index
      });
    }
    
    if (!currBullish && prevBullish && curr.open >= prev.close && curr.close <= prev.open) {
      patterns.push({
        name: 'Bearish Engulfing',
        type: 'double',
        direction: 'bearish',
        significance: 0.8,
        index
      });
    }
  }
  
  // Piercing / Dark Cloud Cover
  if (currBullish && !prevBullish) {
    if (curr.open < prev.low && curr.close > (prev.open + prev.close) / 2 && curr.close < prev.open) {
      patterns.push({
        name: 'Piercing Line',
        type: 'double',
        direction: 'bullish',
        significance: 0.75,
        index
      });
    }
  }
  
  if (!currBullish && prevBullish) {
    if (curr.open > prev.high && curr.close < (prev.open + prev.close) / 2 && curr.close > prev.open) {
      patterns.push({
        name: 'Dark Cloud Cover',
        type: 'double',
        direction: 'bearish',
        significance: 0.75,
        index
      });
    }
  }
  
  // Harami
  if (currBody < prevBody * 0.5) {
    if (currBullish && !prevBullish && curr.open > prev.close && curr.close < prev.open) {
      patterns.push({
        name: 'Bullish Harami',
        type: 'double',
        direction: 'bullish',
        significance: 0.65,
        index
      });
    }
    
    if (!currBullish && prevBullish && curr.open < prev.close && curr.close > prev.open) {
      patterns.push({
        name: 'Bearish Harami',
        type: 'double',
        direction: 'bearish',
        significance: 0.65,
        index
      });
    }
  }
  
  // Tweezer
  const topDiff = Math.abs(curr.high - prev.high) / curr.high;
  const bottomDiff = Math.abs(curr.low - prev.low) / curr.low;
  
  if (topDiff < 0.002) {
    patterns.push({
      name: 'Tweezer Top',
      type: 'double',
      direction: 'bearish',
      significance: 0.6,
      index
    });
  }
  
  if (bottomDiff < 0.002) {
    patterns.push({
      name: 'Tweezer Bottom',
      type: 'double',
      direction: 'bullish',
      significance: 0.6,
      index
    });
  }
  
  return patterns;
}

function detectTripleCandlePatterns(prices: PriceData[], index: number): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = [];
  const c1 = prices[index - 2];
  const c2 = prices[index - 1];
  const c3 = prices[index];
  
  const c1Bullish = c1.close > c1.open;
  const c2Bullish = c2.close > c2.open;
  const c3Bullish = c3.close > c3.open;
  
  const c1Body = Math.abs(c1.close - c1.open);
  const c2Body = Math.abs(c2.close - c2.open);
  const c3Body = Math.abs(c3.close - c3.open);
  
  // Morning Star
  if (!c1Bullish && c2Body < c1Body * 0.3 && c3Bullish && c3.close > (c1.open + c1.close) / 2) {
    patterns.push({
      name: 'Morning Star',
      type: 'triple',
      direction: 'bullish',
      significance: 0.85,
      index
    });
  }
  
  // Evening Star
  if (c1Bullish && c2Body < c1Body * 0.3 && !c3Bullish && c3.close < (c1.open + c1.close) / 2) {
    patterns.push({
      name: 'Evening Star',
      type: 'triple',
      direction: 'bearish',
      significance: 0.85,
      index
    });
  }
  
  // Three White Soldiers
  if (c1Bullish && c2Bullish && c3Bullish &&
      c2.close > c1.close && c3.close > c2.close &&
      c2.open > c1.open && c3.open > c2.open) {
    patterns.push({
      name: 'Three White Soldiers',
      type: 'triple',
      direction: 'bullish',
      significance: 0.9,
      index
    });
  }
  
  // Three Black Crows
  if (!c1Bullish && !c2Bullish && !c3Bullish &&
      c2.close < c1.close && c3.close < c2.close &&
      c2.open < c1.open && c3.open < c2.open) {
    patterns.push({
      name: 'Three Black Crows',
      type: 'triple',
      direction: 'bearish',
      significance: 0.9,
      index
    });
  }
  
  return patterns;
}

// ============= Support & Resistance Detection =============

export function detectSupportResistance(prices: PriceData[], sensitivity: number = 0.02): SupportResistance[] {
  const levels: SupportResistance[] = [];
  const highs = prices.map(p => p.high);
  const lows = prices.map(p => p.low);
  const closes = prices.map(p => p.close);
  
  // Find local extrema
  const localMaxima: number[] = [];
  const localMinima: number[] = [];
  
  for (let i = 2; i < prices.length - 2; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
      localMaxima.push(highs[i]);
    }
    
    if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
        lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
      localMinima.push(lows[i]);
    }
  }
  
  // Cluster levels
  const allLevels = [...localMaxima, ...localMinima];
  const clusters = clusterLevels(allLevels, sensitivity);
  
  const currentPrice = closes[closes.length - 1];
  
  for (const cluster of clusters) {
    const level = cluster.reduce((a, b) => a + b, 0) / cluster.length;
    const type = level > currentPrice ? 'resistance' : 'support';
    const touches = cluster.length;
    
    // Check if level is being tested
    const isBreaking = Math.abs(currentPrice - level) / level < sensitivity * 0.5;
    
    levels.push({
      level,
      type,
      strength: Math.min(1, touches / 5),
      touches,
      isBreaking
    });
  }
  
  return levels.sort((a, b) => Math.abs(currentPrice - a.level) - Math.abs(currentPrice - b.level));
}

function clusterLevels(levels: number[], sensitivity: number): number[][] {
  if (levels.length === 0) return [];
  
  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]]];
  
  for (let i = 1; i < sorted.length; i++) {
    const lastCluster = clusters[clusters.length - 1];
    const lastLevel = lastCluster[lastCluster.length - 1];
    
    if ((sorted[i] - lastLevel) / lastLevel < sensitivity) {
      lastCluster.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  
  return clusters;
}

// ============= Trendline Detection =============

export function detectTrendLines(prices: PriceData[], minTouches: number = 3): TrendLine[] {
  const trendlines: TrendLine[] = [];
  const highs = prices.map(p => p.high);
  const lows = prices.map(p => p.low);
  
  // Find potential trendline points for resistance (highs)
  const highPoints = findTrendlinePoints(highs, true, minTouches);
  for (const line of highPoints) {
    trendlines.push({
      startPoint: { index: line.start, price: highs[line.start] },
      endPoint: { index: line.end, price: highs[line.end] },
      slope: line.slope,
      type: 'resistance',
      strength: line.touches / (minTouches * 2)
    });
  }
  
  // Find potential trendline points for support (lows)
  const lowPoints = findTrendlinePoints(lows, false, minTouches);
  for (const line of lowPoints) {
    trendlines.push({
      startPoint: { index: line.start, price: lows[line.start] },
      endPoint: { index: line.end, price: lows[line.end] },
      slope: line.slope,
      type: 'support',
      strength: line.touches / (minTouches * 2)
    });
  }
  
  return trendlines;
}

function findTrendlinePoints(
  data: number[], 
  isResistance: boolean, 
  minTouches: number
): { start: number; end: number; slope: number; touches: number }[] {
  const lines: { start: number; end: number; slope: number; touches: number }[] = [];
  const tolerance = 0.01;
  
  for (let i = 0; i < data.length - minTouches; i++) {
    for (let j = i + 2; j < data.length; j++) {
      const slope = (data[j] - data[i]) / (j - i);
      
      // Count touches
      let touches = 2;
      for (let k = i + 1; k < j; k++) {
        const expectedValue = data[i] + slope * (k - i);
        const diff = Math.abs(data[k] - expectedValue) / expectedValue;
        
        if (diff < tolerance) {
          touches++;
        }
      }
      
      if (touches >= minTouches) {
        lines.push({ start: i, end: j, slope, touches });
      }
    }
  }
  
  return lines;
}
