
-- Recreate view with SECURITY INVOKER (default, safe)
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
