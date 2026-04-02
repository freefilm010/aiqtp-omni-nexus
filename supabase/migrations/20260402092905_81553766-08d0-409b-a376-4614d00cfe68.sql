
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
BEGIN
  v_symbol := p_symbol;
  
  -- For non-testnet tokens, look up real price from token_price_feeds
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
