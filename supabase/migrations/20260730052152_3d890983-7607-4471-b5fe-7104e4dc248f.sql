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
)
UPDATE public.auto_invest_allocations a
SET quantity = r.total_quantity,
    value_usd = r.total_value_usd,
    pnl_usd = r.total_pnl_usd,
    updated_at = now()
FROM rollup r
WHERE a.id = r.keeper_id
  AND r.active_count > 1;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY engine_id, asset_symbol
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS rn
  FROM public.auto_invest_allocations
  WHERE is_active = TRUE
)
UPDATE public.auto_invest_allocations a
SET is_active = FALSE,
    updated_at = now()
FROM ranked r
WHERE a.id = r.id
  AND r.rn > 1;

CREATE OR REPLACE FUNCTION public.consolidate_auto_invest_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  IF NEW.is_active IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing_id
  FROM public.auto_invest_allocations
  WHERE engine_id = NEW.engine_id
    AND asset_symbol = NEW.asset_symbol
    AND is_active = TRUE
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.auto_invest_allocations
  SET quantity = quantity + COALESCE(NEW.quantity, 0),
      value_usd = value_usd + COALESCE(NEW.value_usd, 0),
      pnl_usd = pnl_usd + COALESCE(NEW.pnl_usd, 0),
      target_percent = COALESCE(NEW.target_percent, target_percent),
      current_price = COALESCE(NEW.current_price, current_price),
      ai_score = COALESCE(NEW.ai_score, ai_score),
      ai_signal = COALESCE(NEW.ai_signal, ai_signal),
      ai_reasoning = COALESCE(NEW.ai_reasoning, ai_reasoning),
      updated_at = now()
  WHERE id = v_existing_id;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consolidate_auto_invest_allocation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consolidate_auto_invest_allocation() TO service_role;

DROP TRIGGER IF EXISTS trg_consolidate_auto_invest_allocation ON public.auto_invest_allocations;
CREATE TRIGGER trg_consolidate_auto_invest_allocation
BEFORE INSERT ON public.auto_invest_allocations
FOR EACH ROW
EXECUTE FUNCTION public.consolidate_auto_invest_allocation();

CREATE UNIQUE INDEX IF NOT EXISTS uniq_auto_invest_allocation_active
ON public.auto_invest_allocations (engine_id, asset_symbol)
WHERE is_active = TRUE;

ALTER TABLE public.compound_snapshots
  ADD COLUMN IF NOT EXISTS total_capital numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roi_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strategy_attribution jsonb DEFAULT '{}'::jsonb;