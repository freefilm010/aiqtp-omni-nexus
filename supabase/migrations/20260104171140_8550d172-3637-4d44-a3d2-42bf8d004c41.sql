
-- Strategy graduation and rental system

-- Add graduation fields to ai_strategies
ALTER TABLE public.ai_strategies 
ADD COLUMN IF NOT EXISTS is_graduated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS graduation_date timestamptz,
ADD COLUMN IF NOT EXISTS profitability_score numeric(5,2),
ADD COLUMN IF NOT EXISTS consistency_score numeric(5,2),
ADD COLUMN IF NOT EXISTS backtest_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rental_price_monthly numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_available_for_rent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_rentals integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_earnings numeric(12,2) DEFAULT 0;

-- Add search fields to ai_factors
ALTER TABLE public.ai_factors
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS sharpe_ratio numeric(5,2),
ADD COLUMN IF NOT EXISTS win_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS total_return numeric(8,2);

-- Strategy rentals table
CREATE TABLE IF NOT EXISTS public.strategy_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid REFERENCES public.ai_strategies(id) ON DELETE CASCADE,
  renter_user_id uuid NOT NULL,
  creator_user_id uuid NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  monthly_price numeric(10,2) NOT NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rental profit distributions
CREATE TABLE IF NOT EXISTS public.rental_profit_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid REFERENCES public.strategy_rentals(id) ON DELETE CASCADE,
  trade_id uuid,
  gross_profit numeric(12,2) NOT NULL,
  creator_share numeric(12,2) NOT NULL, -- 40%
  renter_share numeric(12,2) NOT NULL, -- 40%
  platform_share numeric(12,2) NOT NULL, -- 20%
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'distributed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Strategy graduation tests
CREATE TABLE IF NOT EXISTS public.graduation_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid REFERENCES public.ai_strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  test_number integer NOT NULL,
  profitability numeric(5,2),
  win_rate numeric(5,2),
  sharpe_ratio numeric(5,2),
  max_drawdown numeric(5,2),
  consistency_score numeric(5,2),
  passed boolean DEFAULT false,
  test_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategy_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_profit_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduation_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for strategy_rentals
CREATE POLICY "Users can view their own rentals" ON public.strategy_rentals
  FOR SELECT USING (auth.uid() = renter_user_id OR auth.uid() = creator_user_id);

CREATE POLICY "Users can create rentals" ON public.strategy_rentals
  FOR INSERT WITH CHECK (auth.uid() = renter_user_id);

CREATE POLICY "Users can update their rentals" ON public.strategy_rentals
  FOR UPDATE USING (auth.uid() = renter_user_id);

-- RLS Policies for rental_profit_splits
CREATE POLICY "Users can view their profit splits" ON public.rental_profit_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.strategy_rentals 
      WHERE id = rental_id 
      AND (renter_user_id = auth.uid() OR creator_user_id = auth.uid())
    )
  );

-- RLS Policies for graduation_tests
CREATE POLICY "Users can view their graduation tests" ON public.graduation_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create graduation tests" ON public.graduation_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_ai_factors_tags ON public.ai_factors USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_factors_category ON public.ai_factors(category);
CREATE INDEX IF NOT EXISTS idx_ai_strategies_graduated ON public.ai_strategies(is_graduated, is_available_for_rent);
CREATE INDEX IF NOT EXISTS idx_strategy_rentals_status ON public.strategy_rentals(status);
