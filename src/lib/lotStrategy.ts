/** Lot ordering strategies for tax-aware sell matching */
import type { TaxLot, LotStrategy } from "./taxLots";

/**
 * Returns lots ordered by the chosen strategy.
 * Does NOT mutate the original array.
 */
export function orderLotsByStrategy(lots: TaxLot[], strategy: LotStrategy): TaxLot[] {
  const copy = lots.filter((l) => l.qty > 0);

  switch (strategy) {
    case "LIFO":
      return [...copy].reverse();
    case "HIFO":
      return [...copy].sort((a, b) => b.buyPriceEffective - a.buyPriceEffective);
    case "FIFO":
    default:
      return copy;
  }
}
