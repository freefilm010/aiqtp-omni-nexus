-- Idempotent repair: collapses duplicate active allocation rows (sums quantity/value/PnL onto a keeper)
-- and guarantees the one-active-row-per-(engine, asset) rule. Safe to re-run; runs on Live at publish.
SET statement_timeout = '10min';

DO $$
DECLARE
  v_dupes bigint;
BEGIN
  SELECT count(*) INTO v_dupes
  FROM (
    SELECT engine_id, asset_symbol
    FROM public.auto_invest_allocations
    WHERE is_active = true
    GROUP BY engine_id, asset_symbol
    HAVING count(*) > 1
  ) d;

  IF v_dupes > 0 THEN
    PERFORM public.emergency_repair_auto_invest_allocation_duplicates();
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_auto_invest_allocation_active
  ON public.auto_invest_allocations (engine_id, asset_symbol)
  WHERE is_active = true;