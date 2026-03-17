
-- Drop and recreate all 3 views with security_invoker = true

-- 1. quwallet_wallets_safe
DROP VIEW IF EXISTS public.quwallet_wallets_safe;
CREATE VIEW public.quwallet_wallets_safe
WITH (security_invoker = true)
AS
SELECT id, user_id, wallet_name, wallet_address, wallet_type, is_hardware, hardware_type,
       is_active, is_admin_controlled, kyber_public_key, dilithium_public_key, ecdsa_public_key,
       created_at, updated_at
FROM public.quwallet_wallets;

-- 2. ai_strategies_public
DROP VIEW IF EXISTS public.ai_strategies_public CASCADE;
CREATE VIEW public.ai_strategies_public
WITH (security_invoker = true)
AS
SELECT id, name, description, status, is_graduated, is_available_for_rent,
       rental_price_monthly, admin_approved, creator_profit_share, total_rentals,
       factors, created_at, updated_at, user_id, backtest_count, consistency_score,
       profitability_score, graduation_date, creator_earnings, code_protected
FROM public.ai_strategies;

-- 3. data_aggregator_bots_public
DROP VIEW IF EXISTS public.data_aggregator_bots_public CASCADE;
CREATE VIEW public.data_aggregator_bots_public
WITH (security_invoker = true)
AS
SELECT id, name, description, bot_type, data_category, is_active, is_graduated,
       quality_score, reliability_score, total_records_collected, total_earnings,
       creator_profit_share, admin_approved, graduation_date, code_protected,
       collection_frequency, output_format, user_id, created_at, updated_at
FROM public.data_aggregator_bots
WHERE is_graduated = true;
