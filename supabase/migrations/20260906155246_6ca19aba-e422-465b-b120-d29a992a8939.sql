-- Revoke EXECUTE on all SECURITY DEFINER functions in public from PUBLIC/anon/authenticated
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef AND n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;', r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role;', r.proname, r.args);
  END LOOP;
END $$;

-- Event trigger: auto-lock any newly created SECURITY DEFINER function in public
CREATE OR REPLACE FUNCTION public.lockdown_new_security_definer_functions()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag IN ('CREATE FUNCTION','ALTER FUNCTION')
  LOOP
    IF obj.schema_name = 'public' THEN
      PERFORM 1 FROM pg_proc p WHERE p.oid = obj.objid AND p.prosecdef;
      IF FOUND THEN
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated;', obj.object_identity);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', obj.object_identity);
      END IF;
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.lockdown_new_security_definer_functions() FROM PUBLIC, anon, authenticated;

DROP EVENT TRIGGER IF EXISTS trg_lockdown_security_definer;
CREATE EVENT TRIGGER trg_lockdown_security_definer
  ON ddl_command_end
  WHEN TAG IN ('CREATE FUNCTION','ALTER FUNCTION')
  EXECUTE FUNCTION public.lockdown_new_security_definer_functions();