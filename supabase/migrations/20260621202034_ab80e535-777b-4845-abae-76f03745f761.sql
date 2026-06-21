ALTER TABLE public.automation_templates
  DROP CONSTRAINT IF EXISTS automation_templates_system_webhook_url_null;

UPDATE public.automation_templates
SET webhook_url = NULL
WHERE is_system IS TRUE
  AND webhook_url IS NOT NULL;

ALTER TABLE public.automation_templates
  ADD CONSTRAINT automation_templates_system_webhook_url_null
  CHECK (is_system IS DISTINCT FROM TRUE OR webhook_url IS NULL);

REVOKE EXECUTE ON FUNCTION public.guard_automation_templates_webhook_url() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_automation_templates_webhook_url() TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.copy_trading_leaders TO authenticated;
GRANT ALL ON public.copy_trading_leaders TO service_role;

DROP POLICY IF EXISTS "Admins manage copy trading leaders" ON public.copy_trading_leaders;
CREATE POLICY "Admins manage copy trading leaders"
ON public.copy_trading_leaders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DO $$
DECLARE
  private_table text;
BEGIN
  FOREACH private_table IN ARRAY ARRAY[
    'chat_messages',
    'elite_club_messages',
    'auto_invest_engine',
    'auto_invest_allocations',
    'leaderboard_entries',
    'copy_trading_leaders',
    'satellite_services'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = private_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', private_table);
    END IF;
  END LOOP;
END $$;