-- =====================================================
-- ACHIEVEMENTS & PERKS SYSTEM
-- =====================================================

-- User achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum, diamond
  metadata JSONB DEFAULT '{}',
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own achievements (triggered by system)
CREATE POLICY "System can insert achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all achievements
CREATE POLICY "Admins can view all achievements"
ON public.user_achievements FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- ELITE CREATORS CLUB (Graduated Strategy Owners)
-- =====================================================

CREATE TABLE public.elite_club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lifetime_earnings DECIMAL(20,8) DEFAULT 0,
  total_strategies_graduated INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'member', -- member, elite, legendary
  perks JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.elite_club_members ENABLE ROW LEVEL SECURITY;

-- Members can view their own membership
CREATE POLICY "Members can view own membership"
ON public.elite_club_members FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all memberships
CREATE POLICY "Admins can manage memberships"
ON public.elite_club_members FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- UPDATE AI STRATEGIES FOR ADMIN VISIBILITY & PROTECTION
-- =====================================================

-- Add admin approval column
ALTER TABLE public.ai_strategies
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS code_protected BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS creator_profit_share DECIMAL(5,2) DEFAULT 25.00;

-- Update RLS policies for strategies
DROP POLICY IF EXISTS "Users can view their own strategies" ON public.ai_strategies;
DROP POLICY IF EXISTS "Admins can view all strategies" ON public.ai_strategies;

-- Users see their own + admin-approved rentable strategies
CREATE POLICY "Users can view accessible strategies"
ON public.ai_strategies FOR SELECT
USING (
  auth.uid() = user_id 
  OR (is_graduated = true AND is_available_for_rent = true AND admin_approved = true)
  OR public.has_role(auth.uid(), 'admin')
);

-- Users can only update their own
CREATE POLICY "Users can update own strategies"
ON public.ai_strategies FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own
CREATE POLICY "Users can insert own strategies"
ON public.ai_strategies FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "Users can delete own strategies"
ON public.ai_strategies FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- UPDATE AI FACTORS FOR CODE PROTECTION
-- =====================================================

ALTER TABLE public.ai_factors
ADD COLUMN IF NOT EXISTS code_protected BOOLEAN DEFAULT true;

-- =====================================================
-- BOT TRAINING QUEUE (Strategy to Bot Pipeline)
-- =====================================================

CREATE TABLE public.bot_training_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.ai_strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'queued', -- queued, training, testing, graduated, failed
  training_started_at TIMESTAMP WITH TIME ZONE,
  training_completed_at TIMESTAMP WITH TIME ZONE,
  test_results JSONB DEFAULT '{}',
  profitability_score DECIMAL(5,2),
  consistency_score DECIMAL(5,2),
  graduation_eligible BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bot_training_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training"
ON public.bot_training_queue FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own training"
ON public.bot_training_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all training"
ON public.bot_training_queue FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- ACHIEVEMENT DEFINITIONS
-- =====================================================

CREATE TABLE public.achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- strategy, trading, community, milestone
  points INTEGER DEFAULT 10,
  icon TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievement definitions"
ON public.achievement_definitions FOR SELECT
USING (true);

-- Insert default achievements
INSERT INTO public.achievement_definitions (id, name, description, category, points, criteria) VALUES
('first_strategy', 'Strategy Creator', 'Created your first trading strategy', 'strategy', 10, '{"strategies_created": 1}'),
('first_factor', 'Factor Pioneer', 'Generated your first alpha factor', 'strategy', 10, '{"factors_created": 1}'),
('first_backtest', 'Backtester', 'Ran your first backtest', 'strategy', 10, '{"backtests_run": 1}'),
('strategy_graduate', 'Graduate', 'Graduated a strategy to marketplace', 'strategy', 100, '{"strategies_graduated": 1}'),
('elite_creator', 'Elite Creator', 'Joined the Elite Creators Club', 'milestone', 250, '{"elite_member": true}'),
('profitable_bot', 'Profitable Bot', 'Your bot achieved 92.5%+ profitability', 'milestone', 500, '{"bot_profitability": 92.5}'),
('first_rental', 'Rental Income', 'Earned first income from strategy rental', 'trading', 50, '{"rental_earnings": 1}'),
('community_helper', 'Community Helper', 'Helped 10 community members', 'community', 25, '{"community_helps": 10}'),
('top_performer', 'Top Performer', 'Your strategy reached top 10 rentals', 'milestone', 500, '{"top_rentals": true}'),
('legendary_creator', 'Legendary Creator', 'Graduated 5+ strategies with 95%+ profitability', 'milestone', 1000, '{"legendary_strategies": 5}');

-- =====================================================
-- TRIGGERS FOR AUTOMATIC ACHIEVEMENT UNLOCKING
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_strategy_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  strategy_count INTEGER;
  graduated_count INTEGER;
BEGIN
  -- Count user's strategies
  SELECT COUNT(*) INTO strategy_count FROM ai_strategies WHERE user_id = NEW.user_id;
  
  -- First strategy achievement
  IF strategy_count = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, points)
    VALUES (NEW.user_id, 'first_strategy', 'Strategy Creator', 'Created your first trading strategy', 10)
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;
  
  -- Check graduation
  IF NEW.is_graduated = true AND (OLD IS NULL OR OLD.is_graduated = false) THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, points, tier)
    VALUES (NEW.user_id, 'strategy_graduate', 'Graduate', 'Graduated a strategy to marketplace', 100, 'gold')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
    
    -- Add to elite club
    SELECT COUNT(*) INTO graduated_count FROM ai_strategies WHERE user_id = NEW.user_id AND is_graduated = true;
    
    INSERT INTO elite_club_members (user_id, total_strategies_graduated)
    VALUES (NEW.user_id, graduated_count)
    ON CONFLICT (user_id) DO UPDATE SET 
      total_strategies_graduated = graduated_count,
      updated_at = now();
    
    -- Elite creator achievement
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, points, tier)
    VALUES (NEW.user_id, 'elite_creator', 'Elite Creator', 'Joined the Elite Creators Club', 250, 'platinum')
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS strategy_achievement_trigger ON ai_strategies;
CREATE TRIGGER strategy_achievement_trigger
AFTER INSERT OR UPDATE ON ai_strategies
FOR EACH ROW
EXECUTE FUNCTION check_strategy_achievements();

-- Function to check factor achievements
CREATE OR REPLACE FUNCTION public.check_factor_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  factor_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO factor_count FROM ai_factors WHERE user_id = NEW.user_id;
  
  IF factor_count = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, points)
    VALUES (NEW.user_id, 'first_factor', 'Factor Pioneer', 'Generated your first alpha factor', 10)
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS factor_achievement_trigger ON ai_factors;
CREATE TRIGGER factor_achievement_trigger
AFTER INSERT ON ai_factors
FOR EACH ROW
EXECUTE FUNCTION check_factor_achievements();

-- Update profit share: 25% creator, 35% platform, 40% renter (40% effectively goes to platform total)
-- This is tracked via rental_profit_splits table which already exists