/**
 * useRealtimePortfolio — patches React Query cache on DB changes.
 * No refetch loops. Instant UI updates. Scoped to current user.
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Holding } from "@/lib/data/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/** Map a raw DB row to our Holding domain type */
function rowToHolding(row: Record<string, unknown>): Holding {
  return {
    id: String(row.id ?? ""),
    userId: String(row.user_id ?? ""),
    symbol: String(row.symbol ?? ""),
    name: String(row.name ?? row.symbol ?? ""),
    quantity: Number(row.quantity) || 0,
    valueUsd: Number(row.value_usd) || 0,
    change24h: Number(row.change_24h) || 0,
    allocationPercent: Number(row.allocation_percent) || 0,
    updatedAt: String(row.updated_at ?? row.created_at ?? ""),
  };
}

export function useRealtimePortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const queryKey = ["portfolio", "holdings", user.id];
    const requestResync = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const channel = supabase
      .channel(`portfolio-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portfolio_holdings",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const current = queryClient.getQueryData<Holding[]>(queryKey) ?? [];

          // Never build a holdings cache from partial realtime events.
          if (current.length === 0) {
            requestResync();
            return;
          }

          if (payload.eventType === "INSERT") {
            const newHolding = rowToHolding(payload.new);
            if (current.some((holding) => holding.id === newHolding.id)) return;

            queryClient.setQueryData<Holding[]>(queryKey, [...current, newHolding]);
            return;
          }

          if (payload.eventType === "UPDATE") {
            const updated = rowToHolding(payload.new);
            if (!current.some((holding) => holding.id === updated.id)) {
              requestResync();
              return;
            }

            queryClient.setQueryData<Holding[]>(
              queryKey,
              current.map((holding) => (holding.id === updated.id ? updated : holding))
            );
            return;
          }

          if (payload.eventType === "DELETE") {
            const deletedId = String((payload.old as Record<string, unknown>).id ?? "");
            if (!current.some((holding) => holding.id === deletedId)) {
              requestResync();
              return;
            }

            queryClient.setQueryData<Holding[]>(
              queryKey,
              current.filter((holding) => holding.id !== deletedId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
