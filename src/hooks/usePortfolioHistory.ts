/**
 * usePortfolioHistory — fetches time-series net worth snapshots.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PortfolioSnapshot {
  id: string;
  netWorth: number;
  createdAt: string;
}

export function usePortfolioHistory(days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["portfolio", "history", user?.id, days],
    queryFn: async (): Promise<PortfolioSnapshot[]> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("portfolio_snapshots")
        .select("id, net_worth, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);

      return (data ?? []).map((row) => ({
        id: row.id,
        netWorth: Number(row.net_worth) || 0,
        createdAt: row.created_at,
      }));
    },
    enabled: !!user,
    staleTime: 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
