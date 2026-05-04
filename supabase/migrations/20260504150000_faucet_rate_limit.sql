-- ============================================================================
-- Faucet rate limiting: one claim per user per token per 24 hours
-- Also records the claim in faucet_claims for audit + cooldown tracking.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.credit_faucet_claim(
  p_user_id uuid,
  p_symbol  text,
  p_amount  numeric,
  p_chain   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_price      numeric := 0;
  v_value_usd  numeric := 0;
  v_last_claim timestamptz;
BEGIN
  -- Caller must be the user themselves (or service_role bypasses auth.uid() check)
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> p_user_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to credit another user';
  END IF;

  -- Rate limit: one claim per (user, symbol) per 24 hours
  SELECT MAX(created_at) INTO v_last_claim
  FROM public.faucet_claims
  WHERE user_id = p_user_id
    AND chain = p_chain
    AND status != 'cancelled';

  IF v_last_claim IS NOT NULL AND v_last_claim > now() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Faucet cooldown active. Next claim available at %',
      (v_last_claim + INTERVAL '24 hours')::text;
  END IF;

  -- Resolve USD price from token price feeds (best-effort)
  SELECT COALESCE(tpf.price, 0) INTO v_price
  FROM public.platform_tokens pt
  JOIN public.token_price_feeds tpf ON tpf.token_id = pt.id AND tpf.base_currency = 'USD'
  WHERE pt.symbol = p_symbol
  LIMIT 1;

  v_value_usd := p_amount * v_price;

  -- Upsert portfolio holding
  INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
  VALUES (p_user_id, p_symbol, p_symbol, p_amount, v_value_usd, 0, 0)
  ON CONFLICT (user_id, symbol) DO UPDATE SET
    quantity    = portfolio_holdings.quantity + EXCLUDED.quantity,
    value_usd   = (portfolio_holdings.quantity + EXCLUDED.quantity) * v_price,
    updated_at  = now();

  -- Record claim for cooldown tracking + audit
  INSERT INTO public.faucet_claims
    (user_id, wallet_address, amount, chain, status)
  VALUES
    (p_user_id, p_user_id::text, p_amount, p_chain, 'completed');
END;
$$;

-- Only service_role may call this (edge function uses service key)
REVOKE ALL ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) TO service_role;
