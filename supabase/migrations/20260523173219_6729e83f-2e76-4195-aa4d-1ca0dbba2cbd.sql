-- Harden raw leaderboard access and expose only sanitized public data.
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Public can view leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Authenticated can view leaderboard" ON public.leaderboard_entries;

CREATE POLICY "Authenticated can view leaderboard"
ON public.leaderboard_entries
FOR SELECT
TO authenticated
USING (true);

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

-- Harden raw copy-trading leaders and expose a public-safe view without raw user_id.
DROP POLICY IF EXISTS "Anyone can view active copy trading leaders" ON public.copy_trading_leaders;
DROP POLICY IF EXISTS "Authenticated can view active copy trading leaders" ON public.copy_trading_leaders;

CREATE POLICY "Authenticated can view active copy trading leaders"
ON public.copy_trading_leaders
FOR SELECT
TO authenticated
USING (is_active = true);

DROP VIEW IF EXISTS public.copy_trading_leaders_public;
CREATE VIEW public.copy_trading_leaders_public
WITH (security_invoker = true)
AS
SELECT
  id,
  display_name,
  avatar,
  tier,
  is_verified,
  pnl_30d,
  pnl_all_time,
  win_rate,
  max_drawdown,
  sharpe_ratio,
  copiers_count,
  aum,
  risk_score,
  strategy_description,
  is_hot,
  is_active,
  created_at,
  updated_at
FROM public.copy_trading_leaders
WHERE is_active = true;

GRANT SELECT ON public.copy_trading_leaders_public TO anon, authenticated;

-- Remove the older broad realtime channel policies that allowed all postgres_changes topics.
DROP POLICY IF EXISTS "Authenticated can read scoped channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write scoped channels" ON realtime.messages;