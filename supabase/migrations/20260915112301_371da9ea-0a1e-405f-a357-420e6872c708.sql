REVOKE INSERT, UPDATE, DELETE ON public.token_balances FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.reward_redemptions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.token_burns FROM authenticated;

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('token_balances', 'reward_redemptions', 'token_burns')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END
$$;

GRANT SELECT ON public.token_balances TO authenticated;
GRANT SELECT ON public.reward_redemptions TO authenticated;
GRANT SELECT ON public.token_burns TO authenticated;
GRANT ALL ON public.token_balances TO service_role;
GRANT ALL ON public.reward_redemptions TO service_role;
GRANT ALL ON public.token_burns TO service_role;