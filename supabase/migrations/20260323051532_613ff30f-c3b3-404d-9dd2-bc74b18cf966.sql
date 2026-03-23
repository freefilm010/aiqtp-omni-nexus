-- Verify and force-replace ai_strategies_public
DROP VIEW IF EXISTS public.ai_strategies_public CASCADE;

CREATE VIEW public.ai_strategies_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id, name, description, status, entry_rules, exit_rules,
  risk_parameters, factors, consistency_score, profitability_score,
  total_rentals, rental_price_monthly, is_available_for_rent,
  creator_profit_share, graduation_date, backtest_count,
  created_at, updated_at, code_protected, admin_approved, is_graduated
FROM public.ai_strategies
WHERE is_graduated = true AND admin_approved = true;

GRANT SELECT ON public.ai_strategies_public TO anon, authenticated;

-- Force-replace badge policy
DROP POLICY IF EXISTS "Anyone can read badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Badge owners and admins can view badges"
ON public.user_badges
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));