CREATE OR REPLACE FUNCTION public.harden_security_surface()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  t text;
  r record;
  dropped int := 0;
  revoked int := 0;
BEGIN
  FOREACH t IN ARRAY ARRAY['chat_messages','elite_club_messages','auto_invest_engine','auto_invest_allocations'] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
      dropped := dropped + 1;
    END IF;
  END LOOP;

  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname <> 'harden_security_surface'
      AND (has_function_privilege('anon', p.oid, 'execute')
        OR has_function_privilege('authenticated', p.oid, 'execute'))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', r.proname, r.args);
    revoked := revoked + 1;
  END LOOP;

  RETURN jsonb_build_object('realtime_tables_removed', dropped, 'functions_locked', revoked);
END;
$fn$;

REVOKE ALL ON FUNCTION public.harden_security_surface() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.harden_security_surface() TO service_role;