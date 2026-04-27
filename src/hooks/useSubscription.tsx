import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
  created_at: string;
  updated_at: string;
}

function computeIsActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const now = Date.now();
  if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') {
    return end === null || end > now;
  }
  if (sub.status === 'canceled') {
    return end !== null && end > now;
  }
  return false;
}

export function useSubscription(userId: string | null | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const env = getStripeEnvironment();
    const fetchSub = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('environment', env)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setSubscription((data as Subscription) || null);
        setLoading(false);
      }
    };
    fetchSub();

    const channel = supabase
      .channel(`sub-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${userId}`,
      }, () => fetchSub())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    subscription,
    loading,
    isActive: computeIsActive(subscription),
  };
}