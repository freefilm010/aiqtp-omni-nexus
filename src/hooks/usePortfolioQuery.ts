/**
 * React Query wrapper for portfolio data.
 * Provides caching, background refetch, and loading/error states.
 */
import { useQuery } from "@tanstack/react-query";
import { portfolioService } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import type { Holding, TradeLog } from "@/lib/data/types";

export function useHoldingsQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["holdings", user?.id],
    queryFn: async (): Promise<Holding[]> => {
      const result = await portfolioService.getUserHoldings();
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useActiveHoldingsQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["holdings", "active", user?.id],
    queryFn: async (): Promise<Holding[]> => {
      const result = await portfolioService.getActiveRealHoldings();
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useTradeHistoryQuery(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tradeHistory", user?.id, limit],
    queryFn: async (): Promise<TradeLog[]> => {
      const result = await portfolioService.getTradeHistory(limit);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
