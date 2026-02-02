
-- Fix SECURITY DEFINER view issue - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.ai_strategies_public;

CREATE VIEW public.ai_strategies_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  name,
  description,
  status,
  factors,
  created_at,
  updated_at,
  is_graduated,
  graduation_date,
  profitability_score,
  consistency_score,
  backtest_count,
  rental_price_monthly,
  is_available_for_rent,
  total_rentals,
  creator_earnings,
  admin_approved,
  code_protected,
  creator_profit_share,
  -- Return code ONLY if user is owner or admin
  CASE 
    WHEN auth.uid() = user_id THEN code
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN code
    ELSE NULL 
  END AS code
FROM public.ai_strategies;
