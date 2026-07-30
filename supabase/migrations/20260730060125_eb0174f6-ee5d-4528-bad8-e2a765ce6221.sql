-- Speed up duplicate detection on both environments.
CREATE INDEX IF NOT EXISTS idx_aia_engine_symbol_active
ON public.auto_invest_allocations (engine_id, asset_symbol)
WHERE is_active = TRUE;

-- Rewrite the stored (still-pending on Live) repair migration with a fast,
-- statement-timeout-safe implementation split into small statements.
UPDATE supabase_migrations.schema_migrations
SET statements = ARRAY[
  'CREATE INDEX IF NOT EXISTS idx_aia_engine_symbol_active ON public.auto_invest_allocations (engine_id, asset_symbol) WHERE is_active = TRUE',
  'UPDATE public.auto_invest_allocations a SET quantity = r.total_quantity, value_usd = r.total_value_usd, pnl_usd = r.total_pnl_usd, updated_at = now() FROM (SELECT (ARRAY_AGG(id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id))[1] AS keeper_id, SUM(COALESCE(quantity,0)) AS total_quantity, SUM(COALESCE(value_usd,0)) AS total_value_usd, SUM(COALESCE(pnl_usd,0)) AS total_pnl_usd FROM public.auto_invest_allocations WHERE is_active = TRUE GROUP BY engine_id, asset_symbol HAVING COUNT(*) > 1) r WHERE a.id = r.keeper_id',
  'WITH keep AS (SELECT DISTINCT ON (engine_id, asset_symbol) id FROM public.auto_invest_allocations WHERE is_active = TRUE ORDER BY engine_id, asset_symbol, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id) UPDATE public.auto_invest_allocations a SET is_active = FALSE, updated_at = now() WHERE a.is_active = TRUE AND NOT EXISTS (SELECT 1 FROM keep k WHERE k.id = a.id)',
  'CREATE UNIQUE INDEX IF NOT EXISTS uniq_auto_invest_allocation_active ON public.auto_invest_allocations (engine_id, asset_symbol) WHERE is_active = TRUE'
]
WHERE version = '20260424103833';