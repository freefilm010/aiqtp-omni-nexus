create extension if not exists pg_cron;
select cron.schedule('market-refresh-cycle-hourly', '0 * * * *', $$select public.run_market_refresh_cycle(true);$$);