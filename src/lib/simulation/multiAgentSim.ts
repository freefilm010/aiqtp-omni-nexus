/**
 * Multi-Agent Market Simulation
 * Competing strategies trading on a shared microstructure book.
 */

import {
  MicrostructureBook,
  type Trade,
} from "@/lib/microstructure/limitOrderBook";

// ── Agent Interface ─────────────────────────────────────────

export interface MarketState {
  midPrice: number;
  spread: number;
  prices: number[];        // recent price history
  tick: number;
}

export interface AgentOrder {
  side: "bid" | "ask";
  price: number;
  size: number;
}

export interface SimAgent {
  id: string;
  name: string;
  act(state: MarketState): AgentOrder[];
}

// ── Built-in Agents ─────────────────────────────────────────

export const momentumAgent: SimAgent = {
  id: "momentum",
  name: "Momentum Trader",
  act(state) {
    if (state.prices.length < 6) return [];
    const trend = state.prices[state.prices.length - 1] - state.prices[state.prices.length - 5];
    const side: "bid" | "ask" = trend > 0 ? "bid" : "ask";
    return [{ side, price: state.midPrice + (side === "bid" ? -0.5 : 0.5) * state.spread, size: 1 }];
  },
};

export const meanReversionAgent: SimAgent = {
  id: "mean_revert",
  name: "Mean Reversion",
  act(state) {
    if (state.prices.length < 20) return [];
    const mean = state.prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const deviation = state.midPrice - mean;
    if (Math.abs(deviation) < state.spread) return [];
    const side: "bid" | "ask" = deviation > 0 ? "ask" : "bid";
    return [{ side, price: state.midPrice, size: 1 }];
  },
};

export const marketMaker: SimAgent = {
  id: "market_maker",
  name: "Market Maker",
  act(state) {
    const halfSpread = state.spread * 0.6;
    return [
      { side: "bid", price: state.midPrice - halfSpread, size: 5 },
      { side: "ask", price: state.midPrice + halfSpread, size: 5 },
    ];
  },
};

export const noiseTrader: SimAgent = {
  id: "noise",
  name: "Noise Trader",
  act(state) {
    if (Math.random() < 0.7) return []; // mostly inactive
    const side: "bid" | "ask" = Math.random() > 0.5 ? "bid" : "ask";
    const offset = (Math.random() - 0.5) * state.spread * 2;
    return [{ side, price: state.midPrice + offset, size: Math.ceil(Math.random() * 3) }];
  },
};

// ── Market Simulator ────────────────────────────────────────

export interface SimConfig {
  initialPrice: number;
  ticks: number;
  agents: SimAgent[];
}

export interface SimResult {
  priceHistory: number[];
  tradeHistory: Trade[];
  agentPnL: Record<string, number>;
}

export function runMarketSimulation(config: SimConfig): SimResult {
  const book = new MicrostructureBook();
  const prices: number[] = [config.initialPrice];
  let orderSeq = 0;

  // Track agent positions for PnL
  const positions: Record<string, { qty: number; cash: number }> = {};
  for (const a of config.agents) {
    positions[a.id] = { qty: 0, cash: 0 };
  }

  for (let tick = 0; tick < config.ticks; tick++) {
    const snap = book.snapshot();
    const midPrice = snap.midPrice > 0 && isFinite(snap.midPrice) ? snap.midPrice : prices[prices.length - 1];
    const spread = snap.spread > 0 && isFinite(snap.spread) ? snap.spread : midPrice * 0.002;

    const state: MarketState = { midPrice, spread, prices: [...prices], tick };

    for (const agent of config.agents) {
      const orders = agent.act(state);
      for (const o of orders) {
        const trades = book.submit({
          id: `${agent.id}_${orderSeq++}`,
          price: +o.price.toFixed(2),
          size: o.size,
          side: o.side,
          timestamp: tick,
        });

        // Attribute trades
        for (const t of trades) {
          // Simplified: attribute to the agent that submitted
          const sign = o.side === "bid" ? 1 : -1;
          positions[agent.id].qty += sign * t.size;
          positions[agent.id].cash -= sign * t.size * t.price;
        }
      }
    }

    const newSnap = book.snapshot();
    const newMid = newSnap.midPrice > 0 && isFinite(newSnap.midPrice) ? newSnap.midPrice : prices[prices.length - 1];
    prices.push(newMid);
  }

  // Final PnL: cash + position * last price
  const lastPrice = prices[prices.length - 1];
  const agentPnL: Record<string, number> = {};
  for (const [id, pos] of Object.entries(positions)) {
    agentPnL[id] = pos.cash + pos.qty * lastPrice;
  }

  return {
    priceHistory: prices,
    tradeHistory: book.tradeHistory,
    agentPnL,
  };
}
