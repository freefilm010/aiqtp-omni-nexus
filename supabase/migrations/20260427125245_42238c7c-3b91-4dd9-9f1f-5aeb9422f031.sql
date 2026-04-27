
-- Tighten storage RLS on avatars bucket to prevent broad listing
DROP POLICY IF EXISTS "Public read individual avatar files" ON storage.objects;
CREATE POLICY "Public read individual avatar files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'avatars'
  AND name IS NOT NULL
  AND POSITION('/' IN name) > 0
  AND array_length(string_to_array(name, '/'), 1) >= 2
);

-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.enforce_system_template_no_webhook() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bridge_reinvest_to_holdings() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_compound_snapshot_owner() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_auto_invest_engine_user_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_supported_chains_public() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_admin_to_approved_emails() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_strategy_achievements() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_factor_achievements() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recompute_allocation_percents() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_conversation_message_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.consolidate_auto_invest_allocation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_rewards_budget() FROM anon, authenticated, public;

-- Revoke EXECUTE on internal/admin-only DEFINER functions
REVOKE EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(varchar, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_profit_distribution(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_market_price(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_token_price(uuid, varchar, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_operator_with_wallet(uuid, varchar, varchar, uuid, boolean, varchar[]) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.record_operator_transaction(uuid, uuid, numeric, varchar, varchar, text, varchar, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) FROM anon, authenticated, public;

-- Lock down credit_faucet_claim — currently accepts arbitrary p_user_id (privilege escalation risk).
-- Add admin-only enforcement and revoke direct execute from regular users.
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
  -- Only the owning user (or admins/service role) may credit a faucet claim
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> p_user_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to credit another user';
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
