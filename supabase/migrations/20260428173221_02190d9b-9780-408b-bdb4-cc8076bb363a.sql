REVOKE ALL ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_platform_deposit(uuid, text, text, numeric, text, text) TO service_role;