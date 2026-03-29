
-- Market alerts table (replaces generateMockAlerts)
CREATE TABLE public.market_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'price',
  severity TEXT NOT NULL DEFAULT 'medium',
  symbol TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  actionable BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  metrics JSONB DEFAULT '{}',
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own alerts" ON public.market_alerts FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "System inserts alerts" ON public.market_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own alerts" ON public.market_alerts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Admins manage all alerts" ON public.market_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insider trades / institutional filings
CREATE TABLE public.insider_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  symbol TEXT NOT NULL,
  insider_name TEXT NOT NULL,
  insider_title TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  shares INTEGER NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  value NUMERIC NOT NULL DEFAULT 0,
  ownership_percent NUMERIC DEFAULT 0,
  trade_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'SEC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.insider_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read insider trades" ON public.insider_trades FOR SELECT USING (true);
CREATE POLICY "Admins manage insider trades" ON public.insider_trades FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.institutional_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution TEXT NOT NULL,
  aum_billions NUMERIC NOT NULL DEFAULT 0,
  top_holdings JSONB NOT NULL DEFAULT '[]',
  new_positions TEXT[] DEFAULT '{}',
  exited_positions TEXT[] DEFAULT '{}',
  filing_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  quarter_end TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institutional_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read filings" ON public.institutional_filings FOR SELECT USING (true);
CREATE POLICY "Admins manage filings" ON public.institutional_filings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Quantum backends (replaces mockBackends)
CREATE TABLE public.quantum_backends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  qubits INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'maintenance', 'offline')),
  queue_length INTEGER NOT NULL DEFAULT 0,
  avg_job_time TEXT DEFAULT 'N/A',
  provider TEXT DEFAULT 'IBM',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quantum_backends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quantum backends" ON public.quantum_backends FOR SELECT USING (true);
CREATE POLICY "Admins manage quantum backends" ON public.quantum_backends FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Quantum jobs table (replaces local state jobs)
CREATE TABLE public.quantum_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  backend TEXT NOT NULL,
  qubits INTEGER NOT NULL DEFAULT 4,
  shots INTEGER NOT NULL DEFAULT 1024,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.quantum_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own jobs" ON public.quantum_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own jobs" ON public.quantum_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own jobs" ON public.quantum_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all jobs" ON public.quantum_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for market alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_alerts;
