-- Create copy_trading_leaders for real copy trading data
CREATE TABLE public.copy_trading_leaders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('elite', 'pro', 'rising')) DEFAULT 'rising',
  is_verified BOOLEAN DEFAULT false,
  pnl_30d NUMERIC DEFAULT 0,
  pnl_all_time NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0,
  sharpe_ratio NUMERIC DEFAULT 0,
  copiers_count INTEGER DEFAULT 0,
  aum NUMERIC DEFAULT 0,
  risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 5) DEFAULT 3,
  strategy_description TEXT,
  is_hot BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create economic_calendar_events for financial calendar
CREATE TABLE public.economic_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('earnings', 'economic', 'fed', 'crypto')),
  title TEXT NOT NULL,
  asset TEXT,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  forecast TEXT,
  previous TEXT,
  actual TEXT,
  is_live BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create connected_accounts for portfolio sync
CREATE TABLE public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('exchange', 'broker', 'defi', 'bank')),
  status TEXT NOT NULL CHECK (status IN ('connected', 'syncing', 'error', 'disconnected')) DEFAULT 'connected',
  balance NUMERIC DEFAULT 0,
  change_24h NUMERIC DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  api_key_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio_holdings for assets across accounts
CREATE TABLE public.portfolio_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.connected_accounts(id),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  value_usd NUMERIC DEFAULT 0,
  change_24h NUMERIC DEFAULT 0,
  allocation_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_ohlcv_cache for chart data
CREATE TABLE public.market_ohlcv_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  open_time TIMESTAMP WITH TIME ZONE NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, timeframe, open_time)
);

-- Add investment_portfolio for admin investment tracking
CREATE TABLE public.investment_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stable', 'growth')),
  target_percent NUMERIC NOT NULL,
  current_percent NUMERIC DEFAULT 0,
  value_usd NUMERIC DEFAULT 0,
  entry_price NUMERIC,
  current_price NUMERIC,
  pnl_percent NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add portfolio_performance for tracking returns
CREATE TABLE public.portfolio_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL UNIQUE,
  metric_value NUMERIC NOT NULL,
  is_positive BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copy_trading_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_ohlcv_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_performance ENABLE ROW LEVEL SECURITY;

-- Public read for leaders, calendar, market data
CREATE POLICY "Anyone can view active copy trading leaders" ON public.copy_trading_leaders
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active calendar events" ON public.economic_calendar_events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view market ohlcv cache" ON public.market_ohlcv_cache
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view investment portfolio" ON public.investment_portfolio
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view portfolio performance" ON public.portfolio_performance
  FOR SELECT USING (true);

-- User private data
CREATE POLICY "Users can view own connected accounts" ON public.connected_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own connected accounts" ON public.connected_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolio holdings" ON public.portfolio_holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own portfolio holdings" ON public.portfolio_holdings
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_copy_trading_leaders_tier ON public.copy_trading_leaders(tier);
CREATE INDEX idx_copy_trading_leaders_pnl ON public.copy_trading_leaders(pnl_30d DESC);
CREATE INDEX idx_calendar_events_date ON public.economic_calendar_events(event_time);
CREATE INDEX idx_connected_accounts_user ON public.connected_accounts(user_id);
CREATE INDEX idx_portfolio_holdings_user ON public.portfolio_holdings(user_id);
CREATE INDEX idx_ohlcv_cache_symbol ON public.market_ohlcv_cache(symbol, timeframe);