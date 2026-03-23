-- FIX ai_strategies_public: remove code and user_id columns
DROP VIEW IF EXISTS public.ai_strategies_public;
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

-- FIX data_aggregator_bots_public: remove user_id, total_earnings, sources
DROP VIEW IF EXISTS public.data_aggregator_bots_public;
CREATE VIEW public.data_aggregator_bots_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id, name, description, bot_type, data_category, is_active,
  total_records_collected, quality_score, reliability_score,
  created_at, updated_at
FROM public.data_aggregator_bots
WHERE is_active = true;
GRANT SELECT ON public.data_aggregator_bots_public TO anon, authenticated;