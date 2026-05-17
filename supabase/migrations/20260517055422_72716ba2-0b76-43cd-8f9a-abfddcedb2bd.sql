CREATE TABLE IF NOT EXISTS public.system_status (
  key text PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read system status" ON public.system_status;
CREATE POLICY "Authenticated users read system status"
ON public.system_status
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins insert system status" ON public.system_status;
CREATE POLICY "Admins insert system status"
ON public.system_status
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update system status" ON public.system_status;
CREATE POLICY "Admins update system status"
ON public.system_status
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Service role manages system status" ON public.system_status;
CREATE POLICY "Service role manages system status"
ON public.system_status
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO public.system_status (key, active, reason)
VALUES ('main', true, 'System initialized')
ON CONFLICT (key) DO UPDATE
SET active = COALESCE(public.system_status.active, true),
    updated_at = now();

CREATE TABLE IF NOT EXISTS public.agent_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool text NOT NULL,
  agent_type text NOT NULL DEFAULT 'dev',
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  error_msg text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_directives_pending
ON public.agent_directives (status, created_at ASC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_agent_directives_user
ON public.agent_directives (user_id, created_at DESC);

ALTER TABLE public.agent_directives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own directives" ON public.agent_directives;
CREATE POLICY "Users manage own directives"
ON public.agent_directives
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages all directives" ON public.agent_directives;
CREATE POLICY "Service role manages all directives"
ON public.agent_directives
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.agent_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'healthy',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  loop_interval_seconds integer,
  processed_directives integer NOT NULL DEFAULT 0,
  active_strategies integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_heartbeats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read agent heartbeats" ON public.agent_heartbeats;
CREATE POLICY "Admins read agent heartbeats"
ON public.agent_heartbeats
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Service role manages agent heartbeats" ON public.agent_heartbeats;
CREATE POLICY "Service role manages agent heartbeats"
ON public.agent_heartbeats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.deposit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  amount_usd numeric(20,2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  environment text NOT NULL DEFAULT 'sandbox',
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id
ON public.deposit_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deposits_session_id
ON public.deposit_transactions (stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_deposits_payment_intent
ON public.deposit_transactions (stripe_payment_intent_id);

ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposit_transactions;
CREATE POLICY "Users can view own deposits"
ON public.deposit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposit_transactions;
CREATE POLICY "Admins can view all deposits"
ON public.deposit_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Service role can manage deposits" ON public.deposit_transactions;
CREATE POLICY "Service role can manage deposits"
ON public.deposit_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.reconciliation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  environment text NOT NULL DEFAULT 'live',
  stripe_subscription_count integer NOT NULL DEFAULT 0,
  db_subscription_count integer NOT NULL DEFAULT 0,
  stripe_revenue_cents bigint NOT NULL DEFAULT 0,
  db_deposit_total_cents bigint NOT NULL DEFAULT 0,
  discrepancies jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_run_at
ON public.reconciliation_reports (run_at DESC);

ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read reconciliation reports" ON public.reconciliation_reports;
CREATE POLICY "Admins read reconciliation reports"
ON public.reconciliation_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Service role manages reconciliation reports" ON public.reconciliation_reports;
CREATE POLICY "Service role manages reconciliation reports"
ON public.reconciliation_reports
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.credit_platform_deposit(
  p_user_id uuid,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_amount_usd numeric,
  p_currency text DEFAULT 'usd',
  p_environment text DEFAULT 'sandbox'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User is required';
  END IF;

  IF p_stripe_session_id IS NULL OR length(trim(p_stripe_session_id)) = 0 THEN
    RAISE EXCEPTION 'Checkout session is required';
  END IF;

  IF p_amount_usd IS NULL OR p_amount_usd < 20 THEN
    RAISE EXCEPTION 'Deposit must be at least 20 USD';
  END IF;

  INSERT INTO public.deposit_transactions (
    user_id,
    stripe_session_id,
    stripe_payment_intent_id,
    amount_usd,
    currency,
    status,
    environment,
    credited_at
  ) VALUES (
    p_user_id,
    p_stripe_session_id,
    p_stripe_payment_intent_id,
    p_amount_usd,
    lower(coalesce(p_currency, 'usd')),
    'credited',
    p_environment,
    now()
  )
  ON CONFLICT (stripe_session_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.portfolio_holdings (
    user_id,
    symbol,
    name,
    quantity,
    value_usd,
    change_24h,
    allocation_percent
  ) VALUES (
    p_user_id,
    'USD',
    'US Dollar Cash',
    p_amount_usd,
    p_amount_usd,
    0,
    0
  )
  ON CONFLICT (user_id, symbol) DO UPDATE SET
    quantity = public.portfolio_holdings.quantity + EXCLUDED.quantity,
    value_usd = coalesce(public.portfolio_holdings.value_usd, 0) + EXCLUDED.value_usd,
    updated_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_stale_agent_heartbeats(p_stale_after_seconds integer DEFAULT 300)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.agent_heartbeats
  SET status = 'stale', updated_at = now()
  WHERE last_seen_at < now() - make_interval(secs => p_stale_after_seconds)
    AND status <> 'stale';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_stale_agent_heartbeats(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_stale_agent_heartbeats(integer) TO service_role;