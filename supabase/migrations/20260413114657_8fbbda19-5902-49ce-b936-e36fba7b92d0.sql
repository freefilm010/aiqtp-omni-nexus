
-- 1. Remove sensitive tables from Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'faucet_claims') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.faucet_claims;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'auto_invest_transactions') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.auto_invest_transactions;
  END IF;
END $$;

-- 2. Create a safe public leaderboard view without user_id
CREATE OR REPLACE VIEW public.leaderboard_public AS
SELECT 
  id,
  display_name,
  avatar_url,
  score,
  rank,
  category,
  badge,
  highlight_stat,
  period_type,
  period_start,
  updated_at
FROM public.leaderboard_entries;

-- 3. Enforce webhook_url = NULL for system templates
CREATE OR REPLACE FUNCTION public.enforce_system_template_no_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_system = true THEN
    NEW.webhook_url := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_system_template_no_webhook ON public.automation_templates;
CREATE TRIGGER trg_enforce_system_template_no_webhook
BEFORE INSERT OR UPDATE ON public.automation_templates
FOR EACH ROW
EXECUTE FUNCTION public.enforce_system_template_no_webhook();
