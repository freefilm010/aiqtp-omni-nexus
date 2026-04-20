/**
 * useRealtimePortfolio — refetches holdings from the source of truth on DB changes.
 * Debounced to avoid refetch storms when multiple rows update together.
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useRealtimePortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const queryKey = ["portfolio", "holdings", user.id] as const;
    let resyncTimer: ReturnType<typeof setTimeout> | null = null;

    const requestResync = () => {
      if (resyncTimer) clearTimeout(resyncTimer);

      resyncTimer = setTimeout(() => {
        void queryClient.refetchQueries({ queryKey, type: "active" });
        resyncTimer = null;
      }, 250);
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
        () => {
          requestResync();
        }
      )
      .subscribe();

    return () => {
      if (resyncTimer) clearTimeout(resyncTimer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
