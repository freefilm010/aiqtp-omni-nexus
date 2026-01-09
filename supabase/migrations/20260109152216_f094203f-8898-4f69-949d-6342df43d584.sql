-- Data Aggregator Bots (like trading strategies but for data collection)
CREATE TABLE public.data_aggregator_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  bot_type TEXT NOT NULL DEFAULT 'scraper',
  data_category TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  collection_frequency TEXT DEFAULT 'hourly',
  aggregation_rules JSONB DEFAULT '{}',
  output_format TEXT DEFAULT 'json',
  is_active BOOLEAN DEFAULT false,
  is_graduated BOOLEAN DEFAULT false,
  graduation_date TIMESTAMP WITH TIME ZONE,
  code TEXT,
  code_protected BOOLEAN DEFAULT true,
  total_records_collected BIGINT DEFAULT 0,
  total_data_sold BIGINT DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  creator_profit_share NUMERIC DEFAULT 30,
  quality_score NUMERIC DEFAULT 0,
  reliability_score NUMERIC DEFAULT 0,
  admin_approved BOOLEAN DEFAULT false,
  last_collection_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Collection Jobs (runs by bots)
CREATE TABLE public.data_collection_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES public.data_aggregator_bots(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  records_collected INTEGER DEFAULT 0,
  data_size_bytes BIGINT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Bot Marketplace (graduated bots available for rent)
CREATE TABLE public.data_bot_marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES public.data_aggregator_bots(id) ON DELETE CASCADE,
  rental_price_monthly NUMERIC DEFAULT 99,
  is_available BOOLEAN DEFAULT true,
  total_rentals INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Bot Rentals
CREATE TABLE public.data_bot_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES public.data_aggregator_bots(id),
  renter_user_id UUID NOT NULL,
  rental_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rental_end TIMESTAMP WITH TIME ZONE,
  monthly_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Token (for the data ecosystem blockchain concept)
CREATE TABLE public.data_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'DataCoin',
  symbol TEXT NOT NULL DEFAULT 'DATA',
  total_supply NUMERIC DEFAULT 1000000000,
  circulating_supply NUMERIC DEFAULT 0,
  price_usd NUMERIC DEFAULT 0.01,
  market_cap NUMERIC DEFAULT 0,
  description TEXT,
  use_cases JSONB DEFAULT '["data_purchases", "bot_rentals", "staking", "governance"]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Token Holdings
CREATE TABLE public.data_token_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  balance NUMERIC DEFAULT 0,
  staked_balance NUMERIC DEFAULT 0,
  earned_from_bots NUMERIC DEFAULT 0,
  earned_from_data_sales NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_aggregator_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_collection_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_bot_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_bot_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_token_holdings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own data bots" ON public.data_aggregator_bots
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view graduated bots" ON public.data_aggregator_bots
  FOR SELECT USING (is_graduated = true);

CREATE POLICY "Users can view own collection jobs" ON public.data_collection_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.data_aggregator_bots WHERE id = bot_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can view marketplace" ON public.data_bot_marketplace
  FOR SELECT USING (is_available = true);

CREATE POLICY "Users can rent bots" ON public.data_bot_rentals
  FOR ALL USING (auth.uid() = renter_user_id);

CREATE POLICY "Anyone can view data token" ON public.data_tokens
  FOR SELECT USING (true);

CREATE POLICY "Users can view own holdings" ON public.data_token_holdings
  FOR ALL USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_data_bots_updated_at
  BEFORE UPDATE ON public.data_aggregator_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_holdings_updated_at
  BEFORE UPDATE ON public.data_token_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial DATA token
INSERT INTO public.data_tokens (name, symbol, total_supply, price_usd, description, use_cases)
VALUES (
  'DataCoin', 
  'DATA', 
  1000000000, 
  0.01, 
  'Native token of the AIQTP Data Ecosystem - used for data purchases, bot rentals, staking rewards, and governance',
  '["data_purchases", "bot_rentals", "staking", "governance", "creator_rewards", "validator_rewards"]'
);