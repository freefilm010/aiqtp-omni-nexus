-- Restrict leaderboard_entries: drop anonymous SELECT access.
-- Public consumers should read the sanitized `leaderboard_public` view instead.

DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboard_entries;

-- Authenticated users keep read access (display_name + avatar_url) via the existing
-- "Authenticated can view leaderboard" policy. Admins keep manage rights.
-- No further changes required.