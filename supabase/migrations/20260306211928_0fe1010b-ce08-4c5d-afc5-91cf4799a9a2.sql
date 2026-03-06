
CREATE TABLE IF NOT EXISTS public.traditional_assets (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  asset_class TEXT NOT NULL DEFAULT 'equity',
  exchange TEXT,
  sector TEXT,
  industry TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  price_usd NUMERIC(20,8),
  price_change_24h NUMERIC(20,8),
  price_change_percentage_24h NUMERIC(10,4),
  market_cap NUMERIC(24,2),
  volume NUMERIC(24,2),
  high_24h NUMERIC(20,8),
  low_24h NUMERIC(20,8),
  open_price NUMERIC(20,8),
  previous_close NUMERIC(20,8),
  week_52_high NUMERIC(20,8),
  week_52_low NUMERIC(20,8),
  pe_ratio NUMERIC(10,2),
  dividend_yield NUMERIC(10,4),
  beta NUMERIC(10,4),
  eps NUMERIC(20,4),
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.traditional_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read traditional assets" ON public.traditional_assets
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_traditional_assets_class ON public.traditional_assets(asset_class);
CREATE INDEX IF NOT EXISTS idx_traditional_assets_market_cap ON public.traditional_assets(market_cap DESC NULLS LAST);
