CREATE OR REPLACE FUNCTION public.increment_engine_totals(
  p_engine_id uuid,
  p_capital_delta numeric,
  p_deployed_delta numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.auto_invest_engine
  SET total_capital = total_capital + p_capital_delta,
      total_deployed = total_deployed + p_deployed_delta,
      cycle_count = cycle_count + 1,
      updated_at = now()
  WHERE id = p_engine_id
    AND user_id = auth.uid();
END;
$$;