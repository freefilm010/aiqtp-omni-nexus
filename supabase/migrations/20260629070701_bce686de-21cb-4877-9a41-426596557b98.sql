
-- =========================================================
-- 1. Revoke EXECUTE on every public SECURITY DEFINER function
--    from PUBLIC, anon, authenticated. service_role retains
--    access (superuser-equivalent) so triggers and edge
--    functions are unaffected.
-- =========================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated;',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- =========================================================
-- 2. Re-grant EXECUTE to authenticated for the functions the
--    client app actually invokes via PostgREST RPC.
-- =========================================================
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rent_strategy(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) TO authenticated;
-- update_token_price performs an internal has_role('admin') check; safe to expose to authenticated.
GRANT EXECUTE ON FUNCTION public.update_token_price(uuid, character varying, numeric) TO authenticated;

-- =========================================================
-- 3. Storage: remove broad listing on the public avatars
--    bucket. Public reads via direct URL still work; users
--    can still upload/update/delete their own avatar; admin
--    UI never needs to enumerate the bucket.
-- =========================================================
DROP POLICY IF EXISTS "Owners can list own avatar folder" ON storage.objects;
