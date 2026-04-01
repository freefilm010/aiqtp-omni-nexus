/**
 * usePortfolioSnapshot — inserts net worth snapshot every 5 minutes.
 * Mount once globally (e.g., in App.tsx RealtimeSync).
 */
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioValuation } from "@/hooks/usePortfolioValuation";
import { useAuth } from "@/hooks/useAuth";

const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function usePortfolioSnapshot() {
  const { user } = useAuth();
  const { netWorth, isLoading } = usePortfolioValuation();
  const lastSnapshotRef = useRef(0);

  useEffect(() => {
    if (!user?.id || isLoading) return;

    const takeSnapshot = async () => {
      const now = Date.now();
      // Debounce: don't snapshot more than once per interval
      if (now - lastSnapshotRef.current < SNAPSHOT_INTERVAL_MS) return;

      // Don't snapshot $0 — likely loading/unauth state
      if (netWorth <= 0) return;

      const { error } = await supabase.from("portfolio_snapshots").insert({
        user_id: user.id,
        net_worth: netWorth,
      });

      if (!error) {
        lastSnapshotRef.current = now;
      }
    };

    // Take initial snapshot after short delay (let data settle)
    const initial = setTimeout(takeSnapshot, 10_000);

    const interval = setInterval(takeSnapshot, SNAPSHOT_INTERVAL_MS);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [user?.id, netWorth, isLoading]);
}
