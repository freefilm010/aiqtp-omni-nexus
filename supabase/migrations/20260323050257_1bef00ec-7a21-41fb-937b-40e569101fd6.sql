-- Harden ai_strategies_public so it cannot expose proprietary code or owner identifiers
DROP VIEW IF EXISTS public.ai_strategies_public;
CREATE VIEW public.ai_strategies_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id,
  name,
  description,
  status,
  entry_rules,
  exit_rules,
  risk_parameters,
  factors,
  consistency_score,
  profitability_score,
  total_rentals,
  rental_price_monthly,
  is_available_for_rent,
  creator_profit_share,
  graduation_date,
  backtest_count,
  created_at,
  updated_at,
  code_protected,
  admin_approved,
  is_graduated
FROM public.ai_strategies
WHERE is_graduated = true
  AND admin_approved = true
  AND code_protected = false;
GRANT SELECT ON public.ai_strategies_public TO anon, authenticated;

-- Harden data_aggregator_bots_public so public reads cannot expose owner and earnings data
DROP VIEW IF EXISTS public.data_aggregator_bots_public;
CREATE VIEW public.data_aggregator_bots_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id,
  name,
  description,
  bot_type,
  data_category,
  is_active,
  total_records_collected,
  quality_score,
  reliability_score,
  created_at,
  updated_at
FROM public.data_aggregator_bots
WHERE is_active = true;
GRANT SELECT ON public.data_aggregator_bots_public TO anon, authenticated;

-- Restrict badge visibility to the badge owner or admins
DROP POLICY IF EXISTS "Anyone can read badges" ON public.user_badges;
CREATE POLICY "Users can view own badges"
ON public.user_badges
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

-- Replace overly permissive feedback insert check with an explicit authenticated check
DROP POLICY IF EXISTS "Authenticated users can submit feedback" ON public.customer_feedback;
CREATE POLICY "Authenticated users can submit feedback"
ON public.customer_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);