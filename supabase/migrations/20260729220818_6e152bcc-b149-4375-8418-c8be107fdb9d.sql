DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_tokens WHERE symbol = 'AIQ'
  ) THEN
    INSERT INTO public.platform_tokens (
      symbol,
      name,
      chain,
      total_supply,
      circulating_supply,
      treasury_supply,
      faucet_pool,
      decimals,
      is_active,
      is_native
    ) VALUES (
      'AIQ',
      'AI Quant Token',
      'ethereum',
      1000000000,
      0,
      900000000,
      50000000,
      18,
      true,
      false
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.platform_tokens WHERE symbol = 'NXS'
  ) THEN
    INSERT INTO public.platform_tokens (
      symbol,
      name,
      chain,
      total_supply,
      circulating_supply,
      treasury_supply,
      faucet_pool,
      decimals,
      is_active,
      is_native
    ) VALUES (
      'NXS',
      'Nexus Token',
      'polygon',
      500000000,
      0,
      450000000,
      25000000,
      18,
      true,
      false
    );
  END IF;
END $$;

INSERT INTO public.token_price_feeds (
  token_id,
  base_currency,
  price,
  price_24h_ago,
  change_24h_percent,
  source,
  last_updated
)
SELECT id, 'USD', 0, 0, 0, 'awaiting_live_oracle', now()
FROM public.platform_tokens
WHERE symbol IN ('AIQ', 'NXS')
ON CONFLICT (token_id, base_currency) DO UPDATE SET
  source = CASE
    WHEN public.token_price_feeds.price = 0 THEN 'awaiting_live_oracle'
    ELSE public.token_price_feeds.source
  END,
  last_updated = now();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    PERFORM cron.unschedule('market-price-refresh-5min')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'market-price-refresh-5min');

    PERFORM cron.unschedule('market-data-full-sync-hourly')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'market-data-full-sync-hourly');

    PERFORM cron.schedule(
      'market-price-refresh-5min',
      '*/5 * * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://rueaxiyvseaxkysnoock.supabase.co/functions/v1/market-data-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{"action":"get_price","params":{"coinIds":["bitcoin","ethereum","solana","usd-coin","tether","binancecoin","ripple","cardano","dogecoin","avalanche-2","polkadot","chainlink","matic-network","uniswap","aave","arbitrum","optimism","litecoin","near","cosmos"]}}'::jsonb
      ) AS request_id;
      $cron$
    );

    PERFORM cron.schedule(
      'market-data-full-sync-hourly',
      '0 * * * *',
      $cron$
      SELECT net.http_post(
        url := 'https://rueaxiyvseaxkysnoock.supabase.co/functions/v1/market-data-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{"action":"sync_market_prices","params":{"perPage":250,"pages":4}}'::jsonb
      ) AS request_id;
      $cron$
    );
  END IF;
END $$;