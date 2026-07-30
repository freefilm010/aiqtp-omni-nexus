UPDATE supabase_migrations.schema_migrations
SET statements = ARRAY[
$repair_before_unique$
-- Live publish blocker repair: consolidate active allocation duplicates
-- before creating uniq_auto_invest_allocation_active.
-- Optimized for Live by materializing the duplicate work-set once.
DROP TABLE IF EXISTS pg_temp.auto_invest_allocation_dedup;

CREATE TEMP TABLE auto_invest_allocation_dedup ON COMMIT DROP AS
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
  HAVING MAX(active_count) > 1
)
SELECT
  ranked.id,
  ranked.engine_id,
  ranked.asset_symbol,
  ranked.rn,
  rollup.keeper_id,
  rollup.total_quantity,
  rollup.total_value_usd,
  rollup.total_pnl_usd
FROM ranked
JOIN rollup
  ON rollup.engine_id = ranked.engine_id
 AND rollup.asset_symbol = ranked.asset_symbol;

CREATE INDEX auto_invest_allocation_dedup_id_idx ON auto_invest_allocation_dedup (id);
CREATE INDEX auto_invest_allocation_dedup_keeper_idx ON auto_invest_allocation_dedup (keeper_id);

UPDATE public.auto_invest_allocations a
SET quantity = d.total_quantity,
    value_usd = d.total_value_usd,
    pnl_usd = d.total_pnl_usd,
    updated_at = now()
FROM auto_invest_allocation_dedup d
WHERE a.id = d.keeper_id
  AND d.rn = 1;

UPDATE public.auto_invest_allocations a
SET is_active = FALSE,
    updated_at = now()
FROM auto_invest_allocation_dedup d
WHERE a.id = d.id
  AND d.rn > 1
  AND a.is_active = TRUE;
$repair_before_unique$ || E'\n\n' || COALESCE(array_to_string(statements, E'\n\n'), '')
]
WHERE version = '20260424103833';