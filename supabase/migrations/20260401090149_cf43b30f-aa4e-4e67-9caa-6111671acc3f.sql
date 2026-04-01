
CREATE TABLE IF NOT EXISTS public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  price_usd numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_symbol_date ON public.price_history (symbol, created_at DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price history"
  ON public.price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert price history"
  ON public.price_history FOR INSERT
  TO service_role
  WITH CHECK (true);
