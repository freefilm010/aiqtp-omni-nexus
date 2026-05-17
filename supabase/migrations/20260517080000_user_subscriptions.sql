-- user_subscriptions — Stripe subscription state mirror for Signals Pro
-- and related recurring AIQTP products.
--
-- Schema mirrors Stripe Subscription objects: one row per active or
-- past-due/canceled subscription. The webhook keeps it in sync via
-- customer.subscription.created/updated/deleted + invoice.payment_succeeded.
--
-- Source of truth is Stripe; this table is a local cache for fast access
-- gating (avoid hitting Stripe API on every request).

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id     text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_price_id        text NOT NULL,
  tier                   text NOT NULL,            -- 'signals_pro' | 'pro_trader' | 'elite' | future tiers
  status                 text NOT NULL,            -- 'active'|'past_due'|'canceled'|'incomplete'|'trialing'|'unpaid'|'paused'
  environment            text NOT NULL DEFAULT 'live' CHECK (environment IN ('sandbox', 'live')),
  current_period_start   timestamptz,
  current_period_end     timestamptz NOT NULL,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  canceled_at            timestamptz,
  trial_start            timestamptz,
  trial_end              timestamptz,
  metadata               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subs_user
  ON public.user_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_subs_active
  ON public.user_subscriptions (user_id, status, current_period_end DESC)
  WHERE status IN ('active', 'trialing', 'past_due');

CREATE INDEX IF NOT EXISTS idx_user_subs_stripe_customer
  ON public.user_subscriptions (stripe_customer_id);

-- updated_at auto-touch
CREATE OR REPLACE FUNCTION public.touch_user_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_subscriptions_touch ON public.user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_touch
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_subscriptions_updated_at();

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users see only their own subscriptions
DROP POLICY IF EXISTS "Users read own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users read own subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service_role (webhook) modifies subscription rows. Users cannot
-- INSERT/UPDATE/DELETE directly — all changes flow through Stripe webhook.
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role manages subscriptions"
ON public.user_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can see all subscriptions (for support + reconciliation)
DROP POLICY IF EXISTS "Admins read all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins read all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Access-gate helper. SECURITY DEFINER so frontend RPC + backend code use
-- the same authoritative check. Returns true when the user has an active
-- or trialing subscription whose period hasn't expired. When p_tier is
-- provided, also requires tier match.
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  p_user_id uuid,
  p_tier    text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing')
      AND current_period_end > now()
      AND (p_tier IS NULL OR tier = p_tier)
  );
$$;

-- Convenience: return the active subscription row for a user (or null)
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_user_id uuid)
RETURNS TABLE (
  tier               text,
  status             text,
  current_period_end timestamptz,
  cancel_at_period_end boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT us.tier, us.status, us.current_period_end, us.cancel_at_period_end
  FROM public.user_subscriptions us
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing', 'past_due')
    AND us.current_period_end > now()
  ORDER BY us.current_period_end DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_active_subscription(uuid) TO authenticated, service_role;
