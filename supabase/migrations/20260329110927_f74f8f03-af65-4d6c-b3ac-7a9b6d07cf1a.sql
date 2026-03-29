
-- Function to credit wallet + portfolio when faucet claim happens
CREATE OR REPLACE FUNCTION public.credit_faucet_claim(
  p_user_id uuid,
  p_symbol text,
  p_amount numeric,
  p_chain text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_type text;
BEGIN
  -- Determine wallet type
  v_wallet_type := CASE
    WHEN p_symbol IN ('USD','EUR','GBP') THEN 'fiat'
    ELSE 'crypto'
  END;

  -- Upsert platform_wallets (these are global platform wallets, not per-user)
  -- We'll use portfolio_holdings for per-user tracking
  
  -- Upsert portfolio_holdings for this user
  INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
  VALUES (p_user_id, p_symbol, p_symbol, p_amount, 0, 0, 0)
  ON CONFLICT (user_id, symbol) 
  DO UPDATE SET 
    quantity = portfolio_holdings.quantity + EXCLUDED.quantity,
    updated_at = now();
END;
$$;
