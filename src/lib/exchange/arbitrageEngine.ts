/**
 * Cross-Exchange Arbitrage Engine
 * Multi-venue price comparison with latency + fee-aware edge detection.
 */

export interface ExchangeConfig {
  name: string;
  feePct: number;        // e.g. 0.001 = 0.1%
  latencyMs: number;
  price: number;
  liquidityDepth: number; // max size fillable at quoted price
}

export interface ArbOpportunity {
  buyVenue: string;
  sellVenue: string;
  buyPrice: number;
  sellPrice: number;
  grossEdge: number;
  netEdge: number;       // after fees
  maxSize: number;
  estimatedProfitUsd: number;
  latencyRisk: number;   // ms exposure
}

export function scanArbitrage(
  venues: ExchangeConfig[],
  minNetEdge: number = 0
): ArbOpportunity[] {
  const opportunities: ArbOpportunity[] = [];

  for (let i = 0; i < venues.length; i++) {
    for (let j = i + 1; j < venues.length; j++) {
      const a = venues[i];
      const b = venues[j];

      // Check both directions
      for (const [buyer, seller] of [[a, b], [b, a]] as [ExchangeConfig, ExchangeConfig][]) {
        const grossEdge = seller.price - buyer.price;
        if (grossEdge <= 0) continue;

        const totalFeePct = buyer.feePct + seller.feePct;
        const feesCost = buyer.price * totalFeePct;
        const netEdge = grossEdge - feesCost;

        if (netEdge <= minNetEdge) continue;

        const maxSize = Math.min(buyer.liquidityDepth, seller.liquidityDepth);

        opportunities.push({
          buyVenue: buyer.name,
          sellVenue: seller.name,
          buyPrice: buyer.price,
          sellPrice: seller.price,
          grossEdge,
          netEdge,
          maxSize,
          estimatedProfitUsd: netEdge * maxSize,
          latencyRisk: buyer.latencyMs + seller.latencyMs,
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.estimatedProfitUsd - a.estimatedProfitUsd);
}
