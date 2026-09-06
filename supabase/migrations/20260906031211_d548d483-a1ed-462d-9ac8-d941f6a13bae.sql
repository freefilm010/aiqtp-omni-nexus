-- 1. Remove user-scoped tables from realtime publication (idempotent)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['chat_messages','elite_club_messages','auto_invest_engine','auto_invest_allocations']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 2. Leaderboard raw table: owner + admin only
DROP POLICY IF EXISTS "Authenticated users can view leaderboards" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Users can view their own leaderboard entries" ON public.leaderboard_entries;
CREATE POLICY "Users can view their own leaderboard entries"
ON public.leaderboard_entries FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Revoke EXECUTE on all SECURITY DEFINER functions from anon/authenticated/PUBLIC
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- 4. Keep intentional user-callable helpers working (invoker-safe RPCs)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
      AND p.proname IN ('has_role','get_strategy_code','get_factor_code','get_user_usd_balance','log_security_event')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END $$;