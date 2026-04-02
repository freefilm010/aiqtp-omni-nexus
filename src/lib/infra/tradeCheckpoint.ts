/**
 * Trade Checkpoint System
 * 
 * Every 200 trades → PAUSE → audit positions for:
 *  - Stale prices (no update in threshold)
 *  - Non-performing / stuck positions (no movement)
 *  - Underwater positions beyond loss threshold
 *  - Illiquid assets with zero volume
 * 
 * If audit passes → resume trading. If not → flag + require review.
 */

export interface PositionSnapshot {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  lastPriceUpdate: number; // timestamp
  volume24h: number;
  pnlPercent: number;
}

export interface CheckpointAuditResult {
  passed: boolean;
  tradesSinceLastCheckpoint: number;
  totalTradesLifetime: number;
  timestamp: number;
  stalePositions: AuditFinding[];
  stuckPositions: AuditFinding[];
  underwaterPositions: AuditFinding[];
  illiquidPositions: AuditFinding[];
  summary: string;
}

export interface AuditFinding {
  symbol: string;
  reason: string;
  severity: "warning" | "critical";
  recommendation: "close" | "reduce" | "monitor" | "hold";
  data: Record<string, number | string>;
}

export interface CheckpointConfig {
  /** Trades between checkpoints (default: 200) */
  tradeInterval: number;
  /** Price staleness threshold in ms (default: 5min) */
  staleThresholdMs: number;
  /** Position with <X% movement over Y hours = stuck */
  stuckMovementPct: number;
  stuckWindowMs: number;
  /** Max drawdown % before flagging (default: -15%) */
  maxDrawdownPct: number;
  /** Min 24h volume to consider liquid (default: $1000) */
  minVolume24h: number;
  /** Auto-close critical findings? */
  autoCloseOnCritical: boolean;
}

const DEFAULT_CONFIG: CheckpointConfig = {
  tradeInterval: 200,
  staleThresholdMs: 5 * 60 * 1000, // 5 minutes
  stuckMovementPct: 0.1, // 0.1% movement = stuck
  stuckWindowMs: 4 * 60 * 60 * 1000, // 4 hours
  maxDrawdownPct: -15,
  minVolume24h: 1000,
  autoCloseOnCritical: false,
};

export class TradeCheckpointSystem {
  private config: CheckpointConfig;
  private tradeCount = 0;
  private lifetimeTradeCount = 0;
  private lastCheckpointAt = Date.now();
  private isPaused = false;
  private auditHistory: CheckpointAuditResult[] = [];
  private priceHistory: Map<string, { price: number; timestamp: number }[]> = new Map();

  constructor(config: Partial<CheckpointConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Record a trade execution. Returns true if checkpoint triggered. */
  recordTrade(symbol: string, price: number): boolean {
    this.tradeCount++;
    this.lifetimeTradeCount++;

    // Track price for stuck detection
    const history = this.priceHistory.get(symbol) || [];
    history.push({ price, timestamp: Date.now() });
    // Keep last 500 entries per symbol
    if (history.length > 500) history.splice(0, history.length - 500);
    this.priceHistory.set(symbol, history);

    if (this.tradeCount >= this.config.tradeInterval) {
      this.isPaused = true;
      return true; // checkpoint triggered
    }
    return false;
  }

  /** Check if trading is paused for checkpoint audit */
  get paused(): boolean {
    return this.isPaused;
  }

  get stats() {
    return {
      tradesSinceCheckpoint: this.tradeCount,
      lifetimeTradeCount: this.lifetimeTradeCount,
      checkpointsCompleted: this.auditHistory.length,
      lastCheckpointAt: this.lastCheckpointAt,
      isPaused: this.isPaused,
      nextCheckpointIn: Math.max(0, this.config.tradeInterval - this.tradeCount),
    };
  }

  /** Run the full audit on current positions */
  runAudit(positions: PositionSnapshot[]): CheckpointAuditResult {
    const now = Date.now();
    const findings = {
      stale: [] as AuditFinding[],
      stuck: [] as AuditFinding[],
      underwater: [] as AuditFinding[],
      illiquid: [] as AuditFinding[],
    };

    for (const pos of positions) {
      // 1. Stale price check
      const priceAge = now - pos.lastPriceUpdate;
      if (priceAge > this.config.staleThresholdMs) {
        const severity = priceAge > this.config.staleThresholdMs * 3 ? "critical" : "warning";
        findings.stale.push({
          symbol: pos.symbol,
          reason: `Price ${Math.round(priceAge / 1000)}s old (threshold: ${this.config.staleThresholdMs / 1000}s)`,
          severity,
          recommendation: severity === "critical" ? "close" : "monitor",
          data: { ageMs: priceAge, lastUpdate: pos.lastPriceUpdate },
        });
      }

      // 2. Stuck position check (no meaningful price movement)
      const history = this.priceHistory.get(pos.symbol) || [];
      const windowStart = now - this.config.stuckWindowMs;
      const recentPrices = history.filter((h) => h.timestamp > windowStart);
      if (recentPrices.length >= 2) {
        const oldest = recentPrices[0].price;
        const newest = recentPrices[recentPrices.length - 1].price;
        const movementPct = Math.abs(((newest - oldest) / oldest) * 100);
        if (movementPct < this.config.stuckMovementPct) {
          findings.stuck.push({
            symbol: pos.symbol,
            reason: `Only ${movementPct.toFixed(3)}% movement in ${Math.round(this.config.stuckWindowMs / 3600000)}h window`,
            severity: "warning",
            recommendation: "reduce",
            data: { movementPct, windowHours: this.config.stuckWindowMs / 3600000 },
          });
        }
      }

      // 3. Underwater check
      if (pos.pnlPercent < this.config.maxDrawdownPct) {
        findings.underwater.push({
          symbol: pos.symbol,
          reason: `PnL at ${pos.pnlPercent.toFixed(2)}% (max allowed: ${this.config.maxDrawdownPct}%)`,
          severity: pos.pnlPercent < this.config.maxDrawdownPct * 2 ? "critical" : "warning",
          recommendation: pos.pnlPercent < this.config.maxDrawdownPct * 2 ? "close" : "reduce",
          data: { pnlPercent: pos.pnlPercent, entryPrice: pos.entryPrice, currentPrice: pos.currentPrice },
        });
      }

      // 4. Illiquid check
      if (pos.volume24h < this.config.minVolume24h) {
        findings.illiquid.push({
          symbol: pos.symbol,
          reason: `24h volume $${pos.volume24h.toFixed(0)} below min $${this.config.minVolume24h}`,
          severity: pos.volume24h === 0 ? "critical" : "warning",
          recommendation: pos.volume24h === 0 ? "close" : "monitor",
          data: { volume24h: pos.volume24h, minRequired: this.config.minVolume24h },
        });
      }
    }

    const allFindings = [...findings.stale, ...findings.stuck, ...findings.underwater, ...findings.illiquid];
    const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
    const warningCount = allFindings.filter((f) => f.severity === "warning").length;
    const passed = criticalCount === 0;

    const result: CheckpointAuditResult = {
      passed,
      tradesSinceLastCheckpoint: this.tradeCount,
      totalTradesLifetime: this.lifetimeTradeCount,
      timestamp: now,
      stalePositions: findings.stale,
      stuckPositions: findings.stuck,
      underwaterPositions: findings.underwater,
      illiquidPositions: findings.illiquid,
      summary: passed
        ? `✅ Checkpoint PASSED — ${positions.length} positions audited, ${warningCount} warnings`
        : `🚫 Checkpoint FAILED — ${criticalCount} critical, ${warningCount} warnings — trading paused`,
    };

    this.auditHistory.push(result);
    // Keep last 50 audits
    if (this.auditHistory.length > 50) this.auditHistory.splice(0, this.auditHistory.length - 50);

    return result;
  }

  /** Resume trading after successful audit (or manual override) */
  resume(force = false): boolean {
    const lastAudit = this.auditHistory[this.auditHistory.length - 1];

    if (!force && lastAudit && !lastAudit.passed) {
      console.warn("[Checkpoint] Cannot resume — last audit has critical findings. Use force=true to override.");
      return false;
    }

    this.tradeCount = 0;
    this.isPaused = false;
    this.lastCheckpointAt = Date.now();
    return true;
  }

  /** Get the most recent audit result */
  get lastAudit(): CheckpointAuditResult | null {
    return this.auditHistory.length > 0 ? this.auditHistory[this.auditHistory.length - 1] : null;
  }

  /** Get all audit history */
  get history(): readonly CheckpointAuditResult[] {
    return this.auditHistory;
  }

  /** Update config dynamically */
  updateConfig(patch: Partial<CheckpointConfig>): void {
    this.config = { ...this.config, ...patch };
  }
}
