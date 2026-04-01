/**
 * Behavioral Market Agents
 * Fear/greed, herding, anchoring, and sentiment-driven trading.
 */

export interface SentimentState {
  priceTrend: number;    // positive = up
  volatility: number;    // 0-1+
  sentiment: number;     // -1 (panic) to 1 (euphoria)
  recentDrawdown: number;
}

export interface BehavioralSignal {
  agentId: string;
  direction: number;  // -1 sell, 0 hold, 1 buy
  intensity: number;  // 0-1
  reason: string;
}

export interface BehavioralAgent {
  id: string;
  name: string;
  act(state: SentimentState): BehavioralSignal;
}

// ── Fear/Greed Agent ────────────────────────────────────────

export const fearGreedAgent: BehavioralAgent = {
  id: "fear_greed",
  name: "Fear/Greed Trader",
  act(state) {
    // FOMO in euphoria, panic sell in fear
    if (state.sentiment > 0.6) {
      return { agentId: "fear_greed", direction: 1, intensity: state.sentiment, reason: "FOMO buying" };
    }
    if (state.sentiment < -0.5) {
      return { agentId: "fear_greed", direction: -1, intensity: Math.abs(state.sentiment), reason: "Panic selling" };
    }
    return { agentId: "fear_greed", direction: state.priceTrend > 0 ? 1 : -1, intensity: 0.3, reason: "Trend following" };
  },
};

// ── Herding Agent ───────────────────────────────────────────

export const herdingAgent: BehavioralAgent = {
  id: "herding",
  name: "Herd Follower",
  act(state) {
    // Follows majority; amplifies moves
    const direction = state.priceTrend > 0 ? 1 : -1;
    const intensity = Math.min(1, Math.abs(state.priceTrend) * 2);
    return {
      agentId: "herding",
      direction,
      intensity,
      reason: direction > 0 ? "Following bullish crowd" : "Following bearish crowd",
    };
  },
};

// ── Anchoring Agent ─────────────────────────────────────────

export const anchoringAgent: BehavioralAgent = {
  id: "anchoring",
  name: "Anchored Trader",
  act(state) {
    // Anchored to recent price; buys dips, sells rips (contrarian)
    if (state.recentDrawdown > 0.1) {
      return { agentId: "anchoring", direction: 1, intensity: 0.7, reason: "Buy the dip (anchored)" };
    }
    if (state.priceTrend > 0.1) {
      return { agentId: "anchoring", direction: -1, intensity: 0.5, reason: "Sell the rip (anchored)" };
    }
    return { agentId: "anchoring", direction: 0, intensity: 0, reason: "Holding (anchored)" };
  },
};

// ── Overconfidence Agent ────────────────────────────────────

export const overconfidenceAgent: BehavioralAgent = {
  id: "overconfident",
  name: "Overconfident Trader",
  act(state) {
    // Always trades, high conviction, ignores risk
    const direction = state.priceTrend > 0 ? 1 : -1;
    return {
      agentId: "overconfident",
      direction,
      intensity: 0.9, // always high conviction
      reason: "I know what's happening",
    };
  },
};

// ── Sentiment Calculator ────────────────────────────────────

export function computeMarketSentiment(
  newsScore: number,      // -1 to 1
  socialScore: number,     // -1 to 1
  priceChange24h: number   // percentage
): number {
  const raw = newsScore * 0.3 + socialScore * 0.3 + Math.tanh(priceChange24h * 5) * 0.4;
  return Math.max(-1, Math.min(1, raw));
}

/** Aggregate behavioral signals into a net market force. */
export function aggregateBehavior(signals: BehavioralSignal[]): {
  netDirection: number;
  avgIntensity: number;
  dominantBias: string;
} {
  if (signals.length === 0) return { netDirection: 0, avgIntensity: 0, dominantBias: "none" };

  const net = signals.reduce((s, sig) => s + sig.direction * sig.intensity, 0) / signals.length;
  const avgIntensity = signals.reduce((s, sig) => s + sig.intensity, 0) / signals.length;

  const strongest = signals.reduce((a, b) => (b.intensity > a.intensity ? b : a));

  return {
    netDirection: Math.max(-1, Math.min(1, net)),
    avgIntensity,
    dominantBias: strongest.reason,
  };
}
