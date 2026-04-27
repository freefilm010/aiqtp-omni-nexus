
-- 1. Drop the broad public SELECT policy on avatars (bucket is already public; CDN serves files directly)
DROP POLICY IF EXISTS "Public read individual avatar files" ON storage.objects;

-- 2. Lock down SECURITY DEFINER functions: revoke EXECUTE from anon and authenticated by default
-- Trigger functions (never called via RPC)
REVOKE EXECUTE ON FUNCTION public.enforce_system_template_no_webhook() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bridge_reinvest_to_holdings() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_compound_snapshot_owner() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_auto_invest_engine_user_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_admin_to_approved_emails() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_strategy_achievements() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_factor_achievements() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_conversation_message_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.consolidate_auto_invest_allocation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_rewards_budget() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_supported_chains_public() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recompute_allocation_percents() FROM anon, authenticated, public;

-- Admin/service-only RPCs (callable only via service role)
REVOKE EXECUTE ON FUNCTION public.update_market_price(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_token_price(uuid, varchar, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_operator_with_wallet(uuid, varchar, varchar, uuid, boolean, varchar[]) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.record_operator_transaction(uuid, uuid, numeric, varchar, varchar, text, varchar, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_profit_distribution(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(varchar, numeric) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) FROM anon, authenticated, public;

-- Engine helpers — internal use only
REVOKE EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) FROM anon, authenticated, public;

-- Functions intentionally callable by signed-in users (frontend RPCs) — keep authenticated EXECUTE, revoke anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_factor_code(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_strategy_code(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM anon, public;

-- Ensure authenticated retains explicit EXECUTE on the user-callable functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) TO authenticated;
