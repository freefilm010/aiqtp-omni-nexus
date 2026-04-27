CREATE OR REPLACE FUNCTION public.recompute_allocation_percents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engine_id uuid;
  v_total numeric;
BEGIN
  v_engine_id := COALESCE(NEW.engine_id, OLD.engine_id);

  SELECT COALESCE(SUM(value_usd), 0) INTO v_total
  FROM public.auto_invest_allocations
  WHERE engine_id = v_engine_id AND is_active = true;

  IF v_total > 0 THEN
    UPDATE public.auto_invest_allocations
    SET current_percent = ROUND((value_usd / v_total) * 100, 2)
    WHERE engine_id = v_engine_id AND is_active = true;
  END IF;

  UPDATE public.auto_invest_engine
  SET total_deployed = v_total, updated_at = now()
  WHERE id = v_engine_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_allocation_percents ON public.auto_invest_allocations;
CREATE TRIGGER trg_recompute_allocation_percents
AFTER INSERT OR UPDATE OF value_usd, is_active OR DELETE
ON public.auto_invest_allocations
FOR EACH ROW
EXECUTE FUNCTION public.recompute_allocation_percents();