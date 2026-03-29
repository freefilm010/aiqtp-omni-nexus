-- Marketplace suggestions table
CREATE TABLE IF NOT EXISTS public.marketplace_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'new',
  votes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  is_hot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read suggestions" ON public.marketplace_suggestions FOR SELECT USING (true);
CREATE POLICY "Auth users can insert suggestions" ON public.marketplace_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestions" ON public.marketplace_suggestions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Suggestion votes
CREATE TABLE IF NOT EXISTS public.suggestion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID REFERENCES public.marketplace_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON public.suggestion_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON public.suggestion_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own vote" ON public.suggestion_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Freqtrade bots table  
CREATE TABLE IF NOT EXISTS public.trading_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped',
  pair TEXT NOT NULL DEFAULT 'BTC/USDT',
  timeframe TEXT NOT NULL DEFAULT '15m',
  profit DECIMAL(20,8) DEFAULT 0,
  trades INT DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  last_trade_at TIMESTAMPTZ,
  is_dry_run BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trading_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own bots" ON public.trading_bots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert bots" ON public.trading_bots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bots" ON public.trading_bots FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bots" ON public.trading_bots FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Faucet leaderboard view (aggregated from faucet_claims)
CREATE OR REPLACE VIEW public.faucet_leaderboard AS
SELECT 
  fc.user_id,
  COALESCE(p.full_name, 'Anon-' || LEFT(fc.user_id::text, 6)) as display_name,
  COUNT(*) as total_claims,
  COUNT(DISTINCT DATE(fc.created_at)) as active_days
FROM public.faucet_claims fc
LEFT JOIN public.profiles p ON p.id = fc.user_id
GROUP BY fc.user_id, p.full_name
ORDER BY total_claims DESC
LIMIT 20;