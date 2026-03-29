
-- Add unique constraint for upsert support
ALTER TABLE public.portfolio_holdings 
  ALTER COLUMN account_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_holdings_user_symbol_idx 
  ON public.portfolio_holdings (user_id, symbol);

-- Recreate function with correct conflict target
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
BEGIN
  INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
  VALUES (p_user_id, p_symbol, p_symbol, p_amount, 0, 0, 0)
  ON CONFLICT (user_id, symbol) 
  DO UPDATE SET 
    quantity = portfolio_holdings.quantity + EXCLUDED.quantity,
    updated_at = now();
END;
$$;
