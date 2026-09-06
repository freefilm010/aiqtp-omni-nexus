-- Replace the strict unique partial index (which cannot be built on live data that
-- already contains duplicate active allocations) with a forward-looking trigger guard.

DROP INDEX IF EXISTS public.uniq_auto_invest_allocation_active;

CREATE INDEX IF NOT EXISTS idx_aia_engine_symbol_active
  ON public.auto_invest_allocations (engine_id, asset_symbol)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.guard_auto_invest_allocation_active_dupe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE
     AND OLD.engine_id = NEW.engine_id
     AND OLD.asset_symbol = NEW.asset_symbol THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.auto_invest_allocations a
    WHERE a.engine_id = NEW.engine_id
      AND a.asset_symbol = NEW.asset_symbol
      AND a.is_active = true
      AND a.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'Duplicate active allocation for engine % asset %', NEW.engine_id, NEW.asset_symbol
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_auto_invest_allocation_active_dupe() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_auto_invest_allocation_active_dupe ON public.auto_invest_allocations;
CREATE TRIGGER trg_guard_auto_invest_allocation_active_dupe
BEFORE INSERT OR UPDATE OF is_active, engine_id, asset_symbol ON public.auto_invest_allocations
FOR EACH ROW
EXECUTE FUNCTION public.guard_auto_invest_allocation_active_dupe();