-- 1) Lock down all existing SECURITY DEFINER functions in public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- 2) Permanent guard: auto-revoke on every future CREATE/REPLACE FUNCTION
CREATE OR REPLACE FUNCTION public.lockdown_new_security_definer_functions()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.command_tag IN ('CREATE FUNCTION', 'ALTER FUNCTION')
       AND obj.schema_name = 'public' THEN
      IF EXISTS (
        SELECT 1 FROM pg_proc p
        WHERE p.oid = obj.objid AND p.prosecdef
      ) THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', obj.objid::regprocedure);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', obj.objid::regprocedure);
      END IF;
    END IF;
  END LOOP;
END $$;

DROP EVENT TRIGGER IF EXISTS trg_lockdown_security_definer_functions;
CREATE EVENT TRIGGER trg_lockdown_security_definer_functions
  ON ddl_command_end
  WHEN TAG IN ('CREATE FUNCTION', 'ALTER FUNCTION')
  EXECUTE FUNCTION public.lockdown_new_security_definer_functions();

REVOKE ALL ON FUNCTION public.lockdown_new_security_definer_functions() FROM PUBLIC, anon, authenticated;