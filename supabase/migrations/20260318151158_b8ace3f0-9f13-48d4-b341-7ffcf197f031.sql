
-- Politicians table
CREATE TABLE public.congress_politicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  party text NOT NULL DEFAULT 'Unknown',
  chamber text NOT NULL DEFAULT 'House',
  state text,
  avatar_url text,
  total_trades integer DEFAULT 0,
  total_filings integer DEFAULT 0,
  total_issuers integer DEFAULT 0,
  total_volume text DEFAULT '0',
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trades table
CREATE TABLE public.congress_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES public.congress_politicians(id) ON DELETE CASCADE,
  politician_name text NOT NULL,
  party text,
  chamber text,
  state text,
  trade_type text NOT NULL DEFAULT 'buy',
  ticker text NOT NULL,
  issuer_name text NOT NULL,
  amount_range text DEFAULT '1K–15K',
  trade_date timestamptz NOT NULL DEFAULT now(),
  disclosure_date timestamptz,
  asset_type text DEFAULT 'stock',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Featured issuers view data
CREATE TABLE public.congress_featured_issuers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  issuer_name text NOT NULL,
  logo_url text,
  total_trades integer DEFAULT 0,
  price_change_pct numeric DEFAULT 0,
  current_price numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (public read, admin write)
ALTER TABLE public.congress_politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_featured_issuers ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can read politicians" ON public.congress_politicians FOR SELECT USING (true);
CREATE POLICY "Anyone can read trades" ON public.congress_trades FOR SELECT USING (true);
CREATE POLICY "Anyone can read issuers" ON public.congress_featured_issuers FOR SELECT USING (true);

-- Seed featured politicians
INSERT INTO public.congress_politicians (full_name, party, chamber, state, total_trades, total_filings, total_issuers, total_volume, is_featured) VALUES
  ('Michael McCaul', 'Republican', 'House', 'TX', 4753, 33, 507, '522.66M', true),
  ('Markwayne Mullin', 'Republican', 'Senate', 'OK', 501, 39, 165, '24.25M', true),
  ('Katie Britt', 'Republican', 'Senate', 'AL', 26, 5, 15, '400K', true),
  ('Nancy Pelosi', 'Democrat', 'House', 'CA', 849, 72, 210, '69M', true),
  ('Tommy Tuberville', 'Republican', 'Senate', 'AL', 312, 18, 95, '8.2M', true),
  ('Dan Crenshaw', 'Republican', 'House', 'TX', 189, 14, 68, '3.5M', true);

-- Seed recent trades
INSERT INTO public.congress_trades (politician_name, party, chamber, state, trade_type, ticker, issuer_name, amount_range, trade_date) VALUES
  ('Thomas Kean Jr', 'Republican', 'House', 'NJ', 'sell', 'GOOGL', 'Alphabet Inc', '15K–50K', now()),
  ('Thomas Kean Jr', 'Republican', 'House', 'NJ', 'buy', 'FCNCA', 'First Citizens BancShares Inc', '1K–15K', now()),
  ('Thomas Kean Jr', 'Republican', 'House', 'NJ', 'buy', 'LIN', 'Linde PLC', '1K–15K', now()),
  ('Thomas Kean Jr', 'Republican', 'House', 'NJ', 'sell', 'WAT', 'Waters Corp', '1K–15K', now()),
  ('Tom Suozzi', 'Democrat', 'House', 'NY', 'sell', 'AMD', 'Advanced Micro Devices Inc', '1K–15K', now()),
  ('Nancy Pelosi', 'Democrat', 'House', 'CA', 'buy', 'NVDA', 'NVIDIA Corporation', '250K–500K', now() - interval '1 day'),
  ('Tommy Tuberville', 'Republican', 'Senate', 'AL', 'sell', 'MSFT', 'Microsoft Corp', '50K–100K', now() - interval '2 days'),
  ('Dan Crenshaw', 'Republican', 'House', 'TX', 'buy', 'AAPL', 'Apple Inc', '15K–50K', now() - interval '3 days'),
  ('Michael McCaul', 'Republican', 'House', 'TX', 'buy', 'LMT', 'Lockheed Martin Corp', '100K–250K', now() - interval '1 day'),
  ('Markwayne Mullin', 'Republican', 'Senate', 'OK', 'sell', 'TSLA', 'Tesla Inc', '50K–100K', now() - interval '4 days');

-- Seed featured issuers
INSERT INTO public.congress_featured_issuers (ticker, issuer_name, total_trades, price_change_pct, current_price) VALUES
  ('TSLA', 'Tesla Inc', 138, 115.86, 395.56),
  ('NVDA', 'NVIDIA Corporation', 311, 607.41, 183.22),
  ('FDX', 'FedEx Corp', 52, 62.94, 352.35),
  ('META', 'Meta Platforms Inc', 216, 217.20, 627.45),
  ('AMZN', 'Amazon.com Inc', 244, 116.70, 211.74);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.congress_trades;
