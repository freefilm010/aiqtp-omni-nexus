-- Paper Trading Tables for both paper and live modes

-- Paper trades (order history)
CREATE TABLE IF NOT EXISTS public.paper_trades (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type text NOT NULL,
  quantity numeric NOT NULL,
  price numeric,
  stop_price numeric,
  time_in_force text DEFAULT 'GTC',
  status text NOT NULL DEFAULT 'pending',
  filled_quantity numeric DEFAULT 0,
  filled_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz
);

ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paper trades"
ON public.paper_trades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper trades"
ON public.paper_trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper trades"
ON public.paper_trades FOR UPDATE
USING (auth.uid() = user_id);

-- Paper portfolio (current holdings)
CREATE TABLE IF NOT EXISTS public.paper_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

ALTER TABLE public.paper_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paper portfolio"
ON public.paper_portfolio FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own paper portfolio"
ON public.paper_portfolio FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trade logs (for audit trail)
CREATE TABLE IF NOT EXISTS public.trade_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_account_id uuid,
  action text NOT NULL,
  symbol text,
  side text,
  quantity numeric,
  price numeric,
  status text NOT NULL,
  exchange_order_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade logs"
ON public.trade_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert trade logs"
ON public.trade_logs FOR INSERT
WITH CHECK (true);

-- Function to update paper portfolio
CREATE OR REPLACE FUNCTION public.update_paper_portfolio(
  p_user_id uuid,
  p_symbol text,
  p_amount_change numeric,
  p_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty numeric;
  v_current_avg numeric;
  v_new_qty numeric;
  v_new_avg numeric;
BEGIN
  -- Get current position
  SELECT quantity, avg_price INTO v_current_qty, v_current_avg
  FROM paper_portfolio
  WHERE user_id = p_user_id AND symbol = p_symbol;

  IF NOT FOUND THEN
    -- Create new position
    IF p_amount_change > 0 THEN
      INSERT INTO paper_portfolio (user_id, symbol, quantity, avg_price)
      VALUES (p_user_id, p_symbol, p_amount_change, p_price);
    END IF;
  ELSE
    v_new_qty := v_current_qty + p_amount_change;
    
    IF v_new_qty <= 0 THEN
      -- Close position
      DELETE FROM paper_portfolio WHERE user_id = p_user_id AND symbol = p_symbol;
    ELSE
      -- Update position
      IF p_amount_change > 0 THEN
        -- Averaging into position
        v_new_avg := ((v_current_qty * v_current_avg) + (p_amount_change * p_price)) / v_new_qty;
      ELSE
        v_new_avg := v_current_avg; -- Keep same avg when selling
      END IF;
      
      UPDATE paper_portfolio
      SET quantity = v_new_qty, avg_price = v_new_avg, updated_at = now()
      WHERE user_id = p_user_id AND symbol = p_symbol;
    END IF;
  END IF;
END;
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_id ON public.paper_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_created_at ON public.paper_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paper_portfolio_user_id ON public.paper_portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_logs_user_id ON public.trade_logs(user_id);