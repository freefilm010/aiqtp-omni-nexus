ALTER PUBLICATION supabase_realtime DROP TABLE
  public.faucet_claims,
  public.auto_invest_transactions,
  public.portfolio_holdings,
  public.market_alerts,
  public.risk_alerts,
  public.live_strategies;

DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Anyone can view active copy trading leaders" ON public.copy_trading_leaders;
DROP POLICY IF EXISTS "Anyone can view active satellite services" ON public.satellite_services;

REVOKE SELECT ON public.leaderboard_entries FROM anon;
REVOKE SELECT ON public.copy_trading_leaders FROM anon;
REVOKE SELECT ON public.satellite_services FROM anon;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, p.proname AS function_name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon', r.schema_name, r.function_name, r.args);
  END LOOP;
END $$;