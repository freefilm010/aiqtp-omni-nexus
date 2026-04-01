/**
 * Event Bus — Kafka-style pub/sub backbone for the simulation platform.
 * All inter-service communication flows through typed events.
 */

// ── Event Types ─────────────────────────────────────────────

export interface TradeEvent {
  type: "TRADE";
  payload: { agentId: string; symbol: string; side: "buy" | "sell"; size: number; price: number; tick: number };
}

export interface BeliefUpdateEvent {
  type: "BELIEF_UPDATE";
  payload: { agentId: string; belief: number; attention: number; tick: number };
}

export interface RuleMutationEvent {
  type: "RULE_MUTATION";
  payload: { ruleKey: string; oldValue: number; newValue: number; tick: number };
}

export interface MacroShockEvent {
  type: "MACRO_SHOCK";
  payload: { shockType: string; magnitude: number; tick: number };
}

export interface UniverseStepEvent {
  type: "UNIVERSE_STEP";
  payload: { universeName: string; equityIndex: number; crisisLevel: number; tick: number };
}

export interface RiskAlertEvent {
  type: "RISK_ALERT";
  payload: { level: "warning" | "critical" | "halt"; score: number; source: string; tick: number };
}

export interface CircuitBreakerEvent {
  type: "CIRCUIT_BREAKER";
  payload: { action: "trip" | "recover"; riskScore: number; tick: number };
}

export type PlatformEvent =
  | TradeEvent
  | BeliefUpdateEvent
  | RuleMutationEvent
  | MacroShockEvent
  | UniverseStepEvent
  | RiskAlertEvent
  | CircuitBreakerEvent;

// ── Subscriber ──────────────────────────────────────────────

export type EventHandler<T extends PlatformEvent = PlatformEvent> = (event: T) => void;

interface Subscription {
  id: string;
  type: PlatformEvent["type"] | "*";
  handler: EventHandler;
}

// ── Event Bus ───────────────────────────────────────────────

export class EventBus {
  private subscriptions: Subscription[] = [];
  private eventLog: PlatformEvent[] = [];
  private seq = 0;

  /** Publish an event to all matching subscribers. */
  publish(event: PlatformEvent): void {
    this.eventLog.push(event);

    for (const sub of this.subscriptions) {
      if (sub.type === "*" || sub.type === event.type) {
        try {
          sub.handler(event);
        } catch (err) {
          console.error(`[EventBus] handler ${sub.id} threw:`, err);
        }
      }
    }
  }

  /** Subscribe to a specific event type or all ("*"). */
  subscribe(type: PlatformEvent["type"] | "*", handler: EventHandler): string {
    const id = `sub_${this.seq++}`;
    this.subscriptions.push({ id, type, handler });
    return id;
  }

  /** Remove a subscription. */
  unsubscribe(id: string): void {
    this.subscriptions = this.subscriptions.filter((s) => s.id !== id);
  }

  /** Get full event log for replay. */
  get log(): readonly PlatformEvent[] {
    return this.eventLog;
  }

  /** Clear the event log. */
  flush(): void {
    this.eventLog = [];
  }
}
