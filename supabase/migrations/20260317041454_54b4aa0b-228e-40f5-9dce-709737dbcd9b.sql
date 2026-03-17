
-- quwallet_wallets_safe is a view - drop the code column from ai_strategies_public view to prevent future exposure
DROP VIEW IF EXISTS public.ai_strategies_public;
CREATE VIEW public.ai_strategies_public WITH (security_invoker = true) AS
SELECT id, name, description, status, is_graduated, is_available_for_rent, rental_price_monthly,
       admin_approved, creator_profit_share, total_rentals, factors, created_at, updated_at, user_id,
       backtest_count, consistency_score, profitability_score, graduation_date, creator_earnings, code_protected
FROM public.ai_strategies;
