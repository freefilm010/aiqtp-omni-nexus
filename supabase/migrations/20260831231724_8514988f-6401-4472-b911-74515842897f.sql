CREATE OR REPLACE FUNCTION public.lockdown_new_security_definer_functions()
RETURNS event_trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.command_tag IN ('CREATE FUNCTION', 'ALTER FUNCTION')
       AND obj.schema_name = 'public' THEN
      IF EXISTS (SELECT 1 FROM pg_proc p WHERE p.oid = obj.objid AND p.prosecdef) THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', obj.objid::regprocedure);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', obj.objid::regprocedure);
      END IF;
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.lockdown_new_security_definer_functions() FROM PUBLIC, anon, authenticated;