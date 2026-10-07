-- Restore authenticated EXECUTE grants on private helper functions.
-- Applied directly to the test database on 2026-10-05 but not captured
-- in the publish migration, leaving live without them (users saw
-- "permission denied" on admin-role, subscription and auto-invest checks).
-- GRANT statements are idempotent; safe to re-run.

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.owns_auto_invest_engine(uuid) TO authenticated;