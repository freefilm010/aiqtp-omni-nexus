-- Fix remaining ERROR-level issues (continue from where we left off)
-- Drop existing contest_participants policies first
DROP POLICY IF EXISTS "Users can view own contest participation" ON public.contest_participants;
DROP POLICY IF EXISTS "Users can manage own contest participation" ON public.contest_participants;

CREATE POLICY "Users can view own contest participation"
ON public.contest_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 4) influencer_referrals - restrict to referrer and admins
ALTER TABLE public.influencer_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view referrals" ON public.influencer_referrals;
DROP POLICY IF EXISTS "Public can view referrals" ON public.influencer_referrals;
DROP POLICY IF EXISTS "Influencers can view own referrals" ON public.influencer_referrals;

CREATE POLICY "Influencers can view own referrals"
ON public.influencer_referrals
FOR SELECT
TO authenticated
USING (
  influencer_id IN (SELECT id FROM public.influencer_partners WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 5) strategy_performance - restrict to strategy owner and admins
ALTER TABLE public.strategy_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view strategy performance" ON public.strategy_performance;
DROP POLICY IF EXISTS "Public can view strategy performance" ON public.strategy_performance;
DROP POLICY IF EXISTS "Users can view own strategy performance" ON public.strategy_performance;

CREATE POLICY "Users can view own strategy performance"
ON public.strategy_performance
FOR SELECT
TO authenticated
USING (
  strategy_id IN (SELECT id FROM public.ai_strategies WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 6) graduation_tests - restrict to strategy creator and admins
ALTER TABLE public.graduation_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view graduation tests" ON public.graduation_tests;
DROP POLICY IF EXISTS "Public can view graduation tests" ON public.graduation_tests;
DROP POLICY IF EXISTS "Users can view own graduation tests" ON public.graduation_tests;
DROP POLICY IF EXISTS "Users can manage own graduation tests" ON public.graduation_tests;

CREATE POLICY "Users can view own graduation tests"
ON public.graduation_tests
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 7) elite_club_members - restrict to member and admins
ALTER TABLE public.elite_club_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view elite members" ON public.elite_club_members;
DROP POLICY IF EXISTS "Public can view elite members" ON public.elite_club_members;
DROP POLICY IF EXISTS "Users can view own elite membership" ON public.elite_club_members;

CREATE POLICY "Users can view own elite membership"
ON public.elite_club_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 8) data_mining_rewards - restrict to user and admins
ALTER TABLE public.data_mining_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view mining rewards" ON public.data_mining_rewards;
DROP POLICY IF EXISTS "Public can view mining rewards" ON public.data_mining_rewards;
DROP POLICY IF EXISTS "Users can view own mining rewards" ON public.data_mining_rewards;

CREATE POLICY "Users can view own mining rewards"
ON public.data_mining_rewards
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 9) strategy_rentals - restrict to renter, owner, and admins
ALTER TABLE public.strategy_rentals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view strategy rentals" ON public.strategy_rentals;
DROP POLICY IF EXISTS "Public can view strategy rentals" ON public.strategy_rentals;
DROP POLICY IF EXISTS "Users can view own strategy rentals" ON public.strategy_rentals;

CREATE POLICY "Users can view own strategy rentals"
ON public.strategy_rentals
FOR SELECT
TO authenticated
USING (
  renter_user_id = auth.uid()
  OR strategy_id IN (SELECT id FROM public.ai_strategies WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 10) rental_profit_splits
ALTER TABLE public.rental_profit_splits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view profit splits" ON public.rental_profit_splits;
DROP POLICY IF EXISTS "Public can view profit splits" ON public.rental_profit_splits;
DROP POLICY IF EXISTS "Users can view own profit splits" ON public.rental_profit_splits;

CREATE POLICY "Users can view own profit splits"
ON public.rental_profit_splits
FOR SELECT
TO authenticated
USING (
  rental_id IN (
    SELECT id FROM public.strategy_rentals 
    WHERE renter_user_id = auth.uid()
    OR strategy_id IN (SELECT id FROM public.ai_strategies WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 11) backtest_results
ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view backtest results" ON public.backtest_results;
DROP POLICY IF EXISTS "Public can view backtest results" ON public.backtest_results;
DROP POLICY IF EXISTS "Users can view own backtest results" ON public.backtest_results;

CREATE POLICY "Users can view own backtest results"
ON public.backtest_results
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 12) script_runs
ALTER TABLE public.script_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view script runs" ON public.script_runs;
DROP POLICY IF EXISTS "Public can view script runs" ON public.script_runs;
DROP POLICY IF EXISTS "Users can view own script runs" ON public.script_runs;

CREATE POLICY "Users can view own script runs"
ON public.script_runs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 13) user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Public can view achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;

CREATE POLICY "Users can view own achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 14) ai_generation_logs
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view generation logs" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "Public can view generation logs" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "Users can view own generation logs" ON public.ai_generation_logs;

CREATE POLICY "Users can view own generation logs"
ON public.ai_generation_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 15) bot_training_queue
ALTER TABLE public.bot_training_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view training queue" ON public.bot_training_queue;
DROP POLICY IF EXISTS "Public can view training queue" ON public.bot_training_queue;
DROP POLICY IF EXISTS "Users can view own training queue" ON public.bot_training_queue;

CREATE POLICY "Users can view own training queue"
ON public.bot_training_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 16) data_aggregator_bots
ALTER TABLE public.data_aggregator_bots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view data bots" ON public.data_aggregator_bots;
DROP POLICY IF EXISTS "Public can view data bots" ON public.data_aggregator_bots;
DROP POLICY IF EXISTS "Users can view own data bots" ON public.data_aggregator_bots;

CREATE POLICY "Users can view own data bots"
ON public.data_aggregator_bots
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 17) data_token_holdings
ALTER TABLE public.data_token_holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view token holdings" ON public.data_token_holdings;
DROP POLICY IF EXISTS "Public can view token holdings" ON public.data_token_holdings;
DROP POLICY IF EXISTS "Users can view own token holdings" ON public.data_token_holdings;

CREATE POLICY "Users can view own token holdings"
ON public.data_token_holdings
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 18) connected_accounts
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view connected accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Public can view connected accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can view own connected accounts" ON public.connected_accounts;

CREATE POLICY "Users can view own connected accounts"
ON public.connected_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 19) portfolio_holdings
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view portfolio holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Public can view portfolio holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Users can view own portfolio holdings" ON public.portfolio_holdings;

CREATE POLICY "Users can view own portfolio holdings"
ON public.portfolio_holdings
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 20) trade_logs
ALTER TABLE public.trade_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view trade logs" ON public.trade_logs;
DROP POLICY IF EXISTS "Public can view trade logs" ON public.trade_logs;
-- Keep existing "Users can view own trade logs" policy if it exists