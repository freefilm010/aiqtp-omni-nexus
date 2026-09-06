CREATE OR REPLACE FUNCTION public.credit_lightning_deposit(
  p_transaction_id uuid,
  p_user_id uuid,
  p_amount_usd numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service_role required';
  END IF;

  IF p_amount_usd IS NULL OR p_amount_usd <= 0 OR p_amount_usd > 100000 THEN
    RAISE EXCEPTION 'invalid Lightning deposit amount';
  END IF;

  UPDATE public.lightning_transactions
  SET status = 'completed', completed_at = now()
  WHERE id = p_transaction_id
    AND user_id = p_user_id
    AND status <> 'completed'
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.portfolio_holdings (
    user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent
  ) VALUES (
    p_user_id, 'USD', 'US Dollar Cash', p_amount_usd, p_amount_usd, 0, 0
  )
  ON CONFLICT (user_id, symbol) DO UPDATE
  SET quantity = public.portfolio_holdings.quantity + EXCLUDED.quantity,
      value_usd = public.portfolio_holdings.value_usd + EXCLUDED.value_usd;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_lightning_deposit(uuid, uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_lightning_deposit(uuid, uuid, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.credit_lightning_deposit(uuid, uuid, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_lightning_deposit(uuid, uuid, numeric) TO service_role;