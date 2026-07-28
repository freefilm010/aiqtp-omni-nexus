CREATE OR REPLACE FUNCTION public.repair_auto_invest_allocation_duplicates()
RETURNS TABLE(groups_repaired integer, rows_deactivated integer, keepers_updated integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_groups_repaired integer := 0;
  v_rows_deactivated integer := 0;
  v_keepers_updated integer := 0;
BEGIN
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
  ), updated AS (
    UPDATE public.auto_invest_allocations a
    SET quantity = r.total_quantity,
        value_usd = r.total_value_usd,
        pnl_usd = r.total_pnl_usd,
        updated_at = now()
    FROM rollup r
    WHERE a.id = r.keeper_id
    RETURNING a.id
  )
  SELECT COUNT(*) INTO v_keepers_updated FROM updated;

  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY engine_id, asset_symbol
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
      ) AS rn
    FROM public.auto_invest_allocations
    WHERE is_active = TRUE
  ), deactivated AS (
    UPDATE public.auto_invest_allocations a
    SET is_active = FALSE,
        updated_at = now()
    FROM ranked r
    WHERE a.id = r.id
      AND r.rn > 1
    RETURNING a.id
  )
  SELECT COUNT(*) INTO v_rows_deactivated FROM deactivated;

  v_groups_repaired := v_keepers_updated;

  RETURN QUERY SELECT v_groups_repaired, v_rows_deactivated, v_keepers_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.repair_auto_invest_allocation_duplicates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.repair_auto_invest_allocation_duplicates() TO service_role;

SELECT * FROM public.repair_auto_invest_allocation_duplicates();