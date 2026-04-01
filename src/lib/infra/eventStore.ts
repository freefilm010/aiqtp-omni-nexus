/**
 * Event Store — Append-only ledger with deterministic replay.
 * Reconstructs any point-in-time state from the event log.
 */

import type { PlatformEvent } from "./eventBus";

// ── Snapshot ────────────────────────────────────────────────

export interface SystemSnapshot {
  trades: PlatformEvent[];
  beliefUpdates: PlatformEvent[];
  ruleMutations: PlatformEvent[];
  macroShocks: PlatformEvent[];
  universeSteps: PlatformEvent[];
  riskAlerts: PlatformEvent[];
  circuitBreakerEvents: PlatformEvent[];
  totalEvents: number;
  lastTick: number;
}

// ── Event Store ─────────────────────────────────────────────

export class EventStore {
  private events: PlatformEvent[] = [];
  private snapshots: Map<number, SystemSnapshot> = new Map();
  private snapshotInterval: number;

  constructor(snapshotInterval = 100) {
    this.snapshotInterval = snapshotInterval;
  }

  /** Append an event (immutable). */
  append(event: PlatformEvent): number {
    this.events.push(event);
    const idx = this.events.length;

    if (idx % this.snapshotInterval === 0) {
      this.snapshots.set(idx, this.replay(idx));
    }

    return idx;
  }

  /** Replay all events (or up to a specific index) to reconstruct state. */
  replay(upTo?: number): SystemSnapshot {
    const limit = upTo ?? this.events.length;

    // Find nearest snapshot before limit
    let startIdx = 0;
    let base: SystemSnapshot = emptySnapshot();

    for (const [snapIdx, snap] of this.snapshots) {
      if (snapIdx <= limit && snapIdx > startIdx) {
        startIdx = snapIdx;
        base = structuredClone(snap);
      }
    }

    const slice = this.events.slice(startIdx, limit);

    for (const event of slice) {
      classify(base, event);
    }

    base.totalEvents = limit;
    return base;
  }

  /** Total events stored. */
  get size(): number {
    return this.events.length;
  }

  /** Get raw events in a range. */
  range(from: number, to: number): PlatformEvent[] {
    return this.events.slice(from, to);
  }

  /** Purge all data (for testing). */
  clear(): void {
    this.events = [];
    this.snapshots.clear();
  }
}

function emptySnapshot(): SystemSnapshot {
  return {
    trades: [],
    beliefUpdates: [],
    ruleMutations: [],
    macroShocks: [],
    universeSteps: [],
    riskAlerts: [],
    circuitBreakerEvents: [],
    totalEvents: 0,
    lastTick: 0,
  };
}

function classify(snap: SystemSnapshot, event: PlatformEvent): void {
  switch (event.type) {
    case "TRADE":
      snap.trades.push(event);
      snap.lastTick = Math.max(snap.lastTick, event.payload.tick);
      break;
    case "BELIEF_UPDATE":
      snap.beliefUpdates.push(event);
      snap.lastTick = Math.max(snap.lastTick, event.payload.tick);
      break;
    case "RULE_MUTATION":
      snap.ruleMutations.push(event);
      snap.lastTick = Math.max(snap.lastTick, event.payload.tick);
      break;
    case "MACRO_SHOCK":
      snap.macroShocks.push(event);
      snap.lastTick = Math.max(snap.lastTick, event.payload.tick);
      break;
    case "UNIVERSE_STEP":
      snap.universeSteps.push(event);
      snap.lastTick = Math.max(snap.lastTick, event.payload.tick);
      break;
    case "RISK_ALERT":
      snap.riskAlerts.push(event);
      snap.lastTick = Math.max(snap.lastTick, event.payload.tick);
      break;
    case "CIRCUIT_BREAKER":
      snap.circuitBreakerEvents.push(event);
      snap.lastTick = Math.max(snap.lastTick, event.payload.tick);
      break;
  }
}
