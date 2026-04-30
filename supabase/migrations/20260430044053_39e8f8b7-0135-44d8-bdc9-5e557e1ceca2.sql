-- =========================================================================
-- 1. PLATFORM FEE EVENTS (per realized-trade fee ledger)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.platform_fee_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rental_id uuid REFERENCES public.strategy_rentals(id) ON DELETE SET NULL,
  strategy_id uuid REFERENCES public.ai_strategies(id) ON DELETE SET NULL,
  trade_ref text,
  symbol text,
  gross_profit_usd numeric(20,2) NOT NULL CHECK (gross_profit_usd > 0),
  fee_rate numeric(6,4) NOT NULL,
  platform_fee_usd numeric(20,2) NOT NULL,
  creator_share_usd numeric(20,2) NOT NULL DEFAULT 0,
  platform_share_usd numeric(20,2) NOT NULL,
  status text NOT NULL DEFAULT 'collected'
    CHECK (status IN ('collected','reversed','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_events_user ON public.platform_fee_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_events_rental ON public.platform_fee_events(rental_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_fee_event_trade
  ON public.platform_fee_events(user_id, trade_ref) WHERE trade_ref IS NOT NULL;

ALTER TABLE public.platform_fee_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own fee events"
  ON public.platform_fee_events FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all fee events"
  ON public.platform_fee_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages fee events"
  ON public.platform_fee_events FOR ALL
  USING (auth.role() = 'service_role');

-- =========================================================================
-- 2. WITHDRAWAL REQUESTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd numeric(20,2) NOT NULL CHECK (amount_usd >= 20),
  destination_type text NOT NULL CHECK (destination_type IN ('bank_ach','crypto','paypal','stripe_payout','other')),
  destination_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','processing','completed','rejected','cancelled')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawal_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own withdrawals"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users create own withdrawals"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own pending withdrawals"
  ON public.withdrawal_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','cancelled'));
CREATE POLICY "Admins manage all withdrawals"
  ON public.withdrawal_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages withdrawals"
  ON public.withdrawal_requests FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER trg_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- 3. RPC: rent_strategy  (free; profit-share only)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.rent_strategy(p_strategy_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_creator uuid;
  v_price numeric;
  v_existing uuid;
  v_rental_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT user_id, COALESCE(rental_price_monthly, 0)
    INTO v_creator, v_price
  FROM public.ai_strategies
  WHERE id = p_strategy_id;

  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'Strategy not found';
  END IF;

  -- Don't allow renting your own strategy (still allowed but a no-op)
  IF v_creator = v_user THEN
    RAISE EXCEPTION 'You cannot rent your own strategy';
  END IF;

  -- Reuse active rental if one exists (idempotent)
  SELECT id INTO v_existing
  FROM public.strategy_rentals
  WHERE strategy_id = p_strategy_id AND renter_user_id = v_user AND status = 'active'
  LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.strategy_rentals (strategy_id, renter_user_id, creator_user_id, monthly_price, status)
  VALUES (p_strategy_id, v_user, v_creator, 0, 'active')
  RETURNING id INTO v_rental_id;

  RETURN v_rental_id;
END;
$$;

-- =========================================================================
-- 4. RPC: record_profit_fee  (debit USD, split platform/creator, append ledger)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.record_profit_fee(
  p_user_id uuid,
  p_rental_id uuid,
  p_gross_profit_usd numeric,
  p_trade_ref text DEFAULT NULL,
  p_symbol text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_strategy uuid;
  v_creator uuid;
  v_rate numeric;
  v_fee numeric;
  v_creator_share numeric;
  v_platform_share numeric;
  v_balance numeric;
  v_event_id uuid;
BEGIN
  -- Authorize: only the user themselves, admins, or service role may record a fee
  IF v_caller IS NOT NULL
     AND v_caller <> p_user_id
     AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Not authorized to record fee for another user';
  END IF;

  IF p_gross_profit_usd IS NULL OR p_gross_profit_usd <= 0 THEN
    RAISE EXCEPTION 'Profit must be positive';
  END IF;

  -- Resolve strategy + creator from rental (rental_id may be null for non-rented direct trades)
  IF p_rental_id IS NOT NULL THEN
    SELECT strategy_id, creator_user_id
      INTO v_strategy, v_creator
    FROM public.strategy_rentals
    WHERE id = p_rental_id;
  END IF;

  -- Tier rate
  v_rate := CASE
    WHEN p_gross_profit_usd < 10000     THEN 0.09
    WHEN p_gross_profit_usd < 100000    THEN 0.06
    WHEN p_gross_profit_usd < 1000000   THEN 0.03
    ELSE 0.01
  END;

  v_fee := ROUND(p_gross_profit_usd * v_rate, 2);

  -- 25% of the fee goes to the strategy creator (only when creator known and != user)
  IF v_creator IS NOT NULL AND v_creator <> p_user_id THEN
    v_creator_share := ROUND(v_fee * 0.25, 2);
  ELSE
    v_creator_share := 0;
  END IF;
  v_platform_share := v_fee - v_creator_share;

  -- Lock + debit user's USD balance
  SELECT quantity INTO v_balance
  FROM public.portfolio_holdings
  WHERE user_id = p_user_id AND symbol = 'USD'
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_fee THEN
    INSERT INTO public.platform_fee_events
      (user_id, rental_id, strategy_id, trade_ref, symbol,
       gross_profit_usd, fee_rate, platform_fee_usd,
       creator_share_usd, platform_share_usd, status)
    VALUES (p_user_id, p_rental_id, v_strategy, p_trade_ref, p_symbol,
            p_gross_profit_usd, v_rate, v_fee,
            v_creator_share, v_platform_share, 'failed')
    RETURNING id INTO v_event_id;
    RAISE EXCEPTION 'Insufficient USD balance for fee % (balance %)', v_fee, COALESCE(v_balance,0);
  END IF;

  UPDATE public.portfolio_holdings
  SET quantity = quantity - v_fee,
      value_usd = quantity - v_fee,
      updated_at = now()
  WHERE user_id = p_user_id AND symbol = 'USD';

  -- Credit creator's USD wallet (if any)
  IF v_creator_share > 0 THEN
    INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
    VALUES (v_creator, 'USD', 'US Dollar Cash', v_creator_share, v_creator_share, 0, 0)
    ON CONFLICT (user_id, symbol) DO UPDATE SET
      quantity = public.portfolio_holdings.quantity + EXCLUDED.quantity,
      value_usd = COALESCE(public.portfolio_holdings.value_usd, 0) + EXCLUDED.value_usd,
      updated_at = now();
  END IF;

  INSERT INTO public.platform_fee_events
    (user_id, rental_id, strategy_id, trade_ref, symbol,
     gross_profit_usd, fee_rate, platform_fee_usd,
     creator_share_usd, platform_share_usd, status)
  VALUES (p_user_id, p_rental_id, v_strategy, p_trade_ref, p_symbol,
          p_gross_profit_usd, v_rate, v_fee,
          v_creator_share, v_platform_share, 'collected')
  ON CONFLICT (user_id, trade_ref) WHERE trade_ref IS NOT NULL DO NOTHING
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- =========================================================================
-- 5. RPC: request_withdrawal  (debits balance, queues admin review)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount_usd numeric,
  p_destination_type text,
  p_destination_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_balance numeric;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount_usd IS NULL OR p_amount_usd < 20 THEN
    RAISE EXCEPTION 'Minimum withdrawal is $20';
  END IF;

  SELECT quantity INTO v_balance
  FROM public.portfolio_holdings
  WHERE user_id = v_user AND symbol = 'USD'
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount_usd THEN
    RAISE EXCEPTION 'Insufficient USD balance (have %, need %)', COALESCE(v_balance,0), p_amount_usd;
  END IF;

  UPDATE public.portfolio_holdings
  SET quantity = quantity - p_amount_usd,
      value_usd = quantity - p_amount_usd,
      updated_at = now()
  WHERE user_id = v_user AND symbol = 'USD';

  INSERT INTO public.withdrawal_requests
    (user_id, amount_usd, destination_type, destination_details, status)
  VALUES (v_user, p_amount_usd, p_destination_type, p_destination_details, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =========================================================================
-- 6. RPC: get_user_usd_balance (cheap helper)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_user_usd_balance(p_user_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(quantity, 0)
  FROM public.portfolio_holdings
  WHERE user_id = COALESCE(p_user_id, auth.uid()) AND symbol = 'USD';
$$;