-- Bridge: auto_invest reinvest buys -> portfolio_holdings
CREATE OR REPLACE FUNCTION public.bridge_reinvest_to_holdings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_value_usd NUMERIC;
BEGIN
  -- Only bridge completed reinvest buys with a real asset+quantity
  IF NEW.transaction_type <> 'reinvest' OR NEW.status <> 'completed'
     OR NEW.side <> 'buy' OR NEW.quantity IS NULL OR NEW.quantity <= 0
     OR NEW.asset_symbol IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.auto_invest_engine
  WHERE id = NEW.engine_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_value_usd := COALESCE(NEW.amount_usd, NEW.quantity * COALESCE(NEW.price, 0));

  INSERT INTO public.portfolio_holdings
    (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
  VALUES
    (v_user_id, NEW.asset_symbol, NEW.asset_symbol, NEW.quantity, v_value_usd, 0, 0)
  ON CONFLICT (user_id, symbol) DO UPDATE SET
    quantity = portfolio_holdings.quantity + EXCLUDED.quantity,
    value_usd = portfolio_holdings.value_usd + EXCLUDED.value_usd,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bridge_reinvest_to_holdings ON public.auto_invest_transactions;
CREATE TRIGGER trg_bridge_reinvest_to_holdings
AFTER INSERT OR UPDATE OF status ON public.auto_invest_transactions
FOR EACH ROW
EXECUTE FUNCTION public.bridge_reinvest_to_holdings();

-- Audit view: per-asset reinvest totals vs current holdings
CREATE OR REPLACE VIEW public.reinvest_vs_holdings_audit
WITH (security_invoker = on) AS
SELECT
  e.user_id,
  t.asset_symbol AS symbol,
  SUM(t.quantity)        AS reinvested_qty,
  SUM(t.amount_usd)      AS reinvested_usd,
  COUNT(*)               AS reinvest_count,
  h.quantity             AS holdings_qty,
  h.value_usd            AS holdings_value_usd,
  (h.quantity - SUM(t.quantity)) AS qty_drift
FROM public.auto_invest_transactions t
JOIN public.auto_invest_engine e ON e.id = t.engine_id
LEFT JOIN public.portfolio_holdings h
  ON h.user_id = e.user_id AND h.symbol = t.asset_symbol
WHERE t.transaction_type = 'reinvest'
  AND t.status = 'completed'
  AND t.side = 'buy'
GROUP BY e.user_id, t.asset_symbol, h.quantity, h.value_usd;