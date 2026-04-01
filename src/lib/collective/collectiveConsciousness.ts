/**
 * Collective Consciousness Engine
 * Detects emergent collusion, belief-field alignment, and herd behavior
 * among competing agents without explicit coordination.
 */

export interface AgentAction {
  agentId: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
}

export interface CollusionCluster {
  action: "BUY" | "SELL" | "HOLD";
  agents: string[];
  pressure: number;
}

export interface BeliefField {
  bullish: number;     // 0-1
  bearish: number;     // 0-1
  consensus: number;   // 0-1 how aligned the population is
  dominantSentiment: "BUY" | "SELL" | "NEUTRAL";
}

export class CollectiveConsciousnessEngine {
  private history: AgentAction[][] = [];
  private maxHistory = 50;

  /** Detect collusion clusters from a tick of agent actions */
  detectClusters(actions: AgentAction[]): CollusionCluster[] {
    const buckets: Record<string, AgentAction[]> = {};
    for (const a of actions) {
      if (!buckets[a.action]) buckets[a.action] = [];
      buckets[a.action].push(a);
    }

    return Object.entries(buckets)
      .filter(([, agents]) => agents.length >= 2)
      .map(([action, agents]) => ({
        action: action as "BUY" | "SELL" | "HOLD",
        agents: agents.map(a => a.agentId),
        pressure: agents.reduce((s, a) => s + a.confidence, 0) / agents.length,
      }));
  }

  /** Compute aggregate collusion pressure (0 = independent, 1 = total herding) */
  getCollusionPressure(actions: AgentAction[]): number {
    if (actions.length === 0) return 0;
    const clusters = this.detectClusters(actions);
    const maxCluster = Math.max(0, ...clusters.map(c => c.agents.length));
    return maxCluster / actions.length;
  }

  /** Build a belief-field from recent action history */
  computeBeliefField(actions: AgentAction[]): BeliefField {
    this.history.push(actions);
    if (this.history.length > this.maxHistory) this.history.shift();

    let buys = 0, sells = 0, holds = 0;
    for (const a of actions) {
      if (a.action === "BUY") buys++;
      else if (a.action === "SELL") sells++;
      else holds++;
    }
    const total = actions.length || 1;
    const bullish = buys / total;
    const bearish = sells / total;
    const consensus = Math.max(bullish, bearish, holds / total);
    const dominantSentiment = bullish > bearish
      ? (bullish > holds / total ? "BUY" : "NEUTRAL")
      : (bearish > holds / total ? "SELL" : "NEUTRAL");

    return { bullish, bearish, consensus, dominantSentiment };
  }

  /** Measure herding tendency over time (moving alignment score) */
  getHerdingTrend(): number[] {
    return this.history.map(actions => this.getCollusionPressure(actions));
  }
}
