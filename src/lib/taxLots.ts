/** Tax lot types for audit-grade PnL tracking */

export interface TaxLot {
  lotId: string;
  symbol: string;
  qty: number;
  buyPrice: number;
  buyPriceEffective: number; // includes fee + slippage
  buyFxRate: number;
  buyTimestamp: string;
  costBasisUsd: number;
}

export interface RealizedEvent {
  lotId: string;
  symbol: string;
  qty: number;
  costBasisUsd: number;
  proceedsUsd: number;
  gainLossUsd: number;
  buyDate: string;
  sellDate: string;
  holdingDays: number;
  isLongTerm: boolean; // > 365 days
}

export type LotStrategy = "FIFO" | "LIFO" | "HIFO";
