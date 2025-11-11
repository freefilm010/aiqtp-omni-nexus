-- Create enum for AI factor types
CREATE TYPE ai_factor_type AS ENUM ('technical', 'fundamental', 'sentiment', 'alternative');

-- Create enum for strategy status
CREATE TYPE strategy_status AS ENUM ('draft', 'backtesting', 'paper_trading', 'live', 'archived');

-- AI Factors table - stores generated trading factors
CREATE TABLE public.ai_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  factor_type ai_factor_type NOT NULL,
  code TEXT NOT NULL, -- Python/formula code for the factor
  parameters JSONB DEFAULT '{}'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- AI Strategies table - stores generated trading strategies
CREATE TABLE public.ai_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status strategy_status NOT NULL DEFAULT 'draft',
  factors UUID[] DEFAULT ARRAY[]::UUID[], -- References to ai_factors
  entry_rules JSONB NOT NULL,
  exit_rules JSONB NOT NULL,
  risk_parameters JSONB NOT NULL,
  code TEXT, -- Generated strategy code
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Strategy Performance table - tracks backtesting and live performance
CREATE TABLE public.strategy_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL,
  user_id UUID NOT NULL,
  test_type TEXT NOT NULL, -- 'backtest' or 'live' or 'paper'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  initial_capital NUMERIC NOT NULL,
  final_capital NUMERIC,
  total_return NUMERIC,
  sharpe_ratio NUMERIC,
  max_drawdown NUMERIC,
  win_rate NUMERIC,
  total_trades INTEGER DEFAULT 0,
  performance_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_factors
CREATE POLICY "Users can view their own factors"
  ON public.ai_factors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own factors"
  ON public.ai_factors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own factors"
  ON public.ai_factors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own factors"
  ON public.ai_factors FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all factors"
  ON public.ai_factors FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ai_strategies
CREATE POLICY "Users can view their own strategies"
  ON public.ai_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategies"
  ON public.ai_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies"
  ON public.ai_strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies"
  ON public.ai_strategies FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all strategies"
  ON public.ai_strategies FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for strategy_performance
CREATE POLICY "Users can view their own performance"
  ON public.strategy_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance"
  ON public.strategy_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all performance"
  ON public.strategy_performance FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add foreign key constraints
ALTER TABLE public.strategy_performance
  ADD CONSTRAINT fk_strategy
  FOREIGN KEY (strategy_id) REFERENCES public.ai_strategies(id) ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_ai_factors_updated_at
  BEFORE UPDATE ON public.ai_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ai_strategies_updated_at
  BEFORE UPDATE ON public.ai_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_ai_factors_user_id ON public.ai_factors(user_id);
CREATE INDEX idx_ai_factors_type ON public.ai_factors(factor_type);
CREATE INDEX idx_ai_strategies_user_id ON public.ai_strategies(user_id);
CREATE INDEX idx_ai_strategies_status ON public.ai_strategies(status);
CREATE INDEX idx_strategy_performance_strategy_id ON public.strategy_performance(strategy_id);
CREATE INDEX idx_strategy_performance_user_id ON public.strategy_performance(user_id);