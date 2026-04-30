-- Tighten function execute privileges
REVOKE ALL ON FUNCTION public.rent_strategy(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rent_strategy(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, text, text) TO service_role;