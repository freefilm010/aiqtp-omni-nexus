/**
 * Market Regime Detection - Advanced State Classification
 * Hidden Markov Models, Clustering, and Regime Switching
 */

export type MarketRegime = 
  | 'bull_strong'
  | 'bull_weak'
  | 'bear_strong'
  | 'bear_weak'
  | 'sideways_high_vol'
  | 'sideways_low_vol'
  | 'crisis'
  | 'recovery';

export interface RegimeState {
  regime: MarketRegime;
  probability: number;
  duration: number;
  features: RegimeFeatures;
  transitionProbabilities: Map<MarketRegime, number>;
}

export interface RegimeFeatures {
  trend: number;
  volatility: number;
  momentum: number;
  volume: number;
  correlation: number;
  vix: number;
}

export interface RegimeTransition {
  from: MarketRegime;
  to: MarketRegime;
  probability: number;
  expectedDuration: number;
}

// ============= Hidden Markov Model =============

export class HiddenMarkovModel {
  private numStates: number;
  private numObservations: number;
  private transitionMatrix: number[][];
  private emissionMatrix: number[][];
  private initialProbabilities: number[];

  constructor(numStates: number, numObservations: number) {
    this.numStates = numStates;
    this.numObservations = numObservations;
    this.transitionMatrix = [];
    this.emissionMatrix = [];
    this.initialProbabilities = [];
    this.initialize();
  }

  private initialize(): void {
    // Initialize transition matrix
    this.transitionMatrix = Array(this.numStates).fill(null).map(() => {
      const row = Array(this.numStates).fill(1 / this.numStates);
      return row;
    });

    // Initialize emission matrix
    this.emissionMatrix = Array(this.numStates).fill(null).map(() => {
      const row = Array(this.numObservations).fill(1 / this.numObservations);
      return row;
    });

    // Initialize initial probabilities
    this.initialProbabilities = Array(this.numStates).fill(1 / this.numStates);
  }

  // Viterbi algorithm for most likely sequence
  viterbi(observations: number[]): number[] {
    const T = observations.length;
    const N = this.numStates;
    
    const viterbi: number[][] = Array(T).fill(null).map(() => Array(N).fill(0));
    const backpointer: number[][] = Array(T).fill(null).map(() => Array(N).fill(0));
    
    // Initialization
    for (let s = 0; s < N; s++) {
      viterbi[0][s] = this.initialProbabilities[s] * this.emissionMatrix[s][observations[0]];
      backpointer[0][s] = 0;
    }
    
    // Recursion
    for (let t = 1; t < T; t++) {
      for (let s = 0; s < N; s++) {
        let maxProb = 0;
        let maxState = 0;
        
        for (let sPrev = 0; sPrev < N; sPrev++) {
          const prob = viterbi[t - 1][sPrev] * this.transitionMatrix[sPrev][s];
          if (prob > maxProb) {
            maxProb = prob;
            maxState = sPrev;
          }
        }
        
        viterbi[t][s] = maxProb * this.emissionMatrix[s][observations[t]];
        backpointer[t][s] = maxState;
      }
    }
    
    // Backtrack
    const path: number[] = Array(T).fill(0);
    path[T - 1] = viterbi[T - 1].indexOf(Math.max(...viterbi[T - 1]));
    
    for (let t = T - 2; t >= 0; t--) {
      path[t] = backpointer[t + 1][path[t + 1]];
    }
    
    return path;
  }

  // Forward algorithm for probability calculation
  forward(observations: number[]): number[][] {
    const T = observations.length;
    const N = this.numStates;
    const alpha: number[][] = Array(T).fill(null).map(() => Array(N).fill(0));
    
    // Initialization
    for (let s = 0; s < N; s++) {
      alpha[0][s] = this.initialProbabilities[s] * this.emissionMatrix[s][observations[0]];
    }
    
    // Induction
    for (let t = 1; t < T; t++) {
      for (let s = 0; s < N; s++) {
        let sum = 0;
        for (let sPrev = 0; sPrev < N; sPrev++) {
          sum += alpha[t - 1][sPrev] * this.transitionMatrix[sPrev][s];
        }
        alpha[t][s] = sum * this.emissionMatrix[s][observations[t]];
      }
    }
    
    return alpha;
  }

  // Backward algorithm
  backward(observations: number[]): number[][] {
    const T = observations.length;
    const N = this.numStates;
    const beta: number[][] = Array(T).fill(null).map(() => Array(N).fill(0));
    
    // Initialization
    for (let s = 0; s < N; s++) {
      beta[T - 1][s] = 1;
    }
    
    // Induction
    for (let t = T - 2; t >= 0; t--) {
      for (let s = 0; s < N; s++) {
        let sum = 0;
        for (let sNext = 0; sNext < N; sNext++) {
          sum += this.transitionMatrix[s][sNext] * 
                 this.emissionMatrix[sNext][observations[t + 1]] * 
                 beta[t + 1][sNext];
        }
        beta[t][s] = sum;
      }
    }
    
    return beta;
  }

  // Baum-Welch training
  train(observations: number[][], maxIterations: number = 100, tolerance: number = 0.001): void {
    for (let iter = 0; iter < maxIterations; iter++) {
      const newTransition = Array(this.numStates).fill(null).map(() => 
        Array(this.numStates).fill(0)
      );
      const newEmission = Array(this.numStates).fill(null).map(() => 
        Array(this.numObservations).fill(0)
      );
      const newInitial = Array(this.numStates).fill(0);
      
      for (const obs of observations) {
        const alpha = this.forward(obs);
        const beta = this.backward(obs);
        
        // Calculate xi and gamma
        for (let t = 0; t < obs.length - 1; t++) {
          let denominator = 0;
          for (let i = 0; i < this.numStates; i++) {
            for (let j = 0; j < this.numStates; j++) {
              denominator += alpha[t][i] * this.transitionMatrix[i][j] * 
                            this.emissionMatrix[j][obs[t + 1]] * beta[t + 1][j];
            }
          }
          
          for (let i = 0; i < this.numStates; i++) {
            for (let j = 0; j < this.numStates; j++) {
              if (denominator > 0) {
                const xi = (alpha[t][i] * this.transitionMatrix[i][j] * 
                           this.emissionMatrix[j][obs[t + 1]] * beta[t + 1][j]) / denominator;
                newTransition[i][j] += xi;
              }
            }
          }
        }
        
        // Update emission counts
        for (let t = 0; t < obs.length; t++) {
          let denominator = 0;
          for (let i = 0; i < this.numStates; i++) {
            denominator += alpha[t][i] * beta[t][i];
          }
          
          for (let i = 0; i < this.numStates; i++) {
            if (denominator > 0) {
              const gamma = (alpha[t][i] * beta[t][i]) / denominator;
              newEmission[i][obs[t]] += gamma;
            }
          }
        }
        
        // Update initial probabilities
        let initDenom = 0;
        for (let i = 0; i < this.numStates; i++) {
          initDenom += alpha[0][i] * beta[0][i];
        }
        for (let i = 0; i < this.numStates; i++) {
          if (initDenom > 0) {
            newInitial[i] += (alpha[0][i] * beta[0][i]) / initDenom;
          }
        }
      }
      
      // Normalize and update
      for (let i = 0; i < this.numStates; i++) {
        const transSum = newTransition[i].reduce((a, b) => a + b, 0);
        if (transSum > 0) {
          for (let j = 0; j < this.numStates; j++) {
            this.transitionMatrix[i][j] = newTransition[i][j] / transSum;
          }
        }
        
        const emitSum = newEmission[i].reduce((a, b) => a + b, 0);
        if (emitSum > 0) {
          for (let k = 0; k < this.numObservations; k++) {
            this.emissionMatrix[i][k] = newEmission[i][k] / emitSum;
          }
        }
      }
      
      const initSum = newInitial.reduce((a, b) => a + b, 0);
      if (initSum > 0) {
        this.initialProbabilities = newInitial.map(p => p / initSum);
      }
    }
  }

  getCurrentState(observations: number[]): { state: number; probability: number } {
    const alpha = this.forward(observations);
    const lastAlpha = alpha[alpha.length - 1];
    const maxProb = Math.max(...lastAlpha);
    const state = lastAlpha.indexOf(maxProb);
    const totalProb = lastAlpha.reduce((a, b) => a + b, 0);
    
    return {
      state,
      probability: totalProb > 0 ? maxProb / totalProb : 0
    };
  }
}

// ============= K-Means Clustering for Regime Detection =============

export class KMeansClustering {
  private k: number;
  private centroids: number[][] = [];
  private maxIterations: number;

  constructor(k: number, maxIterations: number = 100) {
    this.k = k;
    this.maxIterations = maxIterations;
  }

  fit(data: number[][]): void {
    // Initialize centroids randomly
    const indices = this.getRandomIndices(data.length, this.k);
    this.centroids = indices.map(i => [...data[i]]);
    
    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Assign clusters
      const clusters: number[][] = Array(this.k).fill(null).map(() => []);
      
      for (let i = 0; i < data.length; i++) {
        const cluster = this.predict(data[i]);
        clusters[cluster].push(i);
      }
      
      // Update centroids
      const newCentroids = clusters.map((cluster, k) => {
        if (cluster.length === 0) return this.centroids[k];
        
        const numFeatures = data[0].length;
        const centroid: number[] = [];
        
        for (let j = 0; j < numFeatures; j++) {
          const sum = cluster.reduce((acc, idx) => acc + data[idx][j], 0);
          centroid.push(sum / cluster.length);
        }
        
        return centroid;
      });
      
      // Check convergence
      let converged = true;
      for (let i = 0; i < this.k; i++) {
        const dist = this.euclideanDistance(this.centroids[i], newCentroids[i]);
        if (dist > 0.0001) {
          converged = false;
          break;
        }
      }
      
      this.centroids = newCentroids;
      
      if (converged) break;
    }
  }

  predict(point: number[]): number {
    let minDist = Infinity;
    let cluster = 0;
    
    for (let k = 0; k < this.centroids.length; k++) {
      const dist = this.euclideanDistance(point, this.centroids[k]);
      if (dist < minDist) {
        minDist = dist;
        cluster = k;
      }
    }
    
    return cluster;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, ai, i) => sum + Math.pow(ai - b[i], 2), 0));
  }

  private getRandomIndices(n: number, k: number): number[] {
    const indices: number[] = [];
    while (indices.length < k) {
      const idx = Math.floor(Math.random() * n);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    return indices;
  }

  getCentroids(): number[][] {
    return this.centroids;
  }
}

// ============= Regime Detection Engine =============

export class RegimeDetector {
  private hmm: HiddenMarkovModel;
  private clustering: KMeansClustering;
  private regimeHistory: MarketRegime[] = [];
  private lookbackPeriod: number;

  constructor(lookbackPeriod: number = 60) {
    this.lookbackPeriod = lookbackPeriod;
    this.hmm = new HiddenMarkovModel(8, 10); // 8 regimes, 10 observation buckets
    this.clustering = new KMeansClustering(8);
  }

  detectRegime(features: RegimeFeatures[]): RegimeState {
    // Convert features to observations
    const observations = this.featuresToObservations(features);
    
    // Get HMM state
    const hmmResult = this.hmm.getCurrentState(observations);
    
    // Map state to regime
    const regime = this.stateToRegime(hmmResult.state, features[features.length - 1]);
    
    // Calculate duration
    let duration = 1;
    for (let i = this.regimeHistory.length - 1; i >= 0; i--) {
      if (this.regimeHistory[i] === regime) {
        duration++;
      } else {
        break;
      }
    }
    
    // Update history
    this.regimeHistory.push(regime);
    if (this.regimeHistory.length > this.lookbackPeriod * 5) {
      this.regimeHistory.shift();
    }
    
    // Calculate transition probabilities
    const transitions = this.calculateTransitionProbabilities();
    
    return {
      regime,
      probability: hmmResult.probability,
      duration,
      features: features[features.length - 1],
      transitionProbabilities: transitions
    };
  }

  private featuresToObservations(features: RegimeFeatures[]): number[] {
    return features.map(f => {
      // Discretize features into observation buckets
      const score = 
        (f.trend > 0 ? 2 : 0) +
        (f.volatility > 0.2 ? 4 : 0) +
        (f.momentum > 0 ? 1 : 0);
      
      return Math.min(9, Math.max(0, score));
    });
  }

  private stateToRegime(state: number, features: RegimeFeatures): MarketRegime {
    const { trend, volatility, momentum, vix } = features;
    
    if (vix > 0.4) return 'crisis';
    
    if (trend > 0.02 && momentum > 0) {
      return volatility > 0.2 ? 'bull_weak' : 'bull_strong';
    }
    
    if (trend < -0.02 && momentum < 0) {
      return volatility > 0.2 ? 'bear_strong' : 'bear_weak';
    }
    
    if (trend > 0 && trend < 0.02) {
      return 'recovery';
    }
    
    return volatility > 0.15 ? 'sideways_high_vol' : 'sideways_low_vol';
  }

  private calculateTransitionProbabilities(): Map<MarketRegime, number> {
    const transitions = new Map<MarketRegime, number>();
    const regimes: MarketRegime[] = [
      'bull_strong', 'bull_weak', 'bear_strong', 'bear_weak',
      'sideways_high_vol', 'sideways_low_vol', 'crisis', 'recovery'
    ];
    
    if (this.regimeHistory.length < 2) {
      regimes.forEach(r => transitions.set(r, 1 / regimes.length));
      return transitions;
    }
    
    const currentRegime = this.regimeHistory[this.regimeHistory.length - 1];
    const counts = new Map<MarketRegime, number>();
    let total = 0;
    
    for (let i = 0; i < this.regimeHistory.length - 1; i++) {
      if (this.regimeHistory[i] === currentRegime) {
        const nextRegime = this.regimeHistory[i + 1];
        counts.set(nextRegime, (counts.get(nextRegime) || 0) + 1);
        total++;
      }
    }
    
    regimes.forEach(r => {
      transitions.set(r, total > 0 ? (counts.get(r) || 0) / total : 1 / regimes.length);
    });
    
    return transitions;
  }

  train(historicalFeatures: RegimeFeatures[][]): void {
    const observations = historicalFeatures.map(f => this.featuresToObservations(f));
    this.hmm.train(observations);
    
    // Also train clustering
    const flatFeatures = historicalFeatures.flat().map(f => [
      f.trend, f.volatility, f.momentum, f.volume, f.correlation, f.vix
    ]);
    this.clustering.fit(flatFeatures);
  }

  getRegimeStatistics(): Map<MarketRegime, { avgDuration: number; frequency: number }> {
    const stats = new Map<MarketRegime, { avgDuration: number; frequency: number }>();
    const regimes: MarketRegime[] = [
      'bull_strong', 'bull_weak', 'bear_strong', 'bear_weak',
      'sideways_high_vol', 'sideways_low_vol', 'crisis', 'recovery'
    ];
    
    regimes.forEach(regime => {
      const occurrences: number[] = [];
      let currentDuration = 0;
      
      for (const r of this.regimeHistory) {
        if (r === regime) {
          currentDuration++;
        } else if (currentDuration > 0) {
          occurrences.push(currentDuration);
          currentDuration = 0;
        }
      }
      if (currentDuration > 0) {
        occurrences.push(currentDuration);
      }
      
      const avgDuration = occurrences.length > 0 
        ? occurrences.reduce((a, b) => a + b, 0) / occurrences.length 
        : 0;
      const frequency = this.regimeHistory.length > 0 
        ? this.regimeHistory.filter(r => r === regime).length / this.regimeHistory.length 
        : 0;
      
      stats.set(regime, { avgDuration, frequency });
    });
    
    return stats;
  }
}

// ============= Calculate Regime Features from Price Data =============

export function calculateRegimeFeatures(
  prices: { close: number; volume: number }[],
  period: number = 20
): RegimeFeatures {
  if (prices.length < period) {
    return {
      trend: 0,
      volatility: 0.1,
      momentum: 0,
      volume: 1,
      correlation: 0,
      vix: 0.15
    };
  }
  
  const recentPrices = prices.slice(-period);
  const closes = recentPrices.map(p => p.close);
  const volumes = recentPrices.map(p => p.volume);
  
  // Trend: Linear regression slope
  const n = closes.length;
  const xMean = (n - 1) / 2;
  const yMean = closes.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (closes[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }
  const trend = denominator !== 0 ? (numerator / denominator) / yMean : 0;
  
  // Volatility: Standard deviation of returns
  const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const returnMean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - returnMean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance * 252);
  
  // Momentum: Rate of change
  const momentum = (closes[n - 1] - closes[0]) / closes[0];
  
  // Volume: Relative to average
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const volume = avgVolume > 0 ? volumes[n - 1] / avgVolume : 1;
  
  // Correlation: Between price and volume changes
  const priceChanges = closes.slice(1).map((c, i) => c - closes[i]);
  const volumeChanges = volumes.slice(1).map((v, i) => v - volumes[i]);
  
  let correlation = 0;
  if (priceChanges.length > 0) {
    const pcMean = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const vcMean = volumeChanges.reduce((a, b) => a + b, 0) / volumeChanges.length;
    
    let num = 0, denP = 0, denV = 0;
    for (let i = 0; i < priceChanges.length; i++) {
      num += (priceChanges[i] - pcMean) * (volumeChanges[i] - vcMean);
      denP += Math.pow(priceChanges[i] - pcMean, 2);
      denV += Math.pow(volumeChanges[i] - vcMean, 2);
    }
    const den = Math.sqrt(denP * denV);
    correlation = den > 0 ? num / den : 0;
  }
  
  // VIX proxy: Based on volatility and trend
  const vix = volatility * (1 + Math.abs(momentum));
  
  return { trend, volatility, momentum, volume, correlation, vix };
}
