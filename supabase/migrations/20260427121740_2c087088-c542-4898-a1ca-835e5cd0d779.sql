-- ============================================================
-- SECURITY HARDENING SPRINT — 2026-04-27
-- ============================================================

-- ── 1. Realtime: scope channel subscriptions ────────────────
-- Without policies on realtime.messages, any authenticated user can
-- subscribe to any topic. Add policies that restrict to:
--   a) public broadcast topics (prefix "public:")
--   b) the user's own personal topic ("user:<uid>")
--   c) admin-only topics (prefix "admin:") — admins only
--   d) elite club topics — elite club members only (we re-use admin check
--      as a conservative default; product can refine later)

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read scoped channels" ON realtime.messages;
CREATE POLICY "Authenticated can read scoped channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Public broadcast topics anyone can listen to
    (extension = 'broadcast' AND topic LIKE 'public:%')
    -- User's own private topic
    OR (topic = 'user:' || auth.uid()::text)
    -- Admin-only topics
    OR (topic LIKE 'admin:%' AND public.has_role(auth.uid(), 'admin'))
    -- Postgres changes on tables the user can already read are gated by
    -- the underlying table's RLS, so allow the realtime row through.
    OR (extension = 'postgres_changes')
  );

DROP POLICY IF EXISTS "Authenticated can write scoped channels" ON realtime.messages;
CREATE POLICY "Authenticated can write scoped channels"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (extension = 'broadcast' AND topic LIKE 'public:%')
    OR (topic = 'user:' || auth.uid()::text)
    OR (topic LIKE 'admin:%' AND public.has_role(auth.uid(), 'admin'))
  );

-- Service role bypasses RLS, so server-side broadcasts continue to work.

-- ── 2. Revoke EXECUTE on internal SECURITY DEFINER functions ──
-- Anonymous visitors should never be able to invoke privileged helpers.
-- We keep authenticated EXECUTE on the small set of functions the app
-- actually calls from the client (see explicit GRANTs at the bottom).

-- Internal triggers / wallet operations / role helpers — admin or
-- service-role only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(varchar, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_token_price(uuid, varchar, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_market_price(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_operator_with_wallet(uuid, varchar, varchar, uuid, boolean, varchar[]) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_operator_transaction(uuid, uuid, numeric, varchar, varchar, text, varchar, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_profit_distribution(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_strategy_code(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_factor_code(uuid) FROM anon;

-- Grant back the ones the authenticated client legitimately needs.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) TO authenticated;

-- ── 3. Audit log: index for the CEO dashboard ─────────────────
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_time
  ON public.security_audit_log (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity_time
  ON public.security_audit_log (severity, created_at DESC);

-- ── 4. Reconciliation table for daily Stripe ↔ DB tie-out ─────
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
  status text NOT NULL DEFAULT 'pending', -- pending | clean | discrepancy | error
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read reconciliation reports" ON public.reconciliation_reports;
CREATE POLICY "Admins read reconciliation reports"
  ON public.reconciliation_reports
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role manages reconciliation reports" ON public.reconciliation_reports;
CREATE POLICY "Service role manages reconciliation reports"
  ON public.reconciliation_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_run_at
  ON public.reconciliation_reports (run_at DESC);

-- ── 5. Feature flags table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  audience text NOT NULL DEFAULT 'public', -- public | authenticated | admin | beta
  category text, -- core | trading | research | experimental | revenue | admin
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage feature flags" ON public.feature_flags;
CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed core flags (idempotent)
INSERT INTO public.feature_flags (flag_key, display_name, description, is_enabled, audience, category)
VALUES
  ('payments_live', 'Live Payments', 'Master switch for real-money checkout flows', true, 'public', 'revenue'),
  ('btcc_trading', 'BTCC Live Trading', 'Allow admins to place real BTCC orders from the platform', false, 'admin', 'trading'),
  ('quantum_lab', 'Quantum Lab', 'IBM Quantum hardware integration page', true, 'authenticated', 'research'),
  ('multiverse_engine', 'Multiverse Engine', 'Experimental simulation playground', true, 'authenticated', 'experimental'),
  ('moonshot_launchpad', 'Moonshot Launchpad', 'Token launch flows', true, 'authenticated', 'experimental'),
  ('charter_review_mode', 'Charter Review Mode', 'When ON, hide experimental routes from public navigation for OCC review', false, 'public', 'admin')
ON CONFLICT (flag_key) DO NOTHING;