-- Fix 3: Recreate ai_strategies_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.ai_strategies_public;

CREATE VIEW public.ai_strategies_public
WITH (security_invoker = on) AS
  SELECT 
    id, name, description, status, 
    entry_rules, exit_rules, risk_parameters,
    factors, consistency_score, profitability_score,
    total_rentals, rental_price_monthly, is_available_for_rent,
    creator_profit_share, graduation_date, backtest_count,
    created_at, updated_at, user_id,
    CASE WHEN code_protected THEN '// Code is protected by creator' ELSE code END as code,
    code_protected, admin_approved, is_graduated
  FROM public.ai_strategies
  WHERE is_graduated = true 
    AND admin_approved = true
    AND (code_protected = false OR user_id = auth.uid());

-- Fix 4: Recreate data_aggregator_bots_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.data_aggregator_bots_public;

CREATE VIEW public.data_aggregator_bots_public
WITH (security_invoker = on) AS
  SELECT id, name, description, bot_type, data_category, sources,
         is_active, total_records_collected, quality_score, reliability_score,
         total_earnings, created_at, updated_at, user_id
  FROM public.data_aggregator_bots
  WHERE is_active = true;

-- Fix 5: Tighten contest_entries visibility
DROP POLICY IF EXISTS "Users see contest entries" ON public.contest_entries;
CREATE POLICY "Users see own contest entries"
  ON public.contest_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));