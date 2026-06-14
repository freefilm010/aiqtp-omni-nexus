
-- Lock down raw tables that have sanitized *_public mirrors
DROP POLICY IF EXISTS "Authenticated can view active copy trading leaders" ON public.copy_trading_leaders;
DROP POLICY IF EXISTS "Authenticated can view leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Authenticated users can view leaderboards" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Admins can view satellite services" ON public.satellite_services;

REVOKE SELECT ON public.copy_trading_leaders FROM anon, authenticated;
REVOKE SELECT ON public.leaderboard_entries FROM anon, authenticated;
REVOKE SELECT ON public.satellite_services FROM anon, authenticated;
GRANT SELECT ON public.copy_trading_leaders TO service_role;
GRANT SELECT ON public.leaderboard_entries TO service_role;
GRANT SELECT ON public.satellite_services TO service_role;

-- Remove leaderboard_entries from realtime publication (it contains raw user_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='leaderboard_entries'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.leaderboard_entries';
  END IF;
END$$;

-- Strip webhook_url from automation_templates for non-admin writers
CREATE OR REPLACE FUNCTION public.guard_automation_templates_webhook_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.webhook_url := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_automation_templates_webhook_url_ins ON public.automation_templates;
DROP TRIGGER IF EXISTS guard_automation_templates_webhook_url_upd ON public.automation_templates;

CREATE TRIGGER guard_automation_templates_webhook_url_ins
  BEFORE INSERT ON public.automation_templates
  FOR EACH ROW EXECUTE FUNCTION public.guard_automation_templates_webhook_url();

CREATE TRIGGER guard_automation_templates_webhook_url_upd
  BEFORE UPDATE ON public.automation_templates
  FOR EACH ROW EXECUTE FUNCTION public.guard_automation_templates_webhook_url();

-- Scrub any existing non-admin webhook_url values
UPDATE public.automation_templates
SET webhook_url = NULL
WHERE webhook_url IS NOT NULL
  AND NOT public.has_role(user_id, 'admin');
