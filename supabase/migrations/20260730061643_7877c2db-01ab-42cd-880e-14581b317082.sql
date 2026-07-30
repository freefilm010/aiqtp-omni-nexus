DROP TRIGGER IF EXISTS sync_leaderboard_public_trg ON public.leaderboard_entries;
DROP FUNCTION IF EXISTS public.sync_leaderboard_public();
DROP TABLE IF EXISTS public.leaderboard_public;
DROP VIEW IF EXISTS public.leaderboard_public;

CREATE VIEW public.leaderboard_public
WITH (security_invoker = true)
AS
SELECT
  id,
  display_name,
  avatar_url,
  score,
  rank,
  category,
  badge,
  highlight_stat,
  period_type,
  period_start,
  updated_at
FROM public.leaderboard_entries;

GRANT SELECT ON public.leaderboard_public TO anon, authenticated;