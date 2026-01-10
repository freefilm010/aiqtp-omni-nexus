-- Create ai_signals table for real AI-generated trading signals
CREATE TABLE public.ai_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'alert')),
  strength TEXT NOT NULL CHECK (strength IN ('strong', 'moderate', 'weak')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reason TEXT NOT NULL,
  price_at_signal NUMERIC,
  target_price NUMERIC,
  stop_loss NUMERIC,
  source TEXT NOT NULL DEFAULT 'AI Engine',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create screener_results for AI screener findings
CREATE TABLE public.screener_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'forex')),
  signal TEXT NOT NULL CHECK (signal IN ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  patterns TEXT[] DEFAULT '{}',
  triggers TEXT[] DEFAULT '{}',
  current_price NUMERIC,
  price_target NUMERIC,
  change_24h NUMERIC,
  volume_24h NUMERIC,
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  category TEXT,
  is_hot BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_notifications for real notifications
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('trade_executed', 'price_alert', 'signal', 'system', 'whale_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  asset TEXT,
  value TEXT,
  change_percent NUMERIC,
  is_read BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create smart_money_flows for whale/institutional tracking
CREATE TABLE public.smart_money_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  inflow_millions NUMERIC NOT NULL DEFAULT 0,
  outflow_millions NUMERIC NOT NULL DEFAULT 0,
  net_flow_millions NUMERIC NOT NULL DEFAULT 0,
  whale_activity TEXT CHECK (whale_activity IN ('accumulating', 'distributing', 'neutral')),
  institutional_bias TEXT CHECK (institutional_bias IN ('bullish', 'bearish', 'neutral')),
  price NUMERIC,
  change_24h NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_screener_assets for crypto screener
CREATE TABLE public.market_screener_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_24h NUMERIC DEFAULT 0,
  change_7d NUMERIC DEFAULT 0,
  volume_24h NUMERIC DEFAULT 0,
  market_cap NUMERIC DEFAULT 0,
  rsi NUMERIC,
  macd_signal TEXT CHECK (macd_signal IN ('bullish', 'bearish', 'neutral')),
  volume_change NUMERIC DEFAULT 0,
  price_score INTEGER CHECK (price_score >= 0 AND price_score <= 100),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screener_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_money_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_screener_assets ENABLE ROW LEVEL SECURITY;

-- Signals, screener, flows, assets are publicly readable (market data)
CREATE POLICY "Anyone can view active signals" ON public.ai_signals
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active screener results" ON public.screener_results
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view smart money flows" ON public.smart_money_flows
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view market screener assets" ON public.market_screener_assets
  FOR SELECT USING (true);

-- User notifications are private
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_ai_signals_symbol ON public.ai_signals(symbol);
CREATE INDEX idx_ai_signals_type ON public.ai_signals(signal_type);
CREATE INDEX idx_ai_signals_active ON public.ai_signals(is_active);
CREATE INDEX idx_screener_results_symbol ON public.screener_results(symbol);
CREATE INDEX idx_screener_results_category ON public.screener_results(category);
CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);
CREATE INDEX idx_smart_money_flows_asset ON public.smart_money_flows(asset);