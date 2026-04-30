-- Revoke EXECUTE from PUBLIC/anon/authenticated on all SECURITY DEFINER functions in the private schema.
-- These functions are only meant to be invoked by SECURITY INVOKER wrappers in the public schema
-- (which run as the calling user but can call into private via the function owner's privileges).

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.owns_auto_invest_engine(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.rent_strategy(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.request_withdrawal(uuid, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Also revoke USAGE on the private schema from anon/authenticated to prevent any future leakage.
REVOKE USAGE ON SCHEMA private FROM PUBLIC, anon, authenticated;