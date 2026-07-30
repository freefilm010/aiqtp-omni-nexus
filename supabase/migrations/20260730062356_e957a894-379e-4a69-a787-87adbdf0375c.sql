CREATE OR REPLACE FUNCTION public.emergency_repair_auto_invest_allocation_duplicates()
RETURNS TABLE(groups_repaired integer, rows_deactivated integer, keepers_updated integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DROP TABLE IF EXISTS auto_invest_allocation_repair_groups;

  CREATE TEMP TABLE auto_invest_allocation_repair_groups ON COMMIT DROP AS
  SELECT
    (array_agg(id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id))[1] AS keeper_id,
    engine_id,
    asset_symbol,
    sum(coalesce(quantity, 0)) AS total_quantity,
    sum(coalesce(value_usd, 0)) AS total_value_usd,
    sum(coalesce(pnl_usd, 0)) AS total_pnl_usd,
    count(*)::integer AS row_count
  FROM public.auto_invest_allocations
  WHERE is_active = true
  GROUP BY engine_id, asset_symbol
  HAVING count(*) > 1;

  SELECT count(*)::integer INTO groups_repaired
  FROM auto_invest_allocation_repair_groups;

  CREATE INDEX auto_invest_allocation_repair_groups_keeper_idx
    ON auto_invest_allocation_repair_groups (keeper_id);
  CREATE INDEX auto_invest_allocation_repair_groups_engine_symbol_idx
    ON auto_invest_allocation_repair_groups (engine_id, asset_symbol);

  UPDATE public.auto_invest_allocations a
  SET
    quantity = g.total_quantity,
    value_usd = g.total_value_usd,
    pnl_usd = g.total_pnl_usd,
    updated_at = now()
  FROM auto_invest_allocation_repair_groups g
  WHERE a.id = g.keeper_id;

  GET DIAGNOSTICS keepers_updated = ROW_COUNT;

  UPDATE public.auto_invest_allocations a
  SET is_active = false,
      updated_at = now()
  FROM auto_invest_allocation_repair_groups g
  WHERE a.engine_id = g.engine_id
    AND a.asset_symbol = g.asset_symbol
    AND a.is_active = true
    AND a.id <> g.keeper_id;

  GET DIAGNOSTICS rows_deactivated = ROW_COUNT;

  DROP TABLE IF EXISTS auto_invest_allocation_repair_groups;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.emergency_repair_auto_invest_allocation_duplicates() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emergency_repair_auto_invest_allocation_duplicates() TO service_role;