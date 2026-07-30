DO $do$
DECLARE
  v_sql text := $repair$
SET LOCAL statement_timeout = '0';

ALTER TABLE public.auto_invest_allocations DISABLE TRIGGER USER;

CREATE TEMP TABLE _aia_active ON COMMIT DROP AS
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
  ) AS rn
FROM public.auto_invest_allocations
WHERE is_active = TRUE;

CREATE INDEX ON _aia_active (id);

CREATE TEMP TABLE _aia_rollup ON COMMIT DROP AS
SELECT
  (ARRAY_AGG(id ORDER BY rn))[1] AS keeper_id,
  SUM(COALESCE(quantity, 0))  AS total_quantity,
  SUM(COALESCE(value_usd, 0)) AS total_value_usd,
  SUM(COALESCE(pnl_usd, 0))   AS total_pnl_usd
FROM _aia_active
GROUP BY engine_id, asset_symbol
HAVING COUNT(*) > 1;

UPDATE public.auto_invest_allocations a
SET quantity   = r.total_quantity,
    value_usd  = r.total_value_usd,
    pnl_usd    = r.total_pnl_usd,
    updated_at = now()
FROM _aia_rollup r
WHERE a.id = r.keeper_id;

UPDATE public.auto_invest_allocations a
SET is_active  = FALSE,
    updated_at = now()
FROM _aia_active d
WHERE a.id = d.id
  AND d.rn > 1;

ALTER TABLE public.auto_invest_allocations ENABLE TRIGGER USER;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_auto_invest_allocation_active
ON public.auto_invest_allocations (engine_id, asset_symbol)
WHERE is_active = TRUE;
$repair$;
BEGIN
  UPDATE supabase_migrations.schema_migrations
  SET statements = ARRAY[v_sql]
  WHERE version = '20260424103833';
END
$do$;

-- Ensure the safeguard also exists here (idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_auto_invest_allocation_active
ON public.auto_invest_allocations (engine_id, asset_symbol)
WHERE is_active = TRUE;