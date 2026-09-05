-- lovable-cron-fallback-reviewed: 288 runs/day; market prices come from an external feed with no change event, consolidated into one job
INSERT INTO public.system_runtime_config(key, value)
SELECT 'functions_base_url',
       CASE (SELECT system_identifier::text FROM pg_control_system())
         WHEN '7566321509619296712' THEN 'https://msgzfkcqnkzdnlvuhnmn.supabase.co/functions/v1'
         ELSE 'https://rueaxiyvseaxkysnoock.supabase.co/functions/v1'
       END
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

INSERT INTO public.system_runtime_config(key, value)
VALUES ('cron_secret', '4ff87c0945444a6ead83554abd2f95f2ebe9c7599420c8a43bc226a0404c9d38')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

SELECT cron.unschedule(jobname) FROM cron.job
WHERE jobname IN ('market-price-refresh-5min','market-data-full-sync-hourly','platform-token-refresh-5min','platform-token-refresh-1min');

CREATE OR REPLACE FUNCTION public.run_market_refresh_cycle(deep boolean DEFAULT false)
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
    RAISE NOTICE 'refresh config missing';
    RETURN;
  END IF;
  v_hdr := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret);

  PERFORM net.http_post(
    url := v_base || '/market-data-sync',
    headers := v_hdr,
    body := jsonb_build_object('action','sync_market_prices','params', jsonb_build_object('perPage',250,'pages', CASE WHEN deep THEN 4 ELSE 1 END))
  );

  PERFORM net.http_post(url := v_base || '/platform-token-refresh', headers := v_hdr, body := '{}'::jsonb);
END;
$fn$;

REVOKE ALL ON FUNCTION public.run_market_refresh_cycle(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_market_refresh_cycle(boolean) FROM anon;
REVOKE ALL ON FUNCTION public.run_market_refresh_cycle(boolean) FROM authenticated;

SELECT cron.schedule('market-refresh-cycle-5min','*/5 * * * *', $$SELECT public.run_market_refresh_cycle(false);$$);
SELECT cron.schedule('market-refresh-cycle-hourly','0 * * * *', $$SELECT public.run_market_refresh_cycle(true);$$);