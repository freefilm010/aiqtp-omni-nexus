
-- Arbitrage scanner: persist real scanned opportunities
CREATE TABLE public.arbitrage_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL,
  buy_exchange text NOT NULL,
  sell_exchange text NOT NULL,
  buy_price numeric NOT NULL,
  sell_price numeric NOT NULL,
  spread numeric NOT NULL,
  spread_percent numeric NOT NULL,
  volume numeric DEFAULT 0,
  estimated_profit numeric DEFAULT 0,
  arb_type text DEFAULT 'simple',
  risk text DEFAULT 'low',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view arbitrage" ON public.arbitrage_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage arbitrage" ON public.arbitrage_opportunities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Apex prop trading accounts
CREATE TABLE public.apex_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  status text DEFAULT 'active',
  balance numeric DEFAULT 50000,
  daily_pnl numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  drawdown numeric DEFAULT 0,
  max_drawdown numeric DEFAULT 2500,
  contracts_used int DEFAULT 0,
  max_contracts int DEFAULT 4,
  consistency_score numeric DEFAULT 0,
  payout_cycle int DEFAULT 1,
  max_payout_cycles int DEFAULT 6,
  last_trade timestamptz,
  trade_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.apex_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own apex accounts" ON public.apex_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage apex accounts" ON public.apex_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CV Lab detection results
CREATE TABLE public.cv_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text,
  timeframe text,
  pattern_type text NOT NULL,
  confidence numeric NOT NULL,
  direction text DEFAULT 'neutral',
  price_target numeric,
  stop_loss numeric,
  location_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cv_detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own cv detections" ON public.cv_detections FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own cv detections" ON public.cv_detections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Signal monitor signals  
CREATE TABLE public.trading_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  symbol text NOT NULL,
  signal_type text NOT NULL,
  strength numeric DEFAULT 0,
  source text,
  factors text[],
  price numeric,
  target_price numeric,
  stop_loss numeric,
  confidence numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view signals" ON public.trading_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage signals" ON public.trading_signals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.arbitrage_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_signals;
