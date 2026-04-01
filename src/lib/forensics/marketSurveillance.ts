/**
 * Market Surveillance / Manipulation Detection
 * Spoofing, wash trading, and anomaly detection heuristics.
 */

export interface MarketEvent {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  timestamp: number;
  cancelled?: boolean;
  accountId?: string;
}

export type AlertType = "spoofing" | "wash_trade" | "layering" | "momentum_ignition";

export interface SurveillanceAlert {
  type: AlertType;
  severity: "low" | "medium" | "high";
  description: string;
  events: MarketEvent[];
  timestamp: number;
}

/**
 * Detect spoofing: large orders placed and rapidly cancelled.
 */
export function detectSpoofing(
  events: MarketEvent[],
  cancelWindowMs: number = 200,
  sizeMultiplier: number = 5
): SurveillanceAlert[] {
  const alerts: SurveillanceAlert[] = [];
  const avgSize = events.reduce((s, e) => s + e.size, 0) / (events.length || 1);

  for (const event of events) {
    if (!event.cancelled) continue;
    if (event.size < avgSize * sizeMultiplier) continue;

    // Find if it was cancelled very quickly
    const placedAndCancelled = events.find(
      (e) =>
        e.id !== event.id &&
        e.cancelled &&
        Math.abs(e.timestamp - event.timestamp) < cancelWindowMs &&
        e.size === event.size
    );

    if (placedAndCancelled || event.size > avgSize * sizeMultiplier) {
      alerts.push({
        type: "spoofing",
        severity: event.size > avgSize * 10 ? "high" : "medium",
        description: `Large order (${event.size}) cancelled within ${cancelWindowMs}ms`,
        events: [event],
        timestamp: event.timestamp,
      });
    }
  }

  return alerts;
}

/**
 * Detect wash trading: same account trading with itself or
 * identical price+size patterns in rapid succession.
 */
export function detectWashTrading(
  events: MarketEvent[],
  windowMs: number = 1000
): SurveillanceAlert[] {
  const alerts: SurveillanceAlert[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      if (Math.abs(a.timestamp - b.timestamp) > windowMs) break;

      const sameAccount = a.accountId && a.accountId === b.accountId;
      const mirrorTrade =
        a.price === b.price &&
        a.size === b.size &&
        a.side !== b.side;

      if (sameAccount || mirrorTrade) {
        alerts.push({
          type: "wash_trade",
          severity: sameAccount ? "high" : "medium",
          description: sameAccount
            ? `Same account (${a.accountId}) on both sides`
            : `Mirror trade: ${a.size}@${a.price} buy/sell within ${windowMs}ms`,
          events: [a, b],
          timestamp: b.timestamp,
        });
      }
    }
  }

  return alerts;
}

/**
 * Detect layering: multiple orders at consecutive price levels on one side,
 * suggesting intent to move the market.
 */
export function detectLayering(
  events: MarketEvent[],
  minLayers: number = 4,
  priceIncrement: number = 0.01
): SurveillanceAlert[] {
  const alerts: SurveillanceAlert[] = [];
  const sides: Array<"buy" | "sell"> = ["buy", "sell"];

  for (const side of sides) {
    const sideEvents = events
      .filter((e) => e.side === side && !e.cancelled)
      .sort((a, b) => a.price - b.price);

    let streak: MarketEvent[] = [];

    for (let i = 1; i < sideEvents.length; i++) {
      const gap = Math.abs(sideEvents[i].price - sideEvents[i - 1].price);

      if (gap <= priceIncrement * 2) {
        if (streak.length === 0) streak.push(sideEvents[i - 1]);
        streak.push(sideEvents[i]);
      } else {
        if (streak.length >= minLayers) {
          alerts.push({
            type: "layering",
            severity: streak.length >= 8 ? "high" : "medium",
            description: `${streak.length} consecutive ${side} orders across ${streak.length} price levels`,
            events: streak,
            timestamp: streak[streak.length - 1].timestamp,
          });
        }
        streak = [];
      }
    }

    if (streak.length >= minLayers) {
      alerts.push({
        type: "layering",
        severity: streak.length >= 8 ? "high" : "medium",
        description: `${streak.length} consecutive ${side} orders across ${streak.length} price levels`,
        events: streak,
        timestamp: streak[streak.length - 1].timestamp,
      });
    }
  }

  return alerts;
}
