/**
 * Shared types for the Data Access Layer.
 * Every service returns a ServiceResult<T>.
 */
import type { Database } from "@/integrations/supabase/types";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/* ── Row type aliases (from auto-generated Supabase types) ── */
export type PortfolioHoldingRow = Database["public"]["Tables"]["portfolio_holdings"]["Row"];
export type MarketPriceRow = Database["public"]["Tables"]["market_prices"]["Row"];
export type PlatformTokenRow = Database["public"]["Tables"]["platform_tokens"]["Row"];
export type TokenPriceFeedRow = Database["public"]["Tables"]["token_price_feeds"]["Row"];
export type FaucetClaimRow = Database["public"]["Tables"]["faucet_claims"]["Row"];
export type TradeLogRow = Database["public"]["Tables"]["trade_logs"]["Row"];
export type FaucetScheduleRow = Database["public"]["Tables"]["faucet_schedules"]["Row"];
export type CompoundSnapshotRow = Database["public"]["Tables"]["compound_snapshots"]["Row"];
export type AutoInvestEngineRow = Database["public"]["Tables"]["auto_invest_engine"]["Row"];
export type AutoInvestTransactionRow = Database["public"]["Tables"]["auto_invest_transactions"]["Row"];
export type AutoInvestAllocationRow = Database["public"]["Tables"]["auto_invest_allocations"]["Row"];

/* ── View row aliases ── */
export type FaucetLeaderboardRow = Database["public"]["Tables"]["faucet_leaderboard"]["Row"];

/* ── Domain models (camelCase, used by components) ── */
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
  tokenId: string | null;
  amount: number;
  chain: string;
  claimedAt: string;
}

export interface TradeLog {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  action: string;
  price: number;
  quantity: number;
  status: string;
  createdAt: string;
}
