-- Production readiness pass: security drift + slow query indexes

-- 1) Stop public clients from listing all avatar objects. Public bucket URLs remain usable,
-- but broad storage.objects read policies should not allow enumeration.
DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read avatar files by path" ON storage.objects;

-- 2) Revoke broad EXECUTE from SECURITY DEFINER functions in the exposed public schema.
-- Intended client-callable helper RPCs are granted back explicitly below.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END $$;

-- Client-facing RPCs that already enforce ownership/admin checks internally.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rent_strategy(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) TO authenticated, service_role;

-- 3) Add indexes matching the slowest production queries.
CREATE INDEX IF NOT EXISTS idx_graduation_tests_strategy_id
  ON public.graduation_tests (strategy_id);

CREATE INDEX IF NOT EXISTS idx_graduation_tests_user_strategy
  ON public.graduation_tests (user_id, strategy_id);

CREATE INDEX IF NOT EXISTS idx_faucet_claims_user_id
  ON public.faucet_claims (user_id);

CREATE INDEX IF NOT EXISTS idx_faucet_claims_user_created_at_desc
  ON public.faucet_claims (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_invest_transactions_engine_created_at
  ON public.auto_invest_transactions (engine_id, created_at);

CREATE INDEX IF NOT EXISTS idx_auto_invest_transactions_engine_created_at_desc
  ON public.auto_invest_transactions (engine_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_invest_transactions_engine_type_status_created_at
  ON public.auto_invest_transactions (engine_id, transaction_type, status, created_at);