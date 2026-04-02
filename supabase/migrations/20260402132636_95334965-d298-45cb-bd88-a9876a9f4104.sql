
-- Historical analysis insights from backtest cycles
CREATE TABLE public.strategy_historical_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.ai_strategies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  analysis_date DATE NOT NULL,
  market_event TEXT,
  event_category TEXT DEFAULT 'general',
  strategy_performance DECIMAL DEFAULT 0,
  benchmark_performance DECIMAL DEFAULT 0,
  alpha_generated DECIMAL DEFAULT 0,
  win_rate DECIMAL DEFAULT 0,
  max_drawdown DECIMAL DEFAULT 0,
  volatility DECIMAL DEFAULT 0,
  regime_detected TEXT DEFAULT 'unknown',
  causal_factors JSONB DEFAULT '[]'::jsonb,
  pattern_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Self-training prediction ledger
CREATE TABLE public.strategy_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.ai_strategies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  prediction_type TEXT NOT NULL DEFAULT 'performance',
  predicted_direction TEXT NOT NULL,
  predicted_confidence DECIMAL NOT NULL DEFAULT 0.5,
  predicted_value DECIMAL,
  actual_direction TEXT,
  actual_value DECIMAL,
  was_correct BOOLEAN,
  user_accepted BOOLEAN,
  user_action_irrelevant BOOLEAN DEFAULT true,
  analysis_window_start TIMESTAMPTZ NOT NULL,
  analysis_window_end TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  causal_reasoning TEXT,
  model_version TEXT DEFAULT 'v1',
  feedback_applied BOOLEAN DEFAULT false,
  weight_adjustments JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Self-training metrics
CREATE TABLE public.strategy_self_training_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.ai_strategies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  epoch INTEGER NOT NULL DEFAULT 0,
  accuracy_before DECIMAL DEFAULT 0,
  accuracy_after DECIMAL DEFAULT 0,
  predictions_evaluated INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  weight_deltas JSONB DEFAULT '{}'::jsonb,
  patterns_discovered TEXT[] DEFAULT '{}',
  regime_transitions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_historical_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_self_training_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own historical analysis" ON public.strategy_historical_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own historical analysis" ON public.strategy_historical_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions" ON public.strategy_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own predictions" ON public.strategy_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.strategy_predictions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own training logs" ON public.strategy_self_training_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training logs" ON public.strategy_self_training_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sha_strategy ON public.strategy_historical_analysis(strategy_id);
CREATE INDEX idx_sha_date ON public.strategy_historical_analysis(analysis_date);
CREATE INDEX idx_sp_strategy ON public.strategy_predictions(strategy_id);
CREATE INDEX idx_sp_resolved ON public.strategy_predictions(was_correct) WHERE resolved_at IS NOT NULL;
CREATE INDEX idx_sstl_strategy ON public.strategy_self_training_log(strategy_id);
