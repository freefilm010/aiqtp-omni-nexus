/**
 * Observer-Dependent Market Engine
 * Price = f(supply, demand, belief). Reality bends toward consensus.
 */

export interface Observer {
  id: string;
  attention: number;   // 0-1, market reality influence
  belief: number;      // -1 bearish … +1 bullish
  conviction: number;  // 0-1
}

export interface ObserverPriceResult {
  price: number;
  sentiment: number;
  liquidity: number;
  beliefDispersion: number;
}

export class ObserverMarket {
  price: number;
  history: number[] = [];

  constructor(initialPrice: number) {
    this.price = initialPrice;
    this.history.push(initialPrice);
  }

  computePrice(observers: Observer[]): ObserverPriceResult {
    if (observers.length === 0) {
      return { price: this.price, sentiment: 0, liquidity: 0, beliefDispersion: 0 };
    }

    let weightedBelief = 0;
    let totalAttention = 0;
    let liquiditySum = 0;

    for (const o of observers) {
      weightedBelief += o.belief * o.attention * o.conviction;
      totalAttention += o.attention;
      liquiditySum += o.attention * o.conviction;
    }

    const sentiment = totalAttention > 0 ? weightedBelief / totalAttention : 0;

    // Belief dispersion — high = unstable consensus
    const meanBelief = observers.reduce((s, o) => s + o.belief, 0) / observers.length;
    const beliefDispersion = Math.sqrt(
      observers.reduce((s, o) => s + (o.belief - meanBelief) ** 2, 0) / observers.length
    );

    // Reality bends toward belief; dispersion amplifies volatility
    const beliefForce = sentiment * this.price * 0.01;
    const noise = (Math.random() - 0.5) * beliefDispersion * this.price * 0.02;

    this.price = Math.max(0.01, this.price + beliefForce + noise);
    this.history.push(this.price);

    return { price: this.price, sentiment, liquidity: liquiditySum, beliefDispersion };
  }
}

/** Compute consciousness-weighted liquidity. */
export function computeConsciousLiquidity(observers: Observer[]): number {
  return observers.reduce((acc, o) => acc + o.attention * o.conviction, 0);
}

/** Flash crash detector: low attention + high dispersion = instability. */
export function flashCrashRisk(observers: Observer[]): number {
  const liquidity = computeConsciousLiquidity(observers);
  const meanBelief = observers.reduce((s, o) => s + o.belief, 0) / (observers.length || 1);
  const dispersion = Math.sqrt(
    observers.reduce((s, o) => s + (o.belief - meanBelief) ** 2, 0) / (observers.length || 1)
  );
  return liquidity > 0 ? dispersion / liquidity : 1;
}
