-- Create dex_tokens table for TokenScanner real data
CREATE TABLE IF NOT EXISTS public.dex_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'Solana',
  price NUMERIC DEFAULT 0,
  price_change_1h NUMERIC DEFAULT 0,
  price_change_24h NUMERIC DEFAULT 0,
  market_cap NUMERIC DEFAULT 0,
  volume_24h NUMERIC DEFAULT 0,
  liquidity NUMERIC DEFAULT 0,
  holders INTEGER DEFAULT 0,
  launch_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_verified BOOLEAN DEFAULT false,
  is_honeypot BOOLEAN DEFAULT false,
  buy_tax NUMERIC DEFAULT 0,
  sell_tax NUMERIC DEFAULT 0,
  score INTEGER DEFAULT 50,
  trending BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for dex_tokens (public read)
ALTER TABLE public.dex_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view dex tokens" ON public.dex_tokens;
CREATE POLICY "Anyone can view dex tokens" ON public.dex_tokens FOR SELECT USING (true);

-- Create forensic_transactions table
CREATE TABLE IF NOT EXISTS public.forensic_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  block_number BIGINT,
  chain TEXT DEFAULT 'ethereum',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forensic_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view forensic transactions" ON public.forensic_transactions;
CREATE POLICY "Anyone can view forensic transactions" ON public.forensic_transactions FOR SELECT USING (true);

-- Create backtest_results table
CREATE TABLE IF NOT EXISTS public.backtest_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  strategy_id UUID,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  initial_capital NUMERIC NOT NULL DEFAULT 10000,
  final_capital NUMERIC,
  total_return NUMERIC,
  max_drawdown NUMERIC,
  sharpe_ratio NUMERIC,
  win_rate NUMERIC,
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  avg_trade_duration TEXT,
  profit_factor NUMERIC,
  results_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their backtest results" ON public.backtest_results;
DROP POLICY IF EXISTS "Users can create backtest results" ON public.backtest_results;
DROP POLICY IF EXISTS "Users can delete their backtest results" ON public.backtest_results;
CREATE POLICY "Users can view their backtest results" ON public.backtest_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create backtest results" ON public.backtest_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their backtest results" ON public.backtest_results FOR DELETE USING (auth.uid() = user_id);

-- Create script_runs table for ScriptEditor
CREATE TABLE IF NOT EXISTS public.script_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  script_name TEXT NOT NULL,
  script_code TEXT NOT NULL,
  symbol TEXT DEFAULT 'BTC/USD',
  timeframe TEXT DEFAULT '1H',
  total_trades INTEGER,
  win_rate NUMERIC,
  sharpe_ratio NUMERIC,
  profit_factor NUMERIC,
  total_return NUMERIC,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.script_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their script runs" ON public.script_runs;
DROP POLICY IF EXISTS "Users can create script runs" ON public.script_runs;
DROP POLICY IF EXISTS "Users can update their script runs" ON public.script_runs;
CREATE POLICY "Users can view their script runs" ON public.script_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create script runs" ON public.script_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their script runs" ON public.script_runs FOR UPDATE USING (auth.uid() = user_id);

-- Create heatmap_data table
CREATE TABLE IF NOT EXISTS public.heatmap_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  change_24h NUMERIC DEFAULT 0,
  market_cap NUMERIC DEFAULT 0,
  volume_24h NUMERIC DEFAULT 0,
  sector TEXT DEFAULT 'Crypto',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.heatmap_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view heatmap data" ON public.heatmap_data;
CREATE POLICY "Anyone can view heatmap data" ON public.heatmap_data FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dex_tokens_chain ON public.dex_tokens(chain);
CREATE INDEX IF NOT EXISTS idx_dex_tokens_trending ON public.dex_tokens(trending);
CREATE INDEX IF NOT EXISTS idx_forensic_tx_flagged ON public.forensic_transactions(flagged);
CREATE INDEX IF NOT EXISTS idx_backtest_user ON public.backtest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_script_runs_user ON public.script_runs(user_id);