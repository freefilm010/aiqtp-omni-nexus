/**
 * Trade Event Service — append-only event store for deterministic PnL replay.
 */
import { supabase } from "@/integrations/supabase/client";

import { getCachedUser } from "@/lib/auth/getCachedUser";
export interface TradeEvent {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  fee: number;
  feeCurrency: string;
  slippagePct: number;
  eventType: string;
  createdAt: string;
}

/** Append a trade event (immutable — never update/delete) */
export async function appendTradeEvent(params: {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fee?: number;
  feeCurrency?: string;
  slippagePct?: number;
}) {
  const user = await getCachedUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("trade_events").insert({
    user_id: user.id,
    symbol: params.symbol,
    side: params.side,
    quantity: params.quantity,
    price: params.price,
    fee: params.fee ?? 0,
    fee_currency: params.feeCurrency ?? "USD",
    slippage_pct: params.slippagePct ?? 0,
    event_type: "trade",
  });

  if (error) throw new Error(error.message);
}

/** Replay all trade events in chronological order */
export async function replayTradeEvents(limit = 1000): Promise<TradeEvent[]> {
  const { data, error } = await supabase
    .from("trade_events")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    symbol: r.symbol,
    side: r.side,
    quantity: Number(r.quantity),
    price: Number(r.price),
    fee: Number(r.fee),
    feeCurrency: r.fee_currency,
    slippagePct: Number(r.slippage_pct),
    eventType: r.event_type,
    createdAt: r.created_at,
  }));
}
