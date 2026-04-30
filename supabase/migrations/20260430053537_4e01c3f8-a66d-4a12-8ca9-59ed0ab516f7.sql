
-- ---- private.rent_strategy ----------------------------------
CREATE OR REPLACE FUNCTION private.rent_strategy(p_strategy_id uuid, p_caller uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator uuid;
  v_existing uuid;
  v_rental_id uuid;
BEGIN
  IF p_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT user_id INTO v_creator
  FROM public.ai_strategies
  WHERE id = p_strategy_id;

  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'Strategy not found';
  END IF;
  IF v_creator = p_caller THEN
    RAISE EXCEPTION 'You cannot rent your own strategy';
  END IF;

  SELECT id INTO v_existing
  FROM public.strategy_rentals
  WHERE strategy_id = p_strategy_id AND renter_user_id = p_caller AND status = 'active'
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.strategy_rentals (strategy_id, renter_user_id, creator_user_id, monthly_price, status)
  VALUES (p_strategy_id, p_caller, v_creator, 0, 'active')
  RETURNING id INTO v_rental_id;

  RETURN v_rental_id;
END;
$$;
REVOKE ALL ON FUNCTION private.rent_strategy(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.rent_strategy(uuid, uuid) TO authenticated, service_role;

-- Public INVOKER wrapper -- safe to expose, can't bypass ownership.
CREATE OR REPLACE FUNCTION public.rent_strategy(p_strategy_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.rent_strategy(p_strategy_id, auth.uid());
$$;
REVOKE ALL ON FUNCTION public.rent_strategy(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rent_strategy(uuid) TO authenticated, service_role;

-- ---- private.request_withdrawal -----------------------------
CREATE OR REPLACE FUNCTION private.request_withdrawal(
  p_caller uuid,
  p_amount_usd numeric,
  p_destination_type text,
  p_destination_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_id uuid;
BEGIN
  IF p_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_amount_usd IS NULL OR p_amount_usd < 20 THEN
    RAISE EXCEPTION 'Minimum withdrawal is $20';
  END IF;

  SELECT quantity INTO v_balance
  FROM public.portfolio_holdings
  WHERE user_id = p_caller AND symbol = 'USD'
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount_usd THEN
    RAISE EXCEPTION 'Insufficient USD balance (have %, need %)', COALESCE(v_balance,0), p_amount_usd;
  END IF;

  UPDATE public.portfolio_holdings
  SET quantity = quantity - p_amount_usd,
      value_usd = quantity - p_amount_usd,
      updated_at = now()
  WHERE user_id = p_caller AND symbol = 'USD';

  INSERT INTO public.withdrawal_requests
    (user_id, amount_usd, destination_type, destination_details, status)
  VALUES (p_caller, p_amount_usd, p_destination_type, p_destination_details, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION private.request_withdrawal(uuid, numeric, text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.request_withdrawal(uuid, numeric, text, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount_usd numeric,
  p_destination_type text,
  p_destination_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.request_withdrawal(auth.uid(), p_amount_usd, p_destination_type, p_destination_details);
$$;
REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated, service_role;
