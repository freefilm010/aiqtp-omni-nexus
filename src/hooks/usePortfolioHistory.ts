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

export interface PortfolioHistoryData {
  snapshots: PortfolioSnapshot[];
  excludedSnapshotCount: number;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const filterDegradedSnapshots = (snapshots: PortfolioSnapshot[]): PortfolioHistoryData => {
  if (snapshots.length < 3) {
    return { snapshots, excludedSnapshotCount: 0 };
  }

  const filtered = snapshots.filter((snapshot, index, all) => {
    if (snapshot.netWorth <= 0) return false;

    const neighboringValues = all
      .slice(Math.max(0, index - 2), Math.min(all.length, index + 3))
      .filter((_, neighborIndex) => Math.max(0, index - 2) + neighborIndex !== index)
      .map((entry) => entry.netWorth)
      .filter((value) => value > 0);

    if (neighboringValues.length < 2) return true;

    const baseline = median(neighboringValues);
    if (baseline < 10_000) return true;

    const ratio = snapshot.netWorth / baseline;
    return ratio >= 0.25 && ratio <= 4;
  });

  return {
    snapshots: filtered,
    excludedSnapshotCount: Math.max(0, snapshots.length - filtered.length),
  };
};

export function usePortfolioHistory(days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["portfolio", "history", user?.id, days],
    queryFn: async (): Promise<PortfolioHistoryData> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("portfolio_snapshots")
        .select("id, net_worth, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);

      const snapshots = (data ?? []).map((row) => ({
        id: row.id,
        netWorth: Number(row.net_worth) || 0,
        createdAt: row.created_at,
      }));

      return filterDegradedSnapshots(snapshots);
    },
    enabled: !!user,
    staleTime: 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
