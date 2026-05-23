-- Replace sanitized views with real public-safe mirror tables so public pages work without raw user_id access.
DROP VIEW IF EXISTS public.leaderboard_public;
CREATE TABLE IF NOT EXISTS public.leaderboard_public (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  score numeric,
  rank integer,
  category text,
  badge text,
  highlight_stat text,
  period_type text,
  period_start date,
  updated_at timestamptz
);

ALTER TABLE public.leaderboard_public ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view sanitized leaderboard" ON public.leaderboard_public;
CREATE POLICY "Public can view sanitized leaderboard"
ON public.leaderboard_public
FOR SELECT
TO anon, authenticated
USING (true);
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;

INSERT INTO public.leaderboard_public (id, display_name, avatar_url, score, rank, category, badge, highlight_stat, period_type, period_start, updated_at)
SELECT id, display_name, avatar_url, score, rank, category, badge, highlight_stat, period_type, period_start, updated_at
FROM public.leaderboard_entries
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  score = EXCLUDED.score,
  rank = EXCLUDED.rank,
  category = EXCLUDED.category,
  badge = EXCLUDED.badge,
  highlight_stat = EXCLUDED.highlight_stat,
  period_type = EXCLUDED.period_type,
  period_start = EXCLUDED.period_start,
  updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.sync_leaderboard_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.leaderboard_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.leaderboard_public (id, display_name, avatar_url, score, rank, category, badge, highlight_stat, period_type, period_start, updated_at)
  VALUES (NEW.id, NEW.display_name, NEW.avatar_url, NEW.score, NEW.rank, NEW.category, NEW.badge, NEW.highlight_stat, NEW.period_type, NEW.period_start, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    score = EXCLUDED.score,
    rank = EXCLUDED.rank,
    category = EXCLUDED.category,
    badge = EXCLUDED.badge,
    highlight_stat = EXCLUDED.highlight_stat,
    period_type = EXCLUDED.period_type,
    period_start = EXCLUDED.period_start,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_leaderboard_public() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_leaderboard_public_trg ON public.leaderboard_entries;
CREATE TRIGGER sync_leaderboard_public_trg
AFTER INSERT OR UPDATE OR DELETE ON public.leaderboard_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_leaderboard_public();

DROP VIEW IF EXISTS public.copy_trading_leaders_public;
CREATE TABLE IF NOT EXISTS public.copy_trading_leaders_public (
  id uuid PRIMARY KEY,
  display_name text,
  avatar text,
  tier text,
  is_verified boolean,
  pnl_30d numeric,
  pnl_all_time numeric,
  win_rate numeric,
  max_drawdown numeric,
  sharpe_ratio numeric,
  copiers_count integer,
  aum numeric,
  risk_score integer,
  strategy_description text,
  is_hot boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
);

ALTER TABLE public.copy_trading_leaders_public ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view sanitized copy trading leaders" ON public.copy_trading_leaders_public;
CREATE POLICY "Public can view sanitized copy trading leaders"
ON public.copy_trading_leaders_public
FOR SELECT
TO anon, authenticated
USING (is_active = true);
GRANT SELECT ON public.copy_trading_leaders_public TO anon, authenticated;

INSERT INTO public.copy_trading_leaders_public (id, display_name, avatar, tier, is_verified, pnl_30d, pnl_all_time, win_rate, max_drawdown, sharpe_ratio, copiers_count, aum, risk_score, strategy_description, is_hot, is_active, created_at, updated_at)
SELECT id, display_name, avatar, tier, is_verified, pnl_30d, pnl_all_time, win_rate, max_drawdown, sharpe_ratio, copiers_count, aum, risk_score, strategy_description, is_hot, is_active, created_at, updated_at
FROM public.copy_trading_leaders
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar = EXCLUDED.avatar,
  tier = EXCLUDED.tier,
  is_verified = EXCLUDED.is_verified,
  pnl_30d = EXCLUDED.pnl_30d,
  pnl_all_time = EXCLUDED.pnl_all_time,
  win_rate = EXCLUDED.win_rate,
  max_drawdown = EXCLUDED.max_drawdown,
  sharpe_ratio = EXCLUDED.sharpe_ratio,
  copiers_count = EXCLUDED.copiers_count,
  aum = EXCLUDED.aum,
  risk_score = EXCLUDED.risk_score,
  strategy_description = EXCLUDED.strategy_description,
  is_hot = EXCLUDED.is_hot,
  is_active = EXCLUDED.is_active,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.sync_copy_trading_leaders_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.copy_trading_leaders_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.copy_trading_leaders_public (id, display_name, avatar, tier, is_verified, pnl_30d, pnl_all_time, win_rate, max_drawdown, sharpe_ratio, copiers_count, aum, risk_score, strategy_description, is_hot, is_active, created_at, updated_at)
  VALUES (NEW.id, NEW.display_name, NEW.avatar, NEW.tier, NEW.is_verified, NEW.pnl_30d, NEW.pnl_all_time, NEW.win_rate, NEW.max_drawdown, NEW.sharpe_ratio, NEW.copiers_count, NEW.aum, NEW.risk_score, NEW.strategy_description, NEW.is_hot, NEW.is_active, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar = EXCLUDED.avatar,
    tier = EXCLUDED.tier,
    is_verified = EXCLUDED.is_verified,
    pnl_30d = EXCLUDED.pnl_30d,
    pnl_all_time = EXCLUDED.pnl_all_time,
    win_rate = EXCLUDED.win_rate,
    max_drawdown = EXCLUDED.max_drawdown,
    sharpe_ratio = EXCLUDED.sharpe_ratio,
    copiers_count = EXCLUDED.copiers_count,
    aum = EXCLUDED.aum,
    risk_score = EXCLUDED.risk_score,
    strategy_description = EXCLUDED.strategy_description,
    is_hot = EXCLUDED.is_hot,
    is_active = EXCLUDED.is_active,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_copy_trading_leaders_public() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_copy_trading_leaders_public_trg ON public.copy_trading_leaders;
CREATE TRIGGER sync_copy_trading_leaders_public_trg
AFTER INSERT OR UPDATE OR DELETE ON public.copy_trading_leaders
FOR EACH ROW EXECUTE FUNCTION public.sync_copy_trading_leaders_public();