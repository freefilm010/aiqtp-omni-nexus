/**
 * Faucet Orchestrator Engine
 * Manages provider registry, cooldown tracking, claim execution,
 * rate-limiting, and economy event integration.
 */

import { EventBus, type PlatformEvent } from "@/lib/infra/eventBus";

// ── Types ───────────────────────────────────────────────────

export type ProviderType = "TESTNET" | "REWARDS" | "PLATFORM" | "MINING" | "STAKING";

export interface FaucetProvider {
  name: string;
  type: ProviderType;
  asset: string;
  cooldownMs: number;
  payoutRange: [number, number]; // [min, max] per claim
  lastClaim?: number;
  totalClaimed: number;
  claimCount: number;
  failCount: number;
  isActive: boolean;
  rateLimit: { maxPerHour: number; currentHour: number; hourStart: number };
}

export interface FaucetClaim {
  provider: string;
  asset: string;
  amount: number;
  timestamp: number;
  type: ProviderType;
}

export interface OrchestratorMetrics {
  totalProviders: number;
  activeProviders: number;
  totalClaimed: number;
  claimsPerHour: number;
  cooldownUtilization: number; // 0-1, how well we use available claim windows
  incomeRate: number; // claims per minute
  failRate: number;
  providerBreakdown: Record<ProviderType, { count: number; totalClaimed: number }>;
}

// ── Faucet Income Event (extends EventBus) ──────────────────

export interface FaucetIncomeEvent {
  type: "FAUCET_INCOME";
  payload: {
    source: string;
    asset: string;
    amount: number;
    providerType: ProviderType;
    volatility: number;
    tick: number;
  };
}

// ── Engine ──────────────────────────────────────────────────

export class FaucetOrchestrator {
  private providers: Map<string, FaucetProvider> = new Map();
  private claimHistory: FaucetClaim[] = [];
  private eventBus: EventBus | null = null;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private tick = 0;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || null;
  }

  /** Register a faucet provider */
  register(config: {
    name: string;
    type: ProviderType;
    asset: string;
    cooldownMs: number;
    payoutRange: [number, number];
    maxPerHour?: number;
  }): void {
    this.providers.set(config.name, {
      name: config.name,
      type: config.type,
      asset: config.asset,
      cooldownMs: config.cooldownMs,
      payoutRange: config.payoutRange,
      totalClaimed: 0,
      claimCount: 0,
      failCount: 0,
      isActive: true,
      rateLimit: {
        maxPerHour: config.maxPerHour || 10,
        currentHour: 0,
        hourStart: Date.now(),
      },
    });
  }

  /** Check if a provider can be claimed */
  canClaim(name: string): boolean {
    const p = this.providers.get(name);
    if (!p || !p.isActive) return false;

    const now = Date.now();

    // Cooldown check
    if (p.lastClaim && now - p.lastClaim < p.cooldownMs) return false;

    // Rate limit check
    if (now - p.rateLimit.hourStart > 3600_000) {
      p.rateLimit.currentHour = 0;
      p.rateLimit.hourStart = now;
    }
    if (p.rateLimit.currentHour >= p.rateLimit.maxPerHour) return false;

    return true;
  }

  /** Execute a claim for a specific provider */
  async claim(name: string): Promise<FaucetClaim | null> {
    const p = this.providers.get(name);
    if (!p || !this.canClaim(name)) return null;

    try {
      const [min, max] = p.payoutRange;
      const amount = min + Math.random() * (max - min);

      const claimRecord: FaucetClaim = {
        provider: name,
        asset: p.asset,
        amount: Number(amount.toFixed(8)),
        timestamp: Date.now(),
        type: p.type,
      };

      // Update provider state
      p.lastClaim = Date.now();
      p.totalClaimed += claimRecord.amount;
      p.claimCount += 1;
      p.rateLimit.currentHour += 1;

      // Record history
      this.claimHistory.push(claimRecord);
      if (this.claimHistory.length > 10000) {
        this.claimHistory = this.claimHistory.slice(-5000);
      }

      // Publish to economy event bus as income shock
      if (this.eventBus) {
        this.tick++;
        this.eventBus.publish({
          type: "MACRO_SHOCK",
          payload: {
            shockType: `faucet_income:${p.type}`,
            magnitude: claimRecord.amount,
            tick: this.tick,
          },
        } as PlatformEvent);
      }

      return claimRecord;
    } catch {
      p.failCount += 1;
      return null;
    }
  }

  /** Claim all available providers */
  async claimAll(): Promise<FaucetClaim[]> {
    const results: FaucetClaim[] = [];
    for (const name of this.providers.keys()) {
      if (this.canClaim(name)) {
        const result = await this.claim(name);
        if (result) results.push(result);
      }
    }
    return results;
  }

  /** Start automated scheduler */
  startScheduler(intervalMs = 10_000): void {
    if (this.schedulerInterval) return;
    this.schedulerInterval = setInterval(async () => {
      const results = await this.claimAll();
      if (results.length > 0) {
        console.log(`[FaucetOrchestrator] Claimed ${results.length} faucets`, results);
      }
    }, intervalMs);
  }

  /** Stop scheduler */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  /** Get orchestrator metrics */
  getMetrics(): OrchestratorMetrics {
    const now = Date.now();
    const providers = Array.from(this.providers.values());
    const recentClaims = this.claimHistory.filter(c => now - c.timestamp < 3600_000);

    // Cooldown utilization: % of providers currently claimable
    const claimable = providers.filter(p => this.canClaim(p.name)).length;
    const active = providers.filter(p => p.isActive).length;

    const breakdown: Record<ProviderType, { count: number; totalClaimed: number }> = {
      TESTNET: { count: 0, totalClaimed: 0 },
      REWARDS: { count: 0, totalClaimed: 0 },
      PLATFORM: { count: 0, totalClaimed: 0 },
      MINING: { count: 0, totalClaimed: 0 },
      STAKING: { count: 0, totalClaimed: 0 },
    };

    for (const p of providers) {
      breakdown[p.type].count += 1;
      breakdown[p.type].totalClaimed += p.totalClaimed;
    }

    const totalFails = providers.reduce((s, p) => s + p.failCount, 0);
    const totalAttempts = providers.reduce((s, p) => s + p.claimCount + p.failCount, 0);

    return {
      totalProviders: providers.length,
      activeProviders: active,
      totalClaimed: this.claimHistory.length,
      claimsPerHour: recentClaims.length,
      cooldownUtilization: active > 0 ? claimable / active : 0,
      incomeRate: recentClaims.length / 60,
      failRate: totalAttempts > 0 ? totalFails / totalAttempts : 0,
      providerBreakdown: breakdown,
    };
  }

  /** Get claim history */
  getHistory(limit = 50): FaucetClaim[] {
    return this.claimHistory.slice(-limit).reverse();
  }

  /** Get all providers */
  getProviders(): FaucetProvider[] {
    return Array.from(this.providers.values());
  }

  /** Toggle provider active state */
  toggleProvider(name: string): boolean {
    const p = this.providers.get(name);
    if (!p) return false;
    p.isActive = !p.isActive;
    return p.isActive;
  }
}

// ── Singleton Instance ──────────────────────────────────────

let orchestratorInstance: FaucetOrchestrator | null = null;

export function getOrchestrator(eventBus?: EventBus): FaucetOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new FaucetOrchestrator(eventBus);
    // Register default providers
    registerDefaultProviders(orchestratorInstance);
  }
  return orchestratorInstance;
}

function registerDefaultProviders(engine: FaucetOrchestrator): void {
  // Platform tokens (real value)
  engine.register({ name: "QTC Mining", type: "MINING", asset: "QTC", cooldownMs: 8 * 3600_000, payoutRange: [3, 7] });
  engine.register({ name: "AIQ Rewards", type: "REWARDS", asset: "AIQ", cooldownMs: 6 * 3600_000, payoutRange: [15, 35] });
  engine.register({ name: "NXS Loyalty", type: "REWARDS", asset: "NXS", cooldownMs: 4 * 3600_000, payoutRange: [30, 70] });
  engine.register({ name: "QTC Staking", type: "STAKING", asset: "QTC", cooldownMs: 24 * 3600_000, payoutRange: [10, 25] });
  engine.register({ name: "AIQ Staking", type: "STAKING", asset: "AIQ", cooldownMs: 24 * 3600_000, payoutRange: [50, 100] });

  // Testnet faucets
  engine.register({ name: "Sepolia ETH", type: "TESTNET", asset: "tETH", cooldownMs: 24 * 3600_000, payoutRange: [0.1, 0.5] });
  engine.register({ name: "BTC Testnet", type: "TESTNET", asset: "tBTC", cooldownMs: 48 * 3600_000, payoutRange: [0.005, 0.015] });
  engine.register({ name: "Solana Devnet", type: "TESTNET", asset: "tSOL", cooldownMs: 12 * 3600_000, payoutRange: [2, 8] });
  engine.register({ name: "Polygon Mumbai", type: "TESTNET", asset: "tMATIC", cooldownMs: 12 * 3600_000, payoutRange: [5, 15] });
  engine.register({ name: "Avalanche Fuji", type: "TESTNET", asset: "tAVAX", cooldownMs: 24 * 3600_000, payoutRange: [1, 3] });
}
