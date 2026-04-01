/**
 * Portfolio Data Access Layer
 * Single source of truth for portfolio_holdings and trade_logs queries.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ServiceResult, Holding, TradeLog, PortfolioHoldingRow, TradeLogRow } from "./types";

/** Get the current authenticated user's ID, or null. */
async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function toHolding(row: PortfolioHoldingRow): Holding {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    name: row.name ?? row.symbol,
    quantity: Number(row.quantity) || 0,
    valueUsd: Number(row.value_usd) || 0,
    change24h: Number(row.change_24h) || 0,
    allocationPercent: Number(row.allocation_percent) || 0,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function toTradeLog(row: TradeLogRow): TradeLog {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol ?? "BTC/USDT",
    side: row.side ?? "buy",
    action: row.action ?? "market",
    price: Number(row.price) || 0,
    quantity: Number(row.quantity) || 0,
    status: row.status ?? "filled",
    createdAt: row.created_at,
  };
}

/** Fetch all portfolio holdings for the current user. */
export async function getUserHoldings(): Promise<ServiceResult<Holding[]>> {
  const userId = await currentUserId();
  if (!userId) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("user_id", userId);

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map(toHolding), error: null };
}

/** Fetch active (qty > 0) holdings only, excluding testnet. */
export async function getActiveRealHoldings(): Promise<ServiceResult<Holding[]>> {
  const result = await getUserHoldings();
  if (result.error || !result.data) return result;

  const filtered = result.data.filter(
    (h) => h.quantity > 0 && !h.symbol.toUpperCase().startsWith("T")
  );
  return { data: filtered, error: null };
}

/** Fetch recent trade logs for the current user. */
export async function getTradeHistory(limit = 50): Promise<ServiceResult<TradeLog[]>> {
  const userId = await currentUserId();
  if (!userId) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("trade_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map(toTradeLog), error: null };
}
