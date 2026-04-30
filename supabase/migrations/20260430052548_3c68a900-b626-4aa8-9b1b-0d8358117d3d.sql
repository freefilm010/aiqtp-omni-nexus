-- Revoke broad EXECUTE on privileged SECURITY DEFINER functions, then grant
-- only to the appropriate roles. Functions that legitimately need to be
-- callable from authenticated client sessions keep `authenticated` access.
-- Service-only functions are restricted to `service_role` (admin / edge use).

-- User-facing (authenticated) functions
REVOKE EXECUTE ON FUNCTION public.rent_strategy(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rent_strategy(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_strategy_code(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_factor_code(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_factor_code(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) TO authenticated;

-- Service-role-only (called from edge functions / platform)
REVOKE EXECUTE ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_token_price(uuid, varchar, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_token_price(uuid, varchar, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_market_price(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_market_price(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(varchar, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_wallet_balance(varchar, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION public.process_profit_distribution(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.process_profit_distribution(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_operator_with_wallet(uuid, varchar, varchar, uuid, boolean, varchar[]) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.create_operator_with_wallet(uuid, varchar, varchar, uuid, boolean, varchar[]) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_operator_transaction(uuid, uuid, numeric, varchar, varchar, text, varchar, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.record_operator_transaction(uuid, uuid, numeric, varchar, varchar, text, varchar, uuid) TO service_role;