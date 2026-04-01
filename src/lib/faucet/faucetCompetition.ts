/**
 * Faucet Competition Layer
 * Agents compete for limited faucet liquidity pools.
 * Implements auction-style claim rights and scarcity dynamics.
 */

import { EventBus } from "@/lib/infra/eventBus";

export interface CompetingAgent {
  id: string;
  name: string;
  reputation: number; // 0-1, earned through successful trades
  claimPower: number; // bidding power based on performance
  totalClaimed: number;
  wins: number;
  losses: number;
}

export interface LiquidityPool {
  id: string;
  asset: string;
  totalSupply: number;
  remaining: number;
  claimants: string[]; // agent IDs competing
  refreshIntervalMs: number;
  lastRefresh: number;
  auctionMode: "first-come" | "weighted-lottery" | "reputation-ranked";
}

export interface CompetitionResult {
  poolId: string;
  winnerId: string;
  amount: number;
  competitorCount: number;
  timestamp: number;
}

export class FaucetCompetitionLayer {
  private agents: Map<string, CompetingAgent> = new Map();
  private pools: Map<string, LiquidityPool> = new Map();
  private results: CompetitionResult[] = [];
  private eventBus: EventBus | null;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || null;
  }

  registerAgent(agent: Omit<CompetingAgent, "totalClaimed" | "wins" | "losses">): void {
    this.agents.set(agent.id, {
      ...agent,
      totalClaimed: 0,
      wins: 0,
      losses: 0,
    });
  }

  createPool(config: {
    id: string;
    asset: string;
    totalSupply: number;
    refreshIntervalMs: number;
    auctionMode: LiquidityPool["auctionMode"];
  }): void {
    this.pools.set(config.id, {
      ...config,
      remaining: config.totalSupply,
      claimants: [],
      lastRefresh: Date.now(),
    });
  }

  /** Agent bids for a pool's liquidity */
  bid(agentId: string, poolId: string): void {
    const pool = this.pools.get(poolId);
    const agent = this.agents.get(agentId);
    if (!pool || !agent) return;
    if (!pool.claimants.includes(agentId)) {
      pool.claimants.push(agentId);
    }
  }

  /** Resolve auction for a pool */
  resolveAuction(poolId: string): CompetitionResult | null {
    const pool = this.pools.get(poolId);
    if (!pool || pool.claimants.length === 0 || pool.remaining <= 0) return null;

    let winnerId: string;

    switch (pool.auctionMode) {
      case "first-come":
        winnerId = pool.claimants[0];
        break;

      case "weighted-lottery": {
        const weights = pool.claimants.map(id => {
          const a = this.agents.get(id);
          return a ? a.claimPower + a.reputation : 0.1;
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let idx = 0;
        for (let i = 0; i < weights.length; i++) {
          rand -= weights[i];
          if (rand <= 0) { idx = i; break; }
        }
        winnerId = pool.claimants[idx];
        break;
      }

      case "reputation-ranked": {
        const sorted = [...pool.claimants].sort((a, b) => {
          const agentA = this.agents.get(a);
          const agentB = this.agents.get(b);
          return (agentB?.reputation || 0) - (agentA?.reputation || 0);
        });
        winnerId = sorted[0];
        break;
      }
    }

    const winner = this.agents.get(winnerId);
    if (!winner) return null;

    // Award: proportional to claim power, capped by remaining supply
    const claimAmount = Math.min(
      pool.remaining * 0.1 * (1 + winner.claimPower),
      pool.remaining
    );

    pool.remaining -= claimAmount;
    winner.totalClaimed += claimAmount;
    winner.wins += 1;

    // Update losers
    for (const id of pool.claimants) {
      if (id !== winnerId) {
        const loser = this.agents.get(id);
        if (loser) loser.losses += 1;
      }
    }

    const result: CompetitionResult = {
      poolId,
      winnerId,
      amount: claimAmount,
      competitorCount: pool.claimants.length,
      timestamp: Date.now(),
    };

    this.results.push(result);
    if (this.results.length > 5000) this.results = this.results.slice(-2500);

    // Clear claimants for next round
    pool.claimants = [];

    // Publish event
    if (this.eventBus) {
      this.eventBus.publish({
        type: "MACRO_SHOCK",
        payload: {
          shockType: `faucet_competition:${pool.asset}`,
          magnitude: claimAmount,
          tick: Date.now(),
        },
      });
    }

    return result;
  }

  /** Refresh pools that have expired */
  refreshPools(): void {
    const now = Date.now();
    for (const pool of this.pools.values()) {
      if (now - pool.lastRefresh >= pool.refreshIntervalMs) {
        pool.remaining = pool.totalSupply;
        pool.lastRefresh = now;
        pool.claimants = [];
      }
    }
  }

  /** Run full competition round */
  runRound(): CompetitionResult[] {
    this.refreshPools();
    const results: CompetitionResult[] = [];
    for (const poolId of this.pools.keys()) {
      const result = this.resolveAuction(poolId);
      if (result) results.push(result);
    }
    return results;
  }

  getLeaderboard(): CompetingAgent[] {
    return Array.from(this.agents.values())
      .sort((a, b) => b.totalClaimed - a.totalClaimed);
  }

  getPoolStatus(): LiquidityPool[] {
    return Array.from(this.pools.values());
  }

  getRecentResults(limit = 20): CompetitionResult[] {
    return this.results.slice(-limit).reverse();
  }
}

// ── Singleton with default setup ────────────────────────────

let competitionInstance: FaucetCompetitionLayer | null = null;

export function getCompetitionLayer(eventBus?: EventBus): FaucetCompetitionLayer {
  if (!competitionInstance) {
    competitionInstance = new FaucetCompetitionLayer(eventBus);

    // Register default competing agents
    const defaultAgents = [
      { id: "alpha-hunter", name: "Alpha Hunter", reputation: 0.8, claimPower: 1.2 },
      { id: "yield-farmer", name: "Yield Farmer", reputation: 0.6, claimPower: 0.9 },
      { id: "momentum-bot", name: "Momentum Bot", reputation: 0.7, claimPower: 1.0 },
      { id: "mean-revert", name: "Mean Reverter", reputation: 0.5, claimPower: 0.8 },
      { id: "quantum-agent", name: "Quantum Agent", reputation: 0.9, claimPower: 1.5 },
      { id: "defi-sniper", name: "DeFi Sniper", reputation: 0.65, claimPower: 1.1 },
    ];

    for (const a of defaultAgents) {
      competitionInstance.registerAgent(a);
    }

    // Create limited liquidity pools
    competitionInstance.createPool({ id: "qtc-pool", asset: "QTC", totalSupply: 100, refreshIntervalMs: 3600_000, auctionMode: "weighted-lottery" });
    competitionInstance.createPool({ id: "aiq-pool", asset: "AIQ", totalSupply: 500, refreshIntervalMs: 1800_000, auctionMode: "reputation-ranked" });
    competitionInstance.createPool({ id: "nxs-pool", asset: "NXS", totalSupply: 1000, refreshIntervalMs: 900_000, auctionMode: "first-come" });
  }
  return competitionInstance;
}
