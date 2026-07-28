
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- Re-grant EXECUTE for the small set of SECURITY DEFINER functions the app calls from
-- authenticated user sessions (admin-only checks are enforced inside the function bodies).
GRANT EXECUTE ON FUNCTION public.update_token_price(uuid, varchar, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) TO authenticated;

-- Drop broad SELECT policy on the public avatars bucket so clients cannot list files.
-- Public bucket URLs still serve individual files directly.
DROP POLICY IF EXISTS "Users can list own avatars" ON storage.objects;
