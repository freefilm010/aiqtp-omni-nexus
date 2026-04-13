-- Update the existing cron job to run every 5 minutes with the lightweight get_price action
SELECT cron.unschedule('market-data-sync-hourly');

-- Lightweight price refresh every 5 minutes (top 20 coins only)
SELECT cron.schedule(
  'market-price-refresh-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rueaxiyvseaxkysnoock.supabase.co/functions/v1/market-data-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZWF4aXl2c2VheGt5c25vb2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDkwMDEsImV4cCI6MjA4OTQyNTAwMX0.07J92R1g2-ihtnN43iYD63jU3gByBK3otB5zq3haw54"}'::jsonb,
    body := '{"action": "get_price", "params": {"coinIds": ["bitcoin","ethereum","solana","usd-coin","tether","binancecoin","ripple","cardano","dogecoin","avalanche-2","polkadot","chainlink","matic-network","uniswap","aave","arbitrum","optimism","litecoin","near","cosmos"]}}'::jsonb
  ) AS request_id;
  $$
);

-- Full market sync every hour (deep sync with volume, market cap, etc.)
SELECT cron.schedule(
  'market-data-full-sync-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rueaxiyvseaxkysnoock.supabase.co/functions/v1/market-data-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZWF4aXl2c2VheGt5c25vb2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDkwMDEsImV4cCI6MjA4OTQyNTAwMX0.07J92R1g2-ihtnN43iYD63jU3gByBK3otB5zq3haw54"}'::jsonb,
    body := '{"action": "sync_market_prices", "params": {"perPage": 250, "pages": 4}}'::jsonb
  ) AS request_id;
  $$
);