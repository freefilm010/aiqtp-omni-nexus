
CREATE TABLE IF NOT EXISTS public.trade_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL DEFAULT 'buy',
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  fee_currency text NOT NULL DEFAULT 'USD',
  slippage_pct numeric NOT NULL DEFAULT 0,
  event_type text NOT NULL DEFAULT 'trade',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_events_user_time ON public.trade_events (user_id, created_at ASC);
CREATE INDEX idx_trade_events_symbol ON public.trade_events (symbol);

ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade events"
  ON public.trade_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade events"
  ON public.trade_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
