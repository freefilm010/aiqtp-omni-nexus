
DROP VIEW IF EXISTS public.ai_strategies_public;
CREATE VIEW public.ai_strategies_public WITH (security_invoker = on) AS
SELECT id, name, description, status, user_id,
       is_graduated, is_available_for_rent, rental_price_monthly,
       total_rentals, creator_profit_share, creator_earnings,
       profitability_score, consistency_score, admin_approved,
       graduation_date, factors, entry_rules, exit_rules,
       risk_parameters, backtest_count, created_at, updated_at
FROM public.ai_strategies;

DROP VIEW IF EXISTS public.quwallet_wallets_safe;
CREATE VIEW public.quwallet_wallets_safe WITH (security_invoker = on) AS
SELECT id, user_id, wallet_address, kyber_public_key,
       dilithium_public_key, ecdsa_public_key, created_at, updated_at
FROM public.quwallet_wallets;

DROP VIEW IF EXISTS public.data_aggregator_bots_public;
CREATE VIEW public.data_aggregator_bots_public WITH (security_invoker = on) AS
SELECT id, name, description, bot_type, data_category, user_id,
       is_active, is_graduated, admin_approved, quality_score,
       reliability_score, total_earnings, total_data_sold,
       total_records_collected, creator_profit_share, graduation_date,
       collection_frequency, output_format, sources, aggregation_rules,
       last_collection_at, created_at, updated_at
FROM public.data_aggregator_bots;
