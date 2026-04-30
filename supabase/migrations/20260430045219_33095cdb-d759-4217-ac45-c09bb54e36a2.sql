CREATE OR REPLACE FUNCTION public.record_profit_fee(p_user_id uuid, p_rental_id uuid, p_gross_profit_usd numeric, p_trade_ref text DEFAULT NULL::text, p_symbol text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_strategy uuid;
  v_creator uuid;
  v_rate numeric;
  v_fee numeric;
  v_creator_share numeric;
  v_platform_share numeric;
  v_balance numeric;
  v_event_id uuid;
BEGIN
  -- Authorize: only the user themselves, admins, or service role may record a fee
  IF v_caller IS NOT NULL
     AND v_caller <> p_user_id
     AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Not authorized to record fee for another user';
  END IF;

  IF p_gross_profit_usd IS NULL OR p_gross_profit_usd <= 0 THEN
    RAISE EXCEPTION 'Profit must be positive';
  END IF;

  -- Resolve strategy + creator from rental
  IF p_rental_id IS NOT NULL THEN
    SELECT strategy_id, creator_user_id
      INTO v_strategy, v_creator
    FROM public.strategy_rentals
    WHERE id = p_rental_id;
  END IF;

  -- ADMIN EXEMPTION: admins pay zero fees on profits
  IF public.has_role(p_user_id, 'admin') THEN
    INSERT INTO public.platform_fee_events
      (user_id, rental_id, strategy_id, trade_ref, symbol,
       gross_profit_usd, fee_rate, platform_fee_usd,
       creator_share_usd, platform_share_usd, status)
    VALUES (p_user_id, p_rental_id, v_strategy, p_trade_ref, p_symbol,
            p_gross_profit_usd, 0, 0, 0, 0, 'admin_exempt')
    ON CONFLICT (user_id, trade_ref) WHERE trade_ref IS NOT NULL DO NOTHING
    RETURNING id INTO v_event_id;
    RETURN v_event_id;
  END IF;

  -- Tier rate
  v_rate := CASE
    WHEN p_gross_profit_usd < 10000     THEN 0.09
    WHEN p_gross_profit_usd < 100000    THEN 0.06
    WHEN p_gross_profit_usd < 1000000   THEN 0.03
    ELSE 0.01
  END;

  v_fee := ROUND(p_gross_profit_usd * v_rate, 2);

  IF v_creator IS NOT NULL AND v_creator <> p_user_id THEN
    v_creator_share := ROUND(v_fee * 0.25, 2);
  ELSE
    v_creator_share := 0;
  END IF;
  v_platform_share := v_fee - v_creator_share;

  SELECT quantity INTO v_balance
  FROM public.portfolio_holdings
  WHERE user_id = p_user_id AND symbol = 'USD'
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_fee THEN
    INSERT INTO public.platform_fee_events
      (user_id, rental_id, strategy_id, trade_ref, symbol,
       gross_profit_usd, fee_rate, platform_fee_usd,
       creator_share_usd, platform_share_usd, status)
    VALUES (p_user_id, p_rental_id, v_strategy, p_trade_ref, p_symbol,
            p_gross_profit_usd, v_rate, v_fee,
            v_creator_share, v_platform_share, 'failed')
    RETURNING id INTO v_event_id;
    RAISE EXCEPTION 'Insufficient USD balance for fee % (balance %)', v_fee, COALESCE(v_balance,0);
  END IF;

  UPDATE public.portfolio_holdings
  SET quantity = quantity - v_fee,
      value_usd = quantity - v_fee,
      updated_at = now()
  WHERE user_id = p_user_id AND symbol = 'USD';

  IF v_creator_share > 0 THEN
    INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
    VALUES (v_creator, 'USD', 'US Dollar Cash', v_creator_share, v_creator_share, 0, 0)
    ON CONFLICT (user_id, symbol) DO UPDATE SET
      quantity = public.portfolio_holdings.quantity + EXCLUDED.quantity,
      value_usd = COALESCE(public.portfolio_holdings.value_usd, 0) + EXCLUDED.value_usd,
      updated_at = now();
  END IF;

  INSERT INTO public.platform_fee_events
    (user_id, rental_id, strategy_id, trade_ref, symbol,
     gross_profit_usd, fee_rate, platform_fee_usd,
     creator_share_usd, platform_share_usd, status)
  VALUES (p_user_id, p_rental_id, v_strategy, p_trade_ref, p_symbol,
          p_gross_profit_usd, v_rate, v_fee,
          v_creator_share, v_platform_share, 'collected')
  ON CONFLICT (user_id, trade_ref) WHERE trade_ref IS NOT NULL DO NOTHING
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$function$;