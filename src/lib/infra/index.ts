/**
 * Platform Orchestrator — Wires all infrastructure modules together.
 * Single entry point for the distributed simulation platform.
 */

import { EventBus } from "./eventBus";
import { EventStore } from "./eventStore";
import { ExecutionRouter, type ExecutionMode } from "./executionRouter";
import { SafetyCluster } from "./safetyCluster";
import { Telemetry } from "./telemetry";

export interface PlatformConfig {
  executionMode?: ExecutionMode;
  haltThreshold?: number;
  warningThreshold?: number;
  snapshotInterval?: number;
}

export class PlatformOrchestrator {
  readonly bus: EventBus;
  readonly store: EventStore;
  readonly executor: ExecutionRouter;
  readonly safety: SafetyCluster;
  readonly telemetry: Telemetry;

  constructor(config: PlatformConfig = {}) {
    this.bus = new EventBus();
    this.store = new EventStore(config.snapshotInterval ?? 100);
    this.executor = new ExecutionRouter(config.executionMode ?? "simulation");
    this.telemetry = new Telemetry();
    this.safety = new SafetyCluster(this.bus, {
      haltThreshold: config.haltThreshold ?? 0.8,
      warningThreshold: config.warningThreshold ?? 0.5,
    });

    // Wire: all events → event store + telemetry
    this.bus.subscribe("*", (event) => {
      this.store.append(event);
      this.telemetry.counter(`event_${event.type}`);
    });

    // Wire: circuit breaker events → telemetry logging
    this.bus.subscribe("CIRCUIT_BREAKER", (event) => {
      if (event.type === "CIRCUIT_BREAKER") {
        this.telemetry.warn(`Circuit breaker: ${event.payload.action}`, {
          riskScore: event.payload.riskScore,
        });
      }
    });
  }

  /** System health summary. */
  get status() {
    return {
      frozen: this.safety.isFrozen,
      globalRisk: this.safety.risk,
      totalEvents: this.store.size,
      executionMode: this.executor.mode,
      circuitBreakerTrips: this.safety.trips,
    };
  }
}

// Re-export all infra modules
export { EventBus, type PlatformEvent } from "./eventBus";
export { EventStore, type SystemSnapshot } from "./eventStore";
export { ExecutionRouter, type OrderRequest, type FillResult, type ExecutionMode } from "./executionRouter";
export { SafetyCluster } from "./safetyCluster";
export { Telemetry } from "./telemetry";
