/**
 * Collective Consciousness Engine
 * Belief fields, emergent clustering, and synchronization dynamics.
 */

// ── Belief Field ────────────────────────────────────────────

export class BeliefField {
  value = 0;
  history: number[] = [];

  update(agentBeliefs: number[], priceChange: number, decayRate = 0.05): number {
    if (agentBeliefs.length === 0) return this.value;

    const avg = agentBeliefs.reduce((a, b) => a + b, 0) / agentBeliefs.length;

    this.value =
      (1 - decayRate) * (0.6 * this.value + 0.3 * avg + 0.1 * Math.tanh(priceChange * 5));

    this.history.push(this.value);
    if (this.history.length > 500) this.history.shift();
    return this.value;
  }

  get momentum(): number {
    const h = this.history;
    if (h.length < 5) return 0;
    return h[h.length - 1] - h[h.length - 5];
  }
}

// ── Agent Profile (for clustering) ──────────────────────────

export interface ClusterableAgent {
  id: string;
  belief: number;
  risk: number;
  momentum: number;
}

export interface AgentCluster {
  centroid: { belief: number; risk: number; momentum: number };
  members: ClusterableAgent[];
  narrative: string;
}

/** Greedy single-pass clustering by belief/risk/momentum similarity. */
export function formClusters(
  agents: ClusterableAgent[],
  similarityThreshold = 0.65
): AgentCluster[] {
  const clusters: AgentCluster[] = [];

  for (const agent of agents) {
    let placed = false;

    for (const cluster of clusters) {
      const c = cluster.centroid;
      const dist =
        Math.abs(agent.belief - c.belief) * 0.5 +
        Math.abs(agent.risk - c.risk) * 0.3 +
        Math.abs(agent.momentum - c.momentum) * 0.2;

      if (1 - dist > similarityThreshold) {
        cluster.members.push(agent);
        // Update centroid incrementally
        const n = cluster.members.length;
        c.belief = c.belief + (agent.belief - c.belief) / n;
        c.risk = c.risk + (agent.risk - c.risk) / n;
        c.momentum = c.momentum + (agent.momentum - c.momentum) / n;
        placed = true;
        break;
      }
    }

    if (!placed) {
      clusters.push({
        centroid: { belief: agent.belief, risk: agent.risk, momentum: agent.momentum },
        members: [agent],
        narrative: "",
      });
    }
  }

  // Assign narratives
  for (const cluster of clusters) {
    cluster.narrative = classifyCluster(cluster);
  }

  return clusters;
}

function classifyCluster(c: AgentCluster): string {
  const { belief, risk } = c.centroid;
  if (belief > 0.4 && risk > 0.5) return "aggressive_bulls";
  if (belief > 0.3 && risk <= 0.5) return "cautious_optimists";
  if (belief < -0.4 && risk > 0.5) return "panic_sellers";
  if (belief < -0.3 && risk <= 0.5) return "defensive_bears";
  if (Math.abs(belief) < 0.15) return "neutral_liquidity";
  return "mixed";
}

// ── Synchronization Dynamics ────────────────────────────────

/** Kuramoto-inspired belief synchronization. Agents pull toward mean. */
export function synchronizeBeliefs(
  beliefs: number[],
  coupling = 0.1
): number[] {
  if (beliefs.length === 0) return [];
  const avg = beliefs.reduce((a, b) => a + b, 0) / beliefs.length;
  return beliefs.map((b) => b + coupling * (avg - b));
}

/** Detect phase-lock: all agents nearly synchronized. */
export function phaseLockScore(beliefs: number[]): number {
  if (beliefs.length < 2) return 1;
  const avg = beliefs.reduce((a, b) => a + b, 0) / beliefs.length;
  const variance = beliefs.reduce((s, b) => s + (b - avg) ** 2, 0) / beliefs.length;
  return 1 / (1 + variance * 20);
}
