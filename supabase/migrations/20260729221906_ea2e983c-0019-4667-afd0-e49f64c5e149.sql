-- Remove remaining direct browser-role execution from SECURITY DEFINER helpers.
-- These are used through backend/service-role paths or are not directly called by client code.
REVOKE ALL ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_strategy_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_factor_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO service_role;