DROP POLICY IF EXISTS "Authenticated users can view leaderboards" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Users can view their own leaderboard entries" ON public.leaderboard_entries;
CREATE POLICY "Users can view their own leaderboard entries"
ON public.leaderboard_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);