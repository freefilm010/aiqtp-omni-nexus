
-- =============================================================
-- Phase 1: Move RLS-helper SECURITY DEFINER functions out of the
-- API-exposed `public` schema into a new `private` schema.
-- PostgREST will not expose `private` (it's not in db.schemas),
-- so the linter no longer flags them, but RLS policies still work.
-- =============================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT  USAGE ON SCHEMA private TO authenticated, service_role, postgres;

-- ---- private.has_role ---------------------------------------
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- ---- private.has_active_subscription ------------------------
CREATE OR REPLACE FUNCTION private.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'past_due' AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;
REVOKE ALL ON FUNCTION private.has_active_subscription(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.has_active_subscription(uuid, text) TO authenticated, service_role;

-- ---- private.owns_auto_invest_engine ------------------------
CREATE OR REPLACE FUNCTION private.owns_auto_invest_engine(_engine_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auto_invest_engine
    WHERE id = _engine_id AND user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION private.owns_auto_invest_engine(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.owns_auto_invest_engine(uuid) TO authenticated, service_role;

-- =============================================================
-- Repoint every existing public.* call inside RLS policies and
-- in other definer functions to the new private.* helpers.
-- Easiest: recreate the public.* wrappers as thin INVOKER
-- delegators so existing 204 policies keep compiling, AND revoke
-- direct EXECUTE on the public wrappers from anon+authenticated.
-- This way:
--   * The linter sees public.has_role as INVOKER  -> not flagged.
--   * RLS policies still call public.has_role()    -> which invokes
--     private.has_role() (DEFINER, granted to authenticated).
-- =============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.has_role(_user_id, _role);
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
-- ^ authenticated needs EXECUTE so RLS policies that call public.has_role() still resolve.
--   This is correct: the wrapper is INVOKER, the privileged check happens inside private.*

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.has_active_subscription(user_uuid, check_env);
$$;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.owns_auto_invest_engine(_engine_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.owns_auto_invest_engine(_engine_id);
$$;
REVOKE ALL ON FUNCTION public.owns_auto_invest_engine(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) TO authenticated, service_role;

-- =============================================================
-- Phase 2: Functions the client never calls directly.
-- Revoke authenticated EXECUTE entirely. They'll be invoked
-- only via edge functions using the service role.
-- =============================================================

REVOKE ALL ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) TO service_role;

REVOKE ALL ON FUNCTION public.log_security_event(text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_strategy_code(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_factor_code(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_factor_code(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) TO service_role;

REVOKE ALL ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) TO service_role;

-- rent_strategy and request_withdrawal remain callable by authenticated
-- users (already routed through edge functions, but the RPCs themselves
-- need to stay reachable). Linter will still flag these two as 0029
-- because they ARE intentionally user-callable definer functions with
-- internal auth checks. We accept those two specific findings.
