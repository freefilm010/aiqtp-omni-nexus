ALTER TABLE public.market_prices 
  ALTER COLUMN price_change_percentage_24h TYPE NUMERIC(20,4),
  ALTER COLUMN price_change_percentage_7d TYPE NUMERIC(20,4),
  ALTER COLUMN price_change_percentage_30d TYPE NUMERIC(20,4),
  ALTER COLUMN ath_change_percentage TYPE NUMERIC(20,4),
  ALTER COLUMN atl_change_percentage TYPE NUMERIC(20,4);