-- Consolidate duplicate ACTIVE allocations, then enforce uniqueness.
-- Single transaction: no window for new duplicates to appear.

DO $$
DECLARE
  v_groups integer := 0;
BEGIN
  -- Avoid the consolidate/recompute triggers firing mid-repair.
  ALTER TABLE public.auto_invest_allocations DISABLE TRIGGER USER;

  CREATE TEMP TABLE _aia_repair ON COMMIT DROP AS
  SELECT
    (array_agg(id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id))[1] AS keeper_id,
    engine_id,
    asset_symbol,
    sum(coalesce(quantity, 0))  AS total_quantity,
    sum(coalesce(value_usd, 0)) AS total_value_usd,
    sum(coalesce(pnl_usd, 0))   AS total_pnl_usd
  FROM public.auto_invest_allocations
  WHERE is_active = true
  GROUP BY engine_id, asset_symbol
  HAVING count(*) > 1;

  SELECT count(*) INTO v_groups FROM _aia_repair;
  RAISE NOTICE 'auto_invest_allocations duplicate groups found: %', v_groups;

  IF v_groups > 0 THEN
    CREATE INDEX ON _aia_repair (keeper_id);
    CREATE INDEX ON _aia_repair (engine_id, asset_symbol);

    UPDATE public.auto_invest_allocations a
    SET quantity   = r.total_quantity,
        value_usd  = r.total_value_usd,
        pnl_usd    = r.total_pnl_usd,
        updated_at = now()
    FROM _aia_repair r
    WHERE a.id = r.keeper_id;

    UPDATE public.auto_invest_allocations a
    SET is_active  = false,
        updated_at = now()
    FROM _aia_repair r
    WHERE a.engine_id = r.engine_id
      AND a.asset_symbol = r.asset_symbol
      AND a.is_active = true
      AND a.id <> r.keeper_id;
  END IF;

  ALTER TABLE public.auto_invest_allocations ENABLE TRIGGER USER;
EXCEPTION WHEN OTHERS THEN
  ALTER TABLE public.auto_invest_allocations ENABLE TRIGGER USER;
  RAISE;
END $$;

-- Enforce it from here on out.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_auto_invest_allocation_active
  ON public.auto_invest_allocations (engine_id, asset_symbol)
  WHERE is_active = true;
