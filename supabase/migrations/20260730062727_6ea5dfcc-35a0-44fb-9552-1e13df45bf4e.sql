SET LOCAL statement_timeout = '120s';

CREATE INDEX IF NOT EXISTS idx_aia_engine_symbol_active
ON public.auto_invest_allocations (engine_id, asset_symbol)
WHERE is_active = true;

DROP TABLE IF EXISTS auto_invest_allocation_publish_repair;

CREATE TEMP TABLE auto_invest_allocation_publish_repair ON COMMIT DROP AS
SELECT
  (array_agg(id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id))[1] AS keeper_id,
  engine_id,
  asset_symbol,
  sum(coalesce(quantity, 0)) AS total_quantity,
  sum(coalesce(value_usd, 0)) AS total_value_usd,
  sum(coalesce(pnl_usd, 0)) AS total_pnl_usd
FROM public.auto_invest_allocations
WHERE is_active = true
GROUP BY engine_id, asset_symbol
HAVING count(*) > 1;

CREATE INDEX auto_invest_allocation_publish_repair_keeper_idx
ON auto_invest_allocation_publish_repair (keeper_id);

CREATE INDEX auto_invest_allocation_publish_repair_group_idx
ON auto_invest_allocation_publish_repair (engine_id, asset_symbol);

UPDATE public.auto_invest_allocations a
SET
  quantity = r.total_quantity,
  value_usd = r.total_value_usd,
  pnl_usd = r.total_pnl_usd,
  updated_at = now()
FROM auto_invest_allocation_publish_repair r
WHERE a.id = r.keeper_id;

UPDATE public.auto_invest_allocations a
SET
  is_active = false,
  updated_at = now()
FROM auto_invest_allocation_publish_repair r
WHERE a.engine_id = r.engine_id
  AND a.asset_symbol = r.asset_symbol
  AND a.is_active = true
  AND a.id <> r.keeper_id;

DROP TABLE IF EXISTS auto_invest_allocation_publish_repair;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_auto_invest_allocation_active
ON public.auto_invest_allocations (engine_id, asset_symbol)
WHERE is_active = true;