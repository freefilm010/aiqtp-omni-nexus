CREATE OR REPLACE FUNCTION public.ingest_venue_candles(
  p_symbol text DEFAULT 'BTC-USDT',
  p_interval text DEFAULT '1h',
  p_limit int DEFAULT 1000
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req bigint;
  v_res int;
  v_to bigint := extract(epoch from now())::bigint;
  v_from bigint;
BEGIN
  v_res := CASE p_interval WHEN '1m' THEN 1 WHEN '5m' THEN 5 WHEN '15m' THEN 15
                           WHEN '30m' THEN 30 WHEN '1h' THEN 60 WHEN '4h' THEN 240
                           WHEN '1d' THEN 1440 ELSE 60 END;
  v_from := v_to - (v_res * 60 * p_limit);

  SELECT net.http_get(
    url := format('https://api.hollaex.com/v2/chart?symbol=%s&resolution=%s&from=%s&to=%s',
                  lower(p_symbol), v_res, v_from, v_to),
    timeout_milliseconds := 20000
  ) INTO v_req;

  INSERT INTO public.system_runtime_config(key, value, updated_at)
  VALUES ('venue_candles_request:' || p_symbol || ':' || p_interval, v_req::text, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  RETURN v_req;
END $$;

CREATE OR REPLACE FUNCTION public.collect_venue_candles(
  p_symbol text DEFAULT 'BTC-USDT',
  p_interval text DEFAULT '1h',
  p_store_symbol text DEFAULT 'BTCUSDT'
) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req bigint;
  v_body jsonb;
  v_rows int := 0;
BEGIN
  SELECT value::bigint INTO v_req FROM public.system_runtime_config
   WHERE key = 'venue_candles_request:' || p_symbol || ':' || p_interval;
  IF v_req IS NULL THEN RETURN 0; END IF;

  SELECT content::jsonb INTO v_body
    FROM net._http_response WHERE id = v_req AND status_code = 200;
  IF v_body IS NULL OR jsonb_typeof(v_body) <> 'array' THEN RETURN 0; END IF;

  INSERT INTO public.market_ohlcv_cache (symbol, timeframe, open_time, open, high, low, close, volume)
  SELECT p_store_symbol, p_interval,
         (k->>'time')::timestamptz,
         (k->>'open')::numeric, (k->>'high')::numeric, (k->>'low')::numeric,
         (k->>'close')::numeric, coalesce((k->>'volume')::numeric, 0)
  FROM jsonb_array_elements(v_body) k
  WHERE k ? 'time' AND k ? 'close'
  ON CONFLICT (symbol, timeframe, open_time) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END $$;

REVOKE ALL ON FUNCTION public.ingest_venue_candles(text, text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.collect_venue_candles(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_venue_candles(text, text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.collect_venue_candles(text, text, text) TO service_role;

DROP FUNCTION IF EXISTS public.ingest_binance_klines(text, text, int);
DROP FUNCTION IF EXISTS public.collect_binance_klines(text, text);

SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('binance-klines-refresh','strategy-market-replay-training');

SELECT cron.schedule('strategy-market-replay-training', '7 * * * *', $cron$
  SELECT public.collect_venue_candles('BTC-USDT','1h','BTCUSDT');
  SELECT public.train_strategies_market_replay(60, 20, 'BTCUSDT');
  SELECT public.ingest_venue_candles('BTC-USDT','1h',1000);
$cron$);

SELECT public.ingest_venue_candles('BTC-USDT','1h',1000);