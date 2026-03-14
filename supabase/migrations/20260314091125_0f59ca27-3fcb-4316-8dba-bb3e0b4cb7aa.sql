
-- Auto-Invest Engine: Core state table
CREATE TABLE public.auto_invest_engine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_name text NOT NULL DEFAULT 'QAQI Alpha Engine',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  strategy text NOT NULL DEFAULT 'aggressive',
  total_capital numeric(20,8) NOT NULL DEFAULT 0,
  total_deployed numeric(20,8) NOT NULL DEFAULT 0,
  total_profit numeric(20,8) NOT NULL DEFAULT 0,
  total_reinvested numeric(20,8) NOT NULL DEFAULT 0,
  reinvest_percent numeric(5,2) NOT NULL DEFAULT 100.00,
  stable_target_percent numeric(5,2) NOT NULL DEFAULT 30.00,
  growth_target_percent numeric(5,2) NOT NULL DEFAULT 70.00,
  rebalance_threshold numeric(5,2) NOT NULL DEFAULT 5.00,
  last_rebalance_at timestamptz,
  last_ai_analysis_at timestamptz,
  ai_confidence_score numeric(5,2),
  ai_market_regime text,
  cycle_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-Invest Allocations: What the engine is currently invested in
CREATE TABLE public.auto_invest_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id uuid REFERENCES public.auto_invest_engine(id) ON DELETE CASCADE NOT NULL,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  asset_class text NOT NULL DEFAULT 'crypto',
  allocation_type text NOT NULL DEFAULT 'growth' CHECK (allocation_type IN ('stable', 'growth', 'hedge')),
  target_percent numeric(5,2) NOT NULL DEFAULT 0,
  current_percent numeric(5,2) NOT NULL DEFAULT 0,
  quantity numeric(20,8) NOT NULL DEFAULT 0,
  entry_price numeric(20,8),
  current_price numeric(20,8),
  value_usd numeric(20,8) NOT NULL DEFAULT 0,
  pnl_usd numeric(20,8) NOT NULL DEFAULT 0,
  pnl_percent numeric(10,4) NOT NULL DEFAULT 0,
  ai_score numeric(5,2),
  ai_signal text,
  ai_reasoning text,
  stop_loss_percent numeric(5,2),
  take_profit_percent numeric(5,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-Invest Transactions: Full audit trail
CREATE TABLE public.auto_invest_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id uuid REFERENCES public.auto_invest_engine(id) ON DELETE CASCADE NOT NULL,
  allocation_id uuid REFERENCES public.auto_invest_allocations(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'buy', 'sell', 'rebalance', 'reinvest', 'withdraw', 'profit_take', 'stop_loss')),
  asset_symbol text,
  side text CHECK (side IN ('buy', 'sell')),
  quantity numeric(20,8),
  price numeric(20,8),
  amount_usd numeric(20,8) NOT NULL DEFAULT 0,
  fee_usd numeric(20,8) NOT NULL DEFAULT 0,
  pnl_usd numeric(20,8),
  ai_triggered boolean NOT NULL DEFAULT false,
  ai_reason text,
  ai_confidence numeric(5,2),
  market_regime text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-Invest AI Analysis Logs
CREATE TABLE public.auto_invest_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id uuid REFERENCES public.auto_invest_engine(id) ON DELETE CASCADE NOT NULL,
  analysis_type text NOT NULL,
  market_regime text,
  signals_used jsonb,
  recommendations jsonb,
  allocations_proposed jsonb,
  confidence_score numeric(5,2),
  model_used text,
  raw_response text,
  executed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.auto_invest_engine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_invest_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_invest_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_invest_ai_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Admin-only access for all auto-invest tables
CREATE POLICY "Admins manage auto invest engine" ON public.auto_invest_engine
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage auto invest allocations" ON public.auto_invest_allocations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage auto invest transactions" ON public.auto_invest_transactions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage auto invest ai logs" ON public.auto_invest_ai_logs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_auto_invest_engine_updated_at
  BEFORE UPDATE ON public.auto_invest_engine
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_auto_invest_allocations_updated_at
  BEFORE UPDATE ON public.auto_invest_allocations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for engine state
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_invest_engine;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_invest_allocations;
