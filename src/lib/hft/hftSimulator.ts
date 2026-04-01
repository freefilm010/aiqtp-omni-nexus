/**
 * HFT Simulation Engine
 * Latency modeling, order queue priority, and fill probability.
 */

// ── Latency Model ───────────────────────────────────────────

export interface LatencyProfile {
  name: string;
  minMs: number;
  maxMs: number;
  jitterMs: number;
}

export const LATENCY_PROFILES: Record<string, LatencyProfile> = {
  colocated: { name: "Co-located", minMs: 0.05, maxMs: 0.5, jitterMs: 0.1 },
  proximity: { name: "Proximity", minMs: 1, maxMs: 5, jitterMs: 1 },
  retail: { name: "Retail", minMs: 10, maxMs: 80, jitterMs: 20 },
  mobile: { name: "Mobile", minMs: 50, maxMs: 300, jitterMs: 50 },
};

export function simulateLatency(profile: LatencyProfile): number {
  const base = profile.minMs + Math.random() * (profile.maxMs - profile.minMs);
  const jitter = (Math.random() - 0.5) * 2 * profile.jitterMs;
  return Math.max(0.01, base + jitter);
}

// ── Order Queue ─────────────────────────────────────────────

export interface QueuedOrder {
  id: string;
  price: number;
  size: number;
  submittedAt: number;   // epoch ms
  latencyMs: number;
  side: "buy" | "sell";
}

/** Effective arrival time at the exchange matching engine. */
function arrivalTime(order: QueuedOrder): number {
  return order.submittedAt + order.latencyMs;
}

/**
 * Determine queue position for a new order against existing orders
 * at the same price level (price-time priority).
 */
export function queuePosition(
  existingOrders: QueuedOrder[],
  newOrder: QueuedOrder
): number {
  const samePriceSide = existingOrders.filter(
    (o) => o.price === newOrder.price && o.side === newOrder.side
  );

  const all = [...samePriceSide, newOrder].sort(
    (a, b) => arrivalTime(a) - arrivalTime(b)
  );

  return all.findIndex((o) => o.id === newOrder.id) + 1;
}

/**
 * Total size ahead in the queue at the same price level.
 */
export function sizeAhead(
  existingOrders: QueuedOrder[],
  newOrder: QueuedOrder
): number {
  const newArrival = arrivalTime(newOrder);

  return existingOrders
    .filter(
      (o) =>
        o.price === newOrder.price &&
        o.side === newOrder.side &&
        arrivalTime(o) < newArrival
    )
    .reduce((s, o) => s + o.size, 0);
}

// ── Fill Probability ────────────────────────────────────────

export interface FillEstimate {
  probability: number;
  expectedFillMs: number;
  queuePosition: number;
  sizeAhead: number;
}

/**
 * Estimate fill probability based on queue position and available liquidity.
 *
 * Model: P(fill) = exp(-sizeAhead / liquidityPerSecond / decayFactor)
 */
export function estimateFill(
  existingOrders: QueuedOrder[],
  newOrder: QueuedOrder,
  liquidityPerSecond: number = 100,
  decayFactor: number = 2
): FillEstimate {
  const pos = queuePosition(existingOrders, newOrder);
  const ahead = sizeAhead(existingOrders, newOrder);

  const probability =
    liquidityPerSecond > 0
      ? Math.exp(-ahead / (liquidityPerSecond * decayFactor))
      : 0;

  // Expected time to fill (rough: sizeAhead / liquidityPerSecond * 1000ms)
  const expectedFillMs =
    liquidityPerSecond > 0 ? (ahead / liquidityPerSecond) * 1000 : Infinity;

  return {
    probability: Math.min(1, Math.max(0, probability)),
    expectedFillMs,
    queuePosition: pos,
    sizeAhead: ahead,
  };
}

// ── HFT Round-Trip Simulation ───────────────────────────────

export interface HFTSimResult {
  orderLatencyMs: number;
  queuePosition: number;
  fillProbability: number;
  expectedFillMs: number;
  roundTripMs: number;
  wouldFill: boolean;
}

/**
 * Simulate a full HFT order lifecycle:
 * submit → network latency → queue → fill probability → ack latency
 */
export function simulateHFTRoundTrip(
  profile: LatencyProfile,
  existingOrders: QueuedOrder[],
  order: Omit<QueuedOrder, "latencyMs">,
  liquidityPerSecond: number = 100
): HFTSimResult {
  const latency = simulateLatency(profile);
  const fullOrder: QueuedOrder = { ...order, latencyMs: latency };

  const fill = estimateFill(existingOrders, fullOrder, liquidityPerSecond);
  const ackLatency = simulateLatency(profile);

  return {
    orderLatencyMs: latency,
    queuePosition: fill.queuePosition,
    fillProbability: fill.probability,
    expectedFillMs: fill.expectedFillMs,
    roundTripMs: latency + ackLatency,
    wouldFill: Math.random() < fill.probability,
  };
}
