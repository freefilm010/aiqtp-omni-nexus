-- Row-level rules already limit these tables (admin-only templates; own/admin leaderboard rows).
-- Without table grants, signed-in users got permission errors instead of policy-filtered results.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_templates TO authenticated;
GRANT SELECT ON public.leaderboard_entries TO authenticated;
GRANT ALL ON public.automation_templates TO service_role;
GRANT ALL ON public.leaderboard_entries TO service_role;