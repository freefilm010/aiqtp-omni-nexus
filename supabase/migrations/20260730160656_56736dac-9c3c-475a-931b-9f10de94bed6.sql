DROP POLICY IF EXISTS "System can insert trade logs" ON public.trade_logs;
DROP POLICY IF EXISTS "Authenticated users insert own trade logs" ON public.trade_logs;
REVOKE INSERT, UPDATE, DELETE ON public.trade_logs FROM anon, authenticated;
GRANT SELECT ON public.trade_logs TO authenticated;
GRANT ALL ON public.trade_logs TO service_role;

DROP POLICY IF EXISTS "Users can update own paper trades" ON public.paper_trades;
REVOKE UPDATE, DELETE ON public.paper_trades FROM anon, authenticated;
GRANT SELECT, INSERT ON public.paper_trades TO authenticated;
GRANT ALL ON public.paper_trades TO service_role;

REVOKE UPDATE, DELETE ON public.trade_events FROM anon, authenticated;
GRANT SELECT, INSERT ON public.trade_events TO authenticated;
GRANT ALL ON public.trade_events TO service_role;