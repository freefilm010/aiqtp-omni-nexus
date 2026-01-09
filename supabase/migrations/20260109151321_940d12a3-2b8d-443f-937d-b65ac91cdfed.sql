-- Auto NFT Generation for Revenue
CREATE TABLE public.auto_nft_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  image_url TEXT,
  chain TEXT DEFAULT 'ethereum',
  mint_status TEXT DEFAULT 'pending',
  list_price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'ETH',
  royalty_percent NUMERIC DEFAULT 5,
  attributes JSONB DEFAULT '[]',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  minted_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  sale_price NUMERIC,
  buyer_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Platform Data Products (anonymized/aggregated data for sale)
CREATE TABLE public.data_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  data_type TEXT NOT NULL,
  sample_size INTEGER,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  update_frequency TEXT DEFAULT 'daily',
  format TEXT DEFAULT 'json',
  is_anonymized BOOLEAN DEFAULT true,
  contains_pii BOOLEAN DEFAULT false,
  compliance_tags TEXT[] DEFAULT ARRAY['GDPR', 'CCPA'],
  is_active BOOLEAN DEFAULT true,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Sales Log
CREATE TABLE public.data_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.data_products(id),
  buyer_name TEXT,
  buyer_type TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  delivery_method TEXT DEFAULT 'api',
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- NFT Generation Jobs Queue
CREATE TABLE public.nft_generation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT,
  total_count INTEGER DEFAULT 10,
  completed_count INTEGER DEFAULT 0,
  theme TEXT,
  style TEXT,
  base_price NUMERIC DEFAULT 0.1,
  chain TEXT DEFAULT 'ethereum',
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auto_nft_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_generation_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (service role manages these)
CREATE POLICY "Service role manages auto NFTs" ON public.auto_nft_generations FOR ALL USING (true);
CREATE POLICY "Service role manages data products" ON public.data_products FOR ALL USING (true);
CREATE POLICY "Service role manages data sales" ON public.data_sales FOR ALL USING (true);
CREATE POLICY "Service role manages NFT queue" ON public.nft_generation_queue FOR ALL USING (true);

-- Insert sample data products (safe, anonymized data)
INSERT INTO public.data_products (name, description, category, data_type, sample_size, price, update_frequency, format, compliance_tags) VALUES
('Market Trend Analytics', 'Aggregated cryptocurrency market movement patterns', 'market', 'analytics', 50000, 499, 'hourly', 'json', ARRAY['GDPR', 'CCPA']),
('Trading Volume Statistics', 'Anonymized platform trading volume by asset class', 'trading', 'statistics', 100000, 299, 'daily', 'csv', ARRAY['GDPR', 'CCPA']),
('DeFi Protocol Metrics', 'Cross-protocol DeFi performance benchmarks', 'defi', 'metrics', 25000, 799, 'daily', 'json', ARRAY['GDPR', 'CCPA']),
('NFT Market Intelligence', 'NFT pricing trends and rarity analysis', 'nft', 'intelligence', 75000, 599, 'hourly', 'json', ARRAY['GDPR', 'CCPA']),
('Whale Movement Patterns', 'Large transaction pattern analysis (anonymized)', 'blockchain', 'patterns', 10000, 999, 'realtime', 'api', ARRAY['GDPR', 'CCPA']),
('Sentiment Analysis Feed', 'Aggregated social media crypto sentiment scores', 'social', 'sentiment', 500000, 399, 'hourly', 'json', ARRAY['GDPR', 'CCPA']),
('Exchange Arbitrage Data', 'Cross-exchange price differential statistics', 'arbitrage', 'statistics', 30000, 699, 'realtime', 'api', ARRAY['GDPR', 'CCPA']),
('Token Launch Analytics', 'New token performance metrics and patterns', 'tokens', 'analytics', 15000, 449, 'daily', 'json', ARRAY['GDPR', 'CCPA']);