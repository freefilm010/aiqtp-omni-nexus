
-- 1. automation_templates
REVOKE SELECT ON public.automation_templates FROM authenticated, anon;
GRANT SELECT (id, name, description, category, subcategory, trigger_type, trigger_config, action_type, action_config, is_active, is_system, schedule, last_run_at, run_count, user_id, created_at, updated_at, webhook_url_masked)
  ON public.automation_templates TO authenticated;
GRANT ALL ON public.automation_templates TO service_role;

-- 2. copy_trading_leaders
DROP POLICY IF EXISTS "Anyone can view active copy trading leaders" ON public.copy_trading_leaders;
REVOKE SELECT ON public.copy_trading_leaders FROM anon;

-- 3. leaderboard_entries
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboard_entries;
REVOKE SELECT ON public.leaderboard_entries FROM anon;
CREATE POLICY "Authenticated users can view leaderboards"
  ON public.leaderboard_entries FOR SELECT
  TO authenticated
  USING (true);

-- 4. satellite_services
DROP POLICY IF EXISTS "Anyone can view active satellite services" ON public.satellite_services;
REVOKE SELECT ON public.satellite_services FROM anon;

-- 5. influencer_partners — hide email + contract_terms from authenticated; admins read via service_role
REVOKE SELECT ON public.influencer_partners FROM authenticated;
GRANT SELECT (id, user_id, name, platform, handle, follower_count, tier, referral_code, commission_rate, total_referrals, total_earnings, tokens_allocated, status, onboarded_at, created_at, updated_at)
  ON public.influencer_partners TO authenticated;
GRANT ALL ON public.influencer_partners TO service_role;
