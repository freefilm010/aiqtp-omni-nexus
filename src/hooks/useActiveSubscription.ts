import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Subscription state for the currently-authenticated user.
 *
 * - `loading`     true while the initial fetch is in flight
 * - `isActive`    user has at least one active/trialing subscription
 *                 whose period has not yet expired
 * - `tier`        the tier of the active subscription, or null
 * - `expiresAt`   ISO timestamp of current_period_end, or null
 * - `cancelAtPeriodEnd` true when the user has requested cancellation
 *                 (still active until expiresAt)
 * - `refresh()`   force re-fetch (call after a successful checkout)
 *
 * Backed by the `get_active_subscription` Postgres RPC defined in
 * migration 20260517080000_user_subscriptions.sql. RLS ensures the
 * RPC only sees the caller's own rows, so this hook is safe to call
 * from any authenticated component.
 */
export interface ActiveSubscription {
  loading: boolean;
  isActive: boolean;
  tier: string | null;
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  refresh: () => Promise<void>;
}

export function useActiveSubscription(requiredTier?: string): ActiveSubscription {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  const fetchSub = useCallback(async () => {
    if (!user?.id) {
      setTier(null);
      setExpiresAt(null);
      setCancelAtPeriodEnd(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("get_active_subscription", {
      p_user_id: user.id,
    });
    if (error || !data || data.length === 0) {
      setTier(null);
      setExpiresAt(null);
      setCancelAtPeriodEnd(false);
    } else {
      const row = data[0] as {
        tier: string;
        status: string;
        current_period_end: string;
        cancel_at_period_end: boolean;
      };
      setTier(row.tier);
      setExpiresAt(row.current_period_end);
      setCancelAtPeriodEnd(Boolean(row.cancel_at_period_end));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  const isActive = Boolean(
    tier && expiresAt && new Date(expiresAt).getTime() > Date.now() &&
    (!requiredTier || tier === requiredTier),
  );

  return { loading, isActive, tier, expiresAt, cancelAtPeriodEnd, refresh: fetchSub };
}
