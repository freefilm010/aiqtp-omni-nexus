
CREATE OR REPLACE FUNCTION public.credit_faucet_claim(p_user_id uuid, p_symbol text, p_amount numeric, p_chain text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_symbol text;
  v_price numeric := 0;
  v_value_usd numeric := 0;
  v_max numeric;
BEGIN
  -- Only the owning user (or admins/service role) may credit a faucet claim
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> p_user_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to credit another user';
  END IF;

  -- Hard per-symbol cap (defense in depth; edge function also enforces).
  v_max := CASE upper(p_symbol)
    WHEN 'QTC'   THEN 100
    WHEN 'AIQ'   THEN 50
    WHEN 'NXS'   THEN 50
    WHEN 'QAQI'  THEN 100
    WHEN 'AIQTP' THEN 100
    WHEN 'TBTC'  THEN 0.01
    WHEN 'TETH'  THEN 0.1
    WHEN 'TSOL'  THEN 1
    WHEN 'TUSDC' THEN 100
    WHEN 'TUSDT' THEN 100
    ELSE 100
  END;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  IF p_amount > v_max THEN
    RAISE EXCEPTION 'Faucet amount % exceeds per-claim limit % for %', p_amount, v_max, p_symbol;
  END IF;

  v_symbol := p_symbol;
  IF NOT (v_symbol LIKE 't%' AND length(v_symbol) > 1 AND substring(v_symbol from 2 for 1) = upper(substring(v_symbol from 2 for 1))) THEN
    SELECT COALESCE(tpf.price, 0) INTO v_price
    FROM public.platform_tokens pt
    JOIN public.token_price_feeds tpf ON tpf.token_id = pt.id AND tpf.base_currency = 'USD'
    WHERE pt.symbol = v_symbol
    LIMIT 1;
  END IF;
  v_value_usd := p_amount * v_price;
  INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
  VALUES (p_user_id, v_symbol, v_symbol, p_amount, v_value_usd, 0, 0)
  ON CONFLICT (user_id, symbol)
  DO UPDATE SET
    quantity = portfolio_holdings.quantity + EXCLUDED.quantity,
    value_usd = (portfolio_holdings.quantity + EXCLUDED.quantity) * v_price,
    updated_at = now();
END;
$function$;
