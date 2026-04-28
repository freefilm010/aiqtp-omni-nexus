CREATE OR REPLACE FUNCTION public.credit_platform_deposit(
  p_user_id uuid,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_amount_usd numeric,
  p_currency text DEFAULT 'usd',
  p_environment text DEFAULT 'sandbox'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User is required';
  END IF;

  IF p_stripe_session_id IS NULL OR length(trim(p_stripe_session_id)) = 0 THEN
    RAISE EXCEPTION 'Checkout session is required';
  END IF;

  IF p_amount_usd IS NULL OR p_amount_usd < 20 THEN
    RAISE EXCEPTION 'Deposit must be at least 20 USD';
  END IF;

  INSERT INTO public.deposit_transactions (
    user_id,
    stripe_session_id,
    stripe_payment_intent_id,
    amount_usd,
    currency,
    status,
    environment,
    credited_at
  ) VALUES (
    p_user_id,
    p_stripe_session_id,
    p_stripe_payment_intent_id,
    p_amount_usd,
    lower(coalesce(p_currency, 'usd')),
    'credited',
    p_environment,
    now()
  )
  ON CONFLICT (stripe_session_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.portfolio_holdings (
    user_id,
    symbol,
    name,
    quantity,
    value_usd,
    change_24h,
    allocation_percent
  ) VALUES (
    p_user_id,
    'USD',
    'US Dollar Cash',
    p_amount_usd,
    p_amount_usd,
    0,
    0
  )
  ON CONFLICT (user_id, symbol) DO UPDATE SET
    quantity = public.portfolio_holdings.quantity + EXCLUDED.quantity,
    value_usd = coalesce(public.portfolio_holdings.value_usd, 0) + EXCLUDED.value_usd,
    updated_at = now();

  RETURN true;
END;
$$;