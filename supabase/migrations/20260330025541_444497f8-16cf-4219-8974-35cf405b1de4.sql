
CREATE TABLE public.custody_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'cold_storage',
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active',
  insurance_coverage NUMERIC NOT NULL DEFAULT 0,
  last_audit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custody_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custody_select" ON public.custody_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "custody_all" ON public.custody_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.margin_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  facility_type TEXT NOT NULL,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  credit_used NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  collateral_value NUMERIC NOT NULL DEFAULT 0,
  ltv_ratio NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.margin_facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "margin_select" ON public.margin_facilities FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "margin_insert" ON public.margin_facilities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.token_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'Solana',
  price NUMERIC NOT NULL DEFAULT 0,
  price_change_24h NUMERIC NOT NULL DEFAULT 0,
  market_cap NUMERIC NOT NULL DEFAULT 0,
  bonding_progress NUMERIC NOT NULL DEFAULT 0,
  holders INTEGER NOT NULL DEFAULT 0,
  volume_24h NUMERIC NOT NULL DEFAULT 0,
  creator_address TEXT,
  description TEXT,
  is_graduated BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.token_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "token_listings_select" ON public.token_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "token_listings_admin" ON public.token_listings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.deployed_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'Ethereum',
  template TEXT NOT NULL,
  symbol TEXT,
  max_supply INTEGER,
  mint_price NUMERIC,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'deployed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deployed_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_select" ON public.deployed_contracts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "contracts_insert" ON public.deployed_contracts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_alerts_select" ON public.risk_alerts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "risk_alerts_insert" ON public.risk_alerts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.token_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_alerts;
