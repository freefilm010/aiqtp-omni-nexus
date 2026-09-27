DROP FUNCTION IF EXISTS public.record_profit_fee(uuid, uuid, numeric, text, text);

ALTER TABLE public.platform_fee_events
  ADD COLUMN IF NOT EXISTS cost_basis_usd numeric,
  ADD COLUMN IF NOT EXISTS gain_pct numeric,
  ADD COLUMN IF NOT EXISTS reinvest_status text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS reinvest_targets jsonb,
  ADD COLUMN IF NOT EXISTS reinvested_at timestamptz;

-- Performance royalty schedule on each realized gain (% of cost basis):
-- 0.01–10% -> 5%, 10.01–100% -> 3%, 100.01–1000% -> 1%, >1000% -> 0.10%
CREATE OR REPLACE FUNCTION public.performance_royalty_rate(p_gain_pct numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_gain_pct IS NULL OR p_gain_pct <= 0 THEN 0
    WHEN p_gain_pct <= 10   THEN 0.05
    WHEN p_gain_pct <= 100  THEN 0.03
    WHEN p_gain_pct <= 1000 THEN 0.01
    ELSE 0.001
  END
$$;

CREATE OR REPLACE FUNCTION public.record_profit_fee(
  p_user_id uuid, p_rental_id uuid, p_gross_profit_usd numeric,
  p_cost_basis_usd numeric, p_trade_ref text DEFAULT NULL, p_symbol text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_strategy uuid; v_creator uuid;
  v_gain_pct numeric; v_rate numeric; v_fee numeric;
  v_creator_share numeric; v_platform_share numeric;
  v_balance numeric; v_event_id uuid;
BEGIN
  IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Not authorized to record fee for another user';
  END IF;
  IF p_gross_profit_usd IS NULL OR p_gross_profit_usd <= 0 THEN
    RAISE EXCEPTION 'Profit must be positive';
  END IF;
  IF p_cost_basis_usd IS NULL OR p_cost_basis_usd <= 0 THEN
    RAISE EXCEPTION 'Cost basis required to determine royalty tier';
  END IF;

  v_gain_pct := ROUND(p_gross_profit_usd / p_cost_basis_usd * 100, 4);

  IF p_rental_id IS NOT NULL THEN
    SELECT strategy_id, creator_user_id INTO v_strategy, v_creator
    FROM public.strategy_rentals WHERE id = p_rental_id;
  END IF;

  IF public.has_role(p_user_id, 'admin') THEN
    INSERT INTO public.platform_fee_events
      (user_id, rental_id, strategy_id, trade_ref, symbol, gross_profit_usd, cost_basis_usd, gain_pct,
       fee_rate, platform_fee_usd, creator_share_usd, platform_share_usd, status, reinvest_status)
    VALUES (p_user_id, p_rental_id, v_strategy, p_trade_ref, p_symbol, p_gross_profit_usd, p_cost_basis_usd, v_gain_pct,
            0, 0, 0, 0, 'admin_exempt', 'not_applicable')
    ON CONFLICT (user_id, trade_ref) WHERE trade_ref IS NOT NULL DO NOTHING
    RETURNING id INTO v_event_id;
    RETURN v_event_id;
  END IF;

  v_rate := public.performance_royalty_rate(v_gain_pct);
  v_fee := ROUND(p_gross_profit_usd * v_rate, 2);
  v_creator_share := CASE WHEN v_creator IS NOT NULL AND v_creator <> p_user_id THEN ROUND(v_fee * 0.25, 2) ELSE 0 END;
  v_platform_share := v_fee - v_creator_share;

  SELECT quantity INTO v_balance FROM public.portfolio_holdings
  WHERE user_id = p_user_id AND symbol = 'USD' FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_fee THEN
    RAISE EXCEPTION 'Insufficient USD balance for royalty % (balance %)', v_fee, COALESCE(v_balance,0);
  END IF;

  UPDATE public.portfolio_holdings
  SET quantity = quantity - v_fee, value_usd = quantity - v_fee, updated_at = now()
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
    (user_id, rental_id, strategy_id, trade_ref, symbol, gross_profit_usd, cost_basis_usd, gain_pct,
     fee_rate, platform_fee_usd, creator_share_usd, platform_share_usd, status, reinvest_status)
  VALUES (p_user_id, p_rental_id, v_strategy, p_trade_ref, p_symbol, p_gross_profit_usd, p_cost_basis_usd, v_gain_pct,
          v_rate, v_fee, v_creator_share, v_platform_share, 'collected',
          CASE WHEN v_platform_share > 0 THEN 'queued' ELSE 'not_applicable' END)
  ON CONFLICT (user_id, trade_ref) WHERE trade_ref IS NOT NULL DO NOTHING
  RETURNING id INTO v_event_id;
  RETURN v_event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, numeric, text, text) TO service_role;

-- Treasury: settled royalties queue, then split equally into the top 3 graduated strategies.
CREATE OR REPLACE FUNCTION public.reinvest_treasury_royalties()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin uuid; v_total numeric; v_targets jsonb; v_count int; v_each numeric; r record;
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF v_admin IS NULL THEN RETURN 0; END IF;

  SELECT COALESCE(SUM(platform_share_usd),0) INTO v_total FROM public.platform_fee_events
  WHERE status = 'collected' AND reinvest_status = 'queued' AND created_at < now() - interval '1 hour';
  IF v_total <= 0 THEN RETURN 0; END IF;

  SELECT jsonb_agg(jsonb_build_object('strategy_id', id, 'name', name)), count(*) INTO v_targets, v_count
  FROM (SELECT id, name FROM public.ai_strategies
        WHERE is_graduated = true
        ORDER BY COALESCE(profitability_score,0) DESC, COALESCE(consistency_score,0) DESC LIMIT 3) t;
  IF COALESCE(v_count,0) = 0 THEN RETURN 0; END IF; -- stays queued until a strategy graduates

  v_each := ROUND(v_total / v_count, 2);
  FOR r IN SELECT (e->>'strategy_id')::uuid AS sid FROM jsonb_array_elements(v_targets) e LOOP
    INSERT INTO public.strategy_capital_deployments (user_id, strategy_id, allocated_usd, reinvest_percent, mode, funding_source, status, notes)
    VALUES (v_admin, r.sid, v_each, 100, 'live', 'treasury_royalties', 'pending_execution_credentials',
            'Auto-reinvested performance royalties');
  END LOOP;

  UPDATE public.platform_fee_events SET reinvest_status = 'reinvested', reinvest_targets = v_targets, reinvested_at = now()
  WHERE status = 'collected' AND reinvest_status = 'queued' AND created_at < now() - interval '1 hour';
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.reinvest_treasury_royalties() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reinvest_treasury_royalties() TO service_role;