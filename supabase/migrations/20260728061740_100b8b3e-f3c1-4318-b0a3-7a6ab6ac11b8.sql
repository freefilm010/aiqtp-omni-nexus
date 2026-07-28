
REVOKE ALL ON FUNCTION public.update_token_price(uuid, varchar, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_factor_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_strategy_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_security_event(text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) FROM PUBLIC, anon, authenticated;
