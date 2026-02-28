
-- =============================================
-- SECURITY HARDENING MIGRATION
-- =============================================

-- 1. Clean up duplicate faucet_claims SELECT policies
DROP POLICY IF EXISTS "Admins can view all faucet claims" ON public.faucet_claims;
DROP POLICY IF EXISTS "Users can view their claims" ON public.faucet_claims;
DROP POLICY IF EXISTS "Users can create claims" ON public.faucet_claims;
DROP POLICY IF EXISTS "Users can create own faucet claims" ON public.faucet_claims;

-- 2. Clean up duplicate faucet_claims INSERT policies (keep one)
DROP POLICY IF EXISTS "Users can insert own faucet_claims" ON public.faucet_claims;

-- 3. Harden create_operator_with_wallet - require admin
CREATE OR REPLACE FUNCTION public.create_operator_with_wallet(
  p_territory_id uuid,
  p_operator_type character varying,
  p_name character varying,
  p_owner_user_id uuid DEFAULT NULL::uuid,
  p_is_admin_owned boolean DEFAULT false,
  p_currencies character varying[] DEFAULT ARRAY['QTC'::text, 'USD'::text]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_operator_id UUID;
  v_currency VARCHAR;
BEGIN
  -- Require admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required to create operators';
  END IF;

  INSERT INTO public.operators (territory_id, operator_type, name, owner_user_id, is_admin_owned)
  VALUES (p_territory_id, p_operator_type, p_name, p_owner_user_id, p_is_admin_owned)
  RETURNING id INTO v_operator_id;
  
  FOREACH v_currency IN ARRAY p_currencies LOOP
    INSERT INTO public.operator_wallets (operator_id, currency)
    VALUES (v_operator_id, v_currency);
  END LOOP;
  
  UPDATE public.operator_territories 
  SET active_operators = active_operators + 1
  WHERE id = p_territory_id;
  
  RETURN v_operator_id;
END;
$$;

-- 4. Harden record_operator_transaction - require admin
CREATE OR REPLACE FUNCTION public.record_operator_transaction(
  p_from_operator_id uuid,
  p_to_operator_id uuid,
  p_amount numeric,
  p_currency character varying,
  p_transaction_type character varying,
  p_description text DEFAULT NULL::text,
  p_reference_type character varying DEFAULT NULL::character varying,
  p_reference_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_from_wallet_id UUID;
  v_to_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Require admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required for operator transactions';
  END IF;

  IF p_from_operator_id IS NOT NULL THEN
    SELECT id INTO v_from_wallet_id FROM public.operator_wallets 
    WHERE operator_id = p_from_operator_id AND currency = p_currency;
    
    UPDATE public.operator_wallets 
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        total_withdrawn = total_withdrawn + p_amount,
        last_transaction_at = now()
    WHERE id = v_from_wallet_id;
  END IF;
  
  IF p_to_operator_id IS NOT NULL THEN
    SELECT id INTO v_to_wallet_id FROM public.operator_wallets 
    WHERE operator_id = p_to_operator_id AND currency = p_currency;
    
    UPDATE public.operator_wallets 
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount,
        total_deposited = total_deposited + p_amount,
        last_transaction_at = now()
    WHERE id = v_to_wallet_id;
    
    IF p_transaction_type IN ('fee', 'platform_fee', 'rental_income') THEN
      UPDATE public.operator_wallets 
      SET total_fees_collected = total_fees_collected + p_amount
      WHERE id = v_to_wallet_id;
    END IF;
  END IF;
  
  INSERT INTO public.operator_transactions (
    from_operator_id, to_operator_id, from_wallet_id, to_wallet_id,
    amount, currency, transaction_type, description, reference_type, reference_id
  ) VALUES (
    p_from_operator_id, p_to_operator_id, v_from_wallet_id, v_to_wallet_id,
    p_amount, p_currency, p_transaction_type, p_description, p_reference_type, p_reference_id
  )
  RETURNING id INTO v_transaction_id;
  
  IF p_to_operator_id IS NOT NULL THEN
    UPDATE public.operator_territories t
    SET total_revenue = total_revenue + p_amount
    FROM public.operators o
    WHERE o.id = p_to_operator_id AND t.id = o.territory_id;
  END IF;
  
  RETURN v_transaction_id;
END;
$$;

-- 5. Harden update_token_price - require admin
CREATE OR REPLACE FUNCTION public.update_token_price(
  p_token_id uuid,
  p_base_currency character varying,
  p_new_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_price DECIMAL;
BEGIN
  -- Require admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required to update token prices';
  END IF;

  SELECT price INTO v_old_price FROM public.token_price_feeds 
  WHERE token_id = p_token_id AND base_currency = p_base_currency;
  
  INSERT INTO public.token_price_feeds (token_id, base_currency, price, price_24h_ago, last_updated)
  VALUES (p_token_id, p_base_currency, p_new_price, v_old_price, now())
  ON CONFLICT (token_id, base_currency) DO UPDATE SET
    price = p_new_price,
    change_24h_percent = CASE 
      WHEN token_price_feeds.price_24h_ago > 0 
      THEN ((p_new_price - token_price_feeds.price_24h_ago) / token_price_feeds.price_24h_ago) * 100
      ELSE 0
    END,
    last_updated = now();
  
  UPDATE public.exchange_pairs ep
  SET last_price = p_new_price,
      bid_price = p_new_price * 0.999,
      ask_price = p_new_price * 1.001
  FROM public.platform_tokens pt
  WHERE ep.base_token_id = pt.id 
    AND pt.id = p_token_id 
    AND ep.quote_currency = p_base_currency;
END;
$$;
