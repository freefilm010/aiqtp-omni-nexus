CREATE OR REPLACE FUNCTION public.increment_wallet_balance(p_currency VARCHAR, p_amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.platform_wallets
  SET balance = balance + p_amount,
      available_balance = available_balance + p_amount,
      updated_at = now()
  WHERE currency = p_currency
    AND wallet_type = CASE 
      WHEN p_currency IN ('USD','EUR','GBP') THEN 'fiat' 
      ELSE 'crypto' 
    END;
END;
$$;