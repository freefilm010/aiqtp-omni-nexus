-- Fix targeted Supabase linter findings:
-- - SUPA_anon_security_definer_function_executable
-- - SUPA_authenticated_security_definer_function_executable
-- - SUPA_public_bucket_allows_listing

-- SECURITY DEFINER functions must not be directly executable by anon/authenticated clients.
REVOKE EXECUTE ON FUNCTION public.get_factor_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_strategy_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_token_price(uuid, character varying, numeric) FROM PUBLIC, anon, authenticated;

-- Keep internal backend callers working for privileged routines.
GRANT EXECUTE ON FUNCTION public.increment_engine_totals(uuid, numeric, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_profit_fee(uuid, uuid, numeric, text, text) TO service_role;

-- The admin UI calls update_token_price. It already checks admin role and the
-- underlying tables have admin-scoped RLS, so it can run safely as invoker.
ALTER FUNCTION public.update_token_price(uuid, character varying, numeric) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.update_token_price(uuid, character varying, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_token_price(uuid, character varying, numeric) TO service_role;

-- Defense-in-depth: ensure the public avatars bucket cannot be listed through
-- broad storage.objects SELECT policies. Direct public object URLs still work.
DROP POLICY IF EXISTS "Owners can list own avatar folder" ON storage.objects;
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;