WITH ranked AS (
  SELECT
    id,
    engine_id,
    asset_symbol,
    quantity,
    value_usd,
    pnl_usd,
    ROW_NUMBER() OVER (
      PARTITION BY engine_id, asset_symbol
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS rn,
    COUNT(*) OVER (PARTITION BY engine_id, asset_symbol) AS active_count
  FROM public.auto_invest_allocations
  WHERE is_active = TRUE
), rollup AS (
  SELECT
    engine_id,
    asset_symbol,
    (ARRAY_AGG(id ORDER BY rn))[1] AS keeper_id,
    SUM(COALESCE(quantity, 0)) AS total_quantity,
    SUM(COALESCE(value_usd, 0)) AS total_value_usd,
    SUM(COALESCE(pnl_usd, 0)) AS total_pnl_usd,
    MAX(active_count) AS active_count
  FROM ranked
  GROUP BY engine_id, asset_symbol
)
UPDATE public.auto_invest_allocations a
SET quantity = r.total_quantity,
    value_usd = r.total_value_usd,
    pnl_usd = r.total_pnl_usd,
    updated_at = now()
FROM rollup r
WHERE a.id = r.keeper_id
  AND r.active_count > 1;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY engine_id, asset_symbol
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS rn
  FROM public.auto_invest_allocations
  WHERE is_active = TRUE
)
UPDATE public.auto_invest_allocations a
SET is_active = FALSE,
    updated_at = now()
FROM ranked r
WHERE a.id = r.id
  AND r.rn > 1;