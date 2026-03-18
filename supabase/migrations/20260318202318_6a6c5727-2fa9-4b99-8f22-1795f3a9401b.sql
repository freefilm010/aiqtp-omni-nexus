
-- User stats snapshots (sports-card style metrics)
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Trading stats
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_pnl DECIMAL(16,2) NOT NULL DEFAULT 0,
  best_trade_pnl DECIMAL(16,2) NOT NULL DEFAULT 0,
  worst_trade_pnl DECIMAL(16,2) NOT NULL DEFAULT 0,
  avg_trade_size DECIMAL(16,2) NOT NULL DEFAULT 0,
  -- Strategy stats
  strategies_created INTEGER NOT NULL DEFAULT 0,
  strategies_graduated INTEGER NOT NULL DEFAULT 0,
  backtests_run INTEGER NOT NULL DEFAULT 0,
  avg_sharpe DECIMAL(6,3) NOT NULL DEFAULT 0,
  -- Social / engagement
  referrals_made INTEGER NOT NULL DEFAULT 0,
  referrals_verified INTEGER NOT NULL DEFAULT 0,
  posts_created INTEGER NOT NULL DEFAULT 0,
  predictions_made INTEGER NOT NULL DEFAULT 0,
  prediction_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  polls_voted INTEGER NOT NULL DEFAULT 0,
  -- Platform activity
  login_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_logins INTEGER NOT NULL DEFAULT 0,
  ai_queries INTEGER NOT NULL DEFAULT 0,
  signals_followed INTEGER NOT NULL DEFAULT 0,
  achievements_earned INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  -- Mining / tokens
  qtc_mined DECIMAL(16,4) NOT NULL DEFAULT 0,
  qtc_staked DECIMAL(16,4) NOT NULL DEFAULT 0,
  -- Rankings
  overall_rank INTEGER,
  trading_rank INTEGER,
  social_rank INTEGER,
  -- Timestamps
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- Leaderboard view (materialized for speed)
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
  category TEXT NOT NULL CHECK (category IN ('overall', 'trading', 'social', 'referrals', 'mining', 'predictions', 'strategies')),
  rank INTEGER NOT NULL,
  score DECIMAL(16,4) NOT NULL DEFAULT 0,
  display_name TEXT,
  avatar_url TEXT,
  highlight_stat TEXT, -- e.g. "92% win rate" or "147 referrals"
  badge TEXT, -- e.g. '🔥', '👑', '⚡'
  period_start DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, category, period_start)
);

-- Contest / challenge tracking
CREATE TABLE public.stat_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'trading', 'referrals', 'predictions', etc.
  metric TEXT NOT NULL, -- 'win_rate', 'total_pnl', 'referrals_verified', etc.
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended', 'awarded')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  prize_description TEXT,
  prize_value_usd DECIMAL(16,2) NOT NULL DEFAULT 0,
  prize_type TEXT NOT NULL DEFAULT 'qtc_tokens',
  max_participants INTEGER,
  participant_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES public.stat_contests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  current_score DECIMAL(16,4) NOT NULL DEFAULT 0,
  rank INTEGER,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  prize_awarded BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

-- RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stat_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_entries ENABLE ROW LEVEL SECURITY;

-- user_stats: users see own, admins see all
CREATE POLICY "Users see own stats" ON public.user_stats FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage stats" ON public.user_stats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- leaderboard: public read
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Admins manage leaderboards" ON public.leaderboard_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- contests: public read, admin write
CREATE POLICY "Anyone can view contests" ON public.stat_contests FOR SELECT USING (true);
CREATE POLICY "Admins manage contests" ON public.stat_contests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can view contests" ON public.stat_contests FOR SELECT TO anon USING (true);

-- contest_entries: users see own + leaderboard, users join own
CREATE POLICY "Users see contest entries" ON public.contest_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join contests" ON public.contest_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage contest entries" ON public.contest_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_entries;
