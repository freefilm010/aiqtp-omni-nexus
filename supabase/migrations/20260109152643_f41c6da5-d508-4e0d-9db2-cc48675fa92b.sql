
-- Update data_tokens table to support parent-child hierarchy
ALTER TABLE public.data_tokens 
ADD COLUMN IF NOT EXISTS parent_token_id UUID REFERENCES public.data_tokens(id),
ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'utility' CHECK (token_type IN ('parent', 'child', 'utility')),
ADD COLUMN IF NOT EXISTS data_category TEXT,
ADD COLUMN IF NOT EXISTS mining_power NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS boost_multiplier NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS total_mined NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS miners_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emission_rate NUMERIC DEFAULT 0.001,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Clear existing tokens and insert the hierarchy
DELETE FROM public.data_tokens;

-- Insert parent token $DATA
INSERT INTO public.data_tokens (id, symbol, name, description, total_supply, circulating_supply, price_usd, market_cap, token_type, data_category, mining_power, boost_multiplier, use_cases)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'DATA',
  'DataCoin',
  'The parent governance and value token of the AIQTP Data Ecosystem. All child tokens mine and boost DATA value.',
  1000000000,
  0,
  0.01,
  0,
  'parent',
  'governance',
  100.0,
  1.0,
  '["Governance", "Staking", "Value Store", "Ecosystem Rewards", "Data Marketplace Currency"]'::jsonb
);

-- Insert child tokens that mine DATA
INSERT INTO public.data_tokens (symbol, name, description, total_supply, circulating_supply, price_usd, token_type, parent_token_id, data_category, mining_power, emission_rate, use_cases) VALUES
('AGDA', 'Aggregated Data Token', 'Earned by aggregating and curating data from multiple sources. Mines $DATA.', 100000000, 0, 0.001, 'child', 'a0000000-0000-0000-0000-000000000001', 'aggregation', 10.0, 0.01, '["Data Aggregation Rewards", "Curation Incentives", "DATA Mining"]'::jsonb),
('MDAT', 'Mined Data Token', 'Earned from raw data collection and validation. Direct DATA miner.', 500000000, 0, 0.0005, 'child', 'a0000000-0000-0000-0000-000000000001', 'mining', 5.0, 0.02, '["Raw Data Rewards", "Collection Incentives", "DATA Mining"]'::jsonb),
('DATM', 'Data Miner Token', 'Staking token for data mining operations. Boosts mining efficiency.', 50000000, 0, 0.005, 'child', 'a0000000-0000-0000-0000-000000000001', 'staking', 20.0, 0.005, '["Mining Power Boost", "Staking Rewards", "Operator Rights"]'::jsonb),
('SDAT', 'Social Data Token', 'Earned from social media data collection and sentiment analysis.', 200000000, 0, 0.0008, 'child', 'a0000000-0000-0000-0000-000000000001', 'social', 8.0, 0.015, '["Social Mining", "Sentiment Rewards", "Trend Analysis"]'::jsonb),
('FDAT', 'Financial Data Token', 'Earned from financial market data aggregation and analysis.', 100000000, 0, 0.002, 'child', 'a0000000-0000-0000-0000-000000000001', 'financial', 15.0, 0.008, '["Market Data Mining", "Price Feed Rewards", "Analysis Incentives"]'::jsonb),
('ODAT', 'On-Chain Data Token', 'Earned from blockchain data indexing and cross-chain analysis.', 150000000, 0, 0.0012, 'child', 'a0000000-0000-0000-0000-000000000001', 'onchain', 12.0, 0.012, '["Chain Indexing", "Cross-Chain Analysis", "DeFi Data"]'::jsonb),
('ADAT', 'AI Data Token', 'Earned from AI training data preparation and model feedback.', 75000000, 0, 0.003, 'child', 'a0000000-0000-0000-0000-000000000001', 'ai_training', 25.0, 0.004, '["AI Training Data", "Model Feedback", "Dataset Curation"]'::jsonb),
('IDAT', 'IoT Data Token', 'Earned from IoT sensor data collection and edge computing.', 250000000, 0, 0.0003, 'child', 'a0000000-0000-0000-0000-000000000001', 'iot', 3.0, 0.025, '["Sensor Data", "Edge Computing", "Real-World Data"]'::jsonb);

-- Create mining rewards tracking table
CREATE TABLE IF NOT EXISTS public.data_mining_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_id UUID REFERENCES public.data_tokens(id),
  parent_token_id UUID REFERENCES public.data_tokens(id),
  amount_mined NUMERIC NOT NULL DEFAULT 0,
  parent_boost_earned NUMERIC NOT NULL DEFAULT 0,
  mining_source TEXT,
  bot_id UUID REFERENCES public.data_aggregator_bots(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create token boost events table
CREATE TABLE IF NOT EXISTS public.data_token_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_token_id UUID REFERENCES public.data_tokens(id),
  parent_token_id UUID REFERENCES public.data_tokens(id),
  boost_amount NUMERIC NOT NULL,
  miners_contributing INTEGER DEFAULT 0,
  boost_type TEXT DEFAULT 'mining',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_mining_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_token_boosts ENABLE ROW LEVEL SECURITY;

-- RLS policies for mining rewards
CREATE POLICY "Users can view their own mining rewards" ON public.data_mining_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mining rewards" ON public.data_mining_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read for token boosts (transparency)
CREATE POLICY "Anyone can view token boosts" ON public.data_token_boosts FOR SELECT USING (true);
CREATE POLICY "System can insert token boosts" ON public.data_token_boosts FOR INSERT WITH CHECK (true);
