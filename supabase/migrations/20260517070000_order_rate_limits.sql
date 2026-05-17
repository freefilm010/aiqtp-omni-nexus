-- order_rate_limits — persistent per-user order timestamps for the
-- "max 5 orders per rolling hour" guardrail in core-brain/trading_worker.py.
--
-- The previous implementation kept rate-limit state in an in-memory dict
-- (_alpaca_order_times), which reset on every Render restart. Render free
-- and starter tiers sleep / restart frequently, effectively zeroing the
-- counter several times per day. A persistent table is the simplest correct
-- fix.

CREATE TABLE IF NOT EXISTS public.order_rate_limits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  placed_at    timestamptz NOT NULL DEFAULT now(),
  agent_type   text,
  symbol       text,
  side         text,
  notional_usd numeric(20,4)
);

-- Pull the recent window for a given user efficiently
CREATE INDEX IF NOT EXISTS idx_order_rate_limits_user_time
  ON public.order_rate_limits (user_id, placed_at DESC);

-- Housekeeping index for periodic cleanup of old rows
CREATE INDEX IF NOT EXISTS idx_order_rate_limits_old
  ON public.order_rate_limits (placed_at);

ALTER TABLE public.order_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users may see only their own order timestamps
DROP POLICY IF EXISTS "Users can view own rate-limit rows" ON public.order_rate_limits;
CREATE POLICY "Users can view own rate-limit rows"
ON public.order_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service_role (trading worker + trading-service backend) writes rows
DROP POLICY IF EXISTS "Service role manages rate-limit rows" ON public.order_rate_limits;
CREATE POLICY "Service role manages rate-limit rows"
ON public.order_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Convenience function: count orders placed by user in the last <minutes> minutes.
-- Trading code calls this instead of re-implementing the time-window query.
CREATE OR REPLACE FUNCTION public.count_recent_orders(
  p_user_id uuid,
  p_minutes int DEFAULT 60
) RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::int
  FROM public.order_rate_limits
  WHERE user_id = p_user_id
    AND placed_at >= now() - make_interval(mins => p_minutes);
$$;

-- Optional housekeeping: drop rows older than 7 days. Run via cron.
CREATE OR REPLACE FUNCTION public.purge_old_rate_limits()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted int;
BEGIN
  DELETE FROM public.order_rate_limits
  WHERE placed_at < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
