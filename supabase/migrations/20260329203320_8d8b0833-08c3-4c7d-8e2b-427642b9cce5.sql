
-- Swarm agents table for HiveMind
CREATE TABLE public.swarm_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Brain',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','degraded','retraining','retired')),
  confidence NUMERIC NOT NULL DEFAULT 0,
  accuracy_7d NUMERIC NOT NULL DEFAULT 0,
  signals_today INTEGER NOT NULL DEFAULT 0,
  last_signal TEXT,
  vote TEXT NOT NULL DEFAULT 'neutral' CHECK (vote IN ('bull','bear','neutral')),
  streak INTEGER NOT NULL DEFAULT 0,
  generation INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swarm_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read swarm agents" ON public.swarm_agents FOR SELECT USING (true);
CREATE POLICY "Admins can manage swarm agents" ON public.swarm_agents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Consensus signals table
CREATE TABLE public.consensus_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('LONG','SHORT','HOLD')),
  consensus_score NUMERIC NOT NULL DEFAULT 0,
  agent_votes JSONB NOT NULL DEFAULT '[]',
  executed BOOLEAN NOT NULL DEFAULT false,
  pnl NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consensus_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read consensus signals" ON public.consensus_signals FOR SELECT USING (true);
CREATE POLICY "Admins can manage consensus signals" ON public.consensus_signals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ML Models table
CREATE TABLE public.ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_type TEXT NOT NULL,
  accuracy NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('training','ready','deployed','failed')),
  config JSONB NOT NULL DEFAULT '{}',
  training_metrics JSONB NOT NULL DEFAULT '[]',
  feature_importance JSONB NOT NULL DEFAULT '[]',
  confusion_matrix JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own models" ON public.ml_models FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own models" ON public.ml_models FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own models" ON public.ml_models FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own models" ON public.ml_models FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all models" ON public.ml_models FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Live strategies table (replaces mock in LiveStrategies.tsx)
CREATE TABLE public.live_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id TEXT,
  name TEXT NOT NULL,
  code_name TEXT,
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running','paused','stopped')),
  pairs TEXT[] NOT NULL DEFAULT '{}',
  profit NUMERIC NOT NULL DEFAULT 0,
  profit_percent NUMERIC NOT NULL DEFAULT 0,
  trades INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC NOT NULL DEFAULT 0,
  uptime_seconds INTEGER NOT NULL DEFAULT 0,
  last_trade_at TIMESTAMPTZ,
  open_positions INTEGER NOT NULL DEFAULT 0,
  drawdown NUMERIC NOT NULL DEFAULT 0,
  personality TEXT,
  catchphrase TEXT,
  primary_color TEXT DEFAULT 'primary',
  strategy_id UUID REFERENCES public.ai_strategies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.live_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own live strategies" ON public.live_strategies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own live strategies" ON public.live_strategies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own live strategies" ON public.live_strategies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all live strategies" ON public.live_strategies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Platform activity log for persistent memory / admin audit trail
CREATE TABLE public.platform_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own activity" ON public.platform_activity_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.platform_activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all activity" ON public.platform_activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for live strategies
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_strategies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.swarm_agents;
