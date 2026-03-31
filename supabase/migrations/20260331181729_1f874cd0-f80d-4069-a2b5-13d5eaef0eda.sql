CREATE OR REPLACE FUNCTION public.credit_faucet_claim(p_user_id uuid, p_symbol text, p_amount numeric, p_chain text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_symbol text;
BEGIN
  -- Use the symbol as-is (caller now passes tETH, tBTC etc for testnet)
  v_symbol := p_symbol;
  
  INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
  VALUES (p_user_id, v_symbol, v_symbol, p_amount, 0, 0, 0)
  ON CONFLICT (user_id, symbol) 
  DO UPDATE SET 
    quantity = portfolio_holdings.quantity + EXCLUDED.quantity,
    updated_at = now();
END;
$function$;