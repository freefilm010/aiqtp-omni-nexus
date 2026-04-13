
-- 1. Market alerts: fix production SELECT policy (remove null user_id exposure)
DROP POLICY IF EXISTS "Users read own alerts" ON public.market_alerts;
CREATE POLICY "Users read own alerts"
ON public.market_alerts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own alerts" ON public.market_alerts;
CREATE POLICY "Users insert own alerts"
ON public.market_alerts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own alerts" ON public.market_alerts;
CREATE POLICY "Users update own alerts"
ON public.market_alerts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 2. Leaderboard: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Public can view leaderboard" ON public.leaderboard_entries;
CREATE POLICY "Authenticated can view leaderboard"
ON public.leaderboard_entries FOR SELECT TO authenticated
USING (true);
