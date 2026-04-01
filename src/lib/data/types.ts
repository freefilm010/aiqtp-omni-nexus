/**
 * Shared types for the Data Access Layer.
 * Every service returns a ServiceResult<T>.
 */

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface Holding {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: number;
  valueUsd: number;
  change24h: number;
  allocationPercent: number;
  updatedAt: string;
}

export interface MarketPrice {
  coinId: string;
  symbol: string | null;
  priceUsd: number;
  marketCap: number | null;
  volume: number | null;
  change24h: number | null;
  change7d: number | null;
  high24h: number | null;
  low24h: number | null;
  lastUpdated: string;
}

export interface PlatformToken {
  id: string;
  symbol: string;
  name: string;
  isActive: boolean;
}

export interface TokenPriceFeed {
  tokenId: string;
  symbol: string;
  price: number;
  change24hPercent: number | null;
  lastUpdated: string;
}

export interface FaucetClaim {
  id: string;
  userId: string;
  tokenSymbol: string;
  amount: number;
  chain: string;
  claimedAt: string;
}

export interface TradeLog {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  orderType: string;
  price: number;
  quantity: number;
  status: string;
  createdAt: string;
}
