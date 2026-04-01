/**
 * Safety Cluster — Distributed risk aggregation, circuit breakers, and kill-switch.
 */

import type { EventBus, PlatformEvent } from "./eventBus";

// ── Risk Aggregator ─────────────────────────────────────────

export interface RiskReading {
  source: string;
  score: number;   // 0-1
  timestamp: number;
}

export class SafetyCluster {
  private readings: RiskReading[] = [];
  private globalRisk = 0;
  private frozen = false;
  private tripCount = 0;
  private lastSafeSnapshot: unknown = null;

  private readonly haltThreshold: number;
  private readonly warningThreshold: number;
  private readonly emaAlpha: number;

  constructor(
    private bus: EventBus | null = null,
    options?: { haltThreshold?: number; warningThreshold?: number; emaAlpha?: number }
  ) {
    this.haltThreshold = options?.haltThreshold ?? 0.8;
    this.warningThreshold = options?.warningThreshold ?? 0.5;
    this.emaAlpha = options?.emaAlpha ?? 0.15;
  }

  /** Ingest a risk signal from any service. */
  reportRisk(source: string, score: number, tick = 0): void {
    const clamped = Math.max(0, Math.min(1, score));
    this.readings.push({ source, score: clamped, timestamp: Date.now() });
    if (this.readings.length > 500) this.readings.shift();

    // EMA update
    this.globalRisk = (1 - this.emaAlpha) * this.globalRisk + this.emaAlpha * clamped;

    // Emit risk events
    if (this.bus) {
      if (this.globalRisk >= this.haltThreshold && !this.frozen) {
        this.trip(tick);
      } else if (this.globalRisk >= this.warningThreshold) {
        this.bus.publish({
          type: "RISK_ALERT",
          payload: { level: "warning", score: this.globalRisk, source, tick },
        });
      }
    }
  }

  /** Save a safe state for rollback. */
  snapshot(state: unknown): void {
    this.lastSafeSnapshot = structuredClone(state);
  }

  /** Trigger a system-wide halt. */
  trip(tick = 0): void {
    this.frozen = true;
    this.tripCount++;

    if (this.bus) {
      this.bus.publish({
        type: "CIRCUIT_BREAKER",
        payload: { action: "trip", riskScore: this.globalRisk, tick },
      });
      this.bus.publish({
        type: "RISK_ALERT",
        payload: { level: "halt", score: this.globalRisk, source: "safety_cluster", tick },
      });
    }
  }

  /** Recover from halt, returning last safe state if available. */
  recover<T>(tick = 0): T | null {
    if (!this.frozen) return null;

    this.frozen = false;
    this.globalRisk *= 0.5; // decay risk on recovery

    if (this.bus) {
      this.bus.publish({
        type: "CIRCUIT_BREAKER",
        payload: { action: "recover", riskScore: this.globalRisk, tick },
      });
    }

    if (this.lastSafeSnapshot != null) {
      return structuredClone(this.lastSafeSnapshot) as T;
    }
    return null;
  }

  get isFrozen(): boolean {
    return this.frozen;
  }

  get risk(): number {
    return this.globalRisk;
  }

  get trips(): number {
    return this.tripCount;
  }

  get recentReadings(): readonly RiskReading[] {
    return this.readings.slice(-20);
  }
}
