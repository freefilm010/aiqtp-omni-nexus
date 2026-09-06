-- lovable-cron-fallback-reviewed: 24 runs/day; engine rebalancing has no database change event to hook into
CREATE OR REPLACE FUNCTION public.run_autonomous_invest_cycle()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_base   text := (SELECT value FROM public.system_runtime_config WHERE key='functions_base_url');
  v_secret text := (SELECT value FROM public.system_runtime_config WHERE key='cron_secret');
  v_hdr    jsonb;
BEGIN
  IF v_base IS NULL OR v_secret IS NULL THEN
    RAISE NOTICE 'autonomous cycle config missing';
    RETURN;
  END IF;
  v_hdr := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret);

  PERFORM net.http_post(url := v_base || '/auto-invest', headers := v_hdr, body := '{"action":"autonomous_cycle"}'::jsonb);
  PERFORM net.http_post(url := v_base || '/compound-snapshot', headers := v_hdr, body := '{}'::jsonb);
END;
$fn$;

REVOKE ALL ON FUNCTION public.run_autonomous_invest_cycle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_autonomous_invest_cycle() FROM anon;
REVOKE ALL ON FUNCTION public.run_autonomous_invest_cycle() FROM authenticated;

SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('auto-invest-hourly','autonomous-invest-cycle-hourly');
SELECT cron.schedule('autonomous-invest-cycle-hourly','0 * * * *', $$SELECT public.run_autonomous_invest_cycle();$$);