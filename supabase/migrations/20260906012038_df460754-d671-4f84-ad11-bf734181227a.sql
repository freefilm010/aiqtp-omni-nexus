REVOKE ALL ON FUNCTION public.get_factor_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_factor_code(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_factor_code(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_strategy_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_strategy_code(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_strategy_code(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO service_role;