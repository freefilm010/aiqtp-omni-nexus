-- Internal Exchange System

-- Price feeds for tokens (oracle data)
CREATE TABLE public.token_price_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES public.platform_tokens(id),
  base_currency VARCHAR(20) NOT NULL, -- USD, BTC, ETH
  price DECIMAL(30,12) NOT NULL,
  price_24h_ago DECIMAL(30,12),
  change_24h_percent DECIMAL(10,4),
  high_24h DECIMAL(30,12),
  low_24h DECIMAL(30,12),
  volume_24h DECIMAL(30,8) DEFAULT 0,
  market_cap DECIMAL(30,8),
  source VARCHAR(50) DEFAULT 'internal', -- internal, coingecko, binance
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(token_id, base_currency)
);

-- Trading pairs (e.g., QTC/USD, QAQI/BTC)
CREATE TABLE public.exchange_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_token_id UUID REFERENCES public.platform_tokens(id), -- QTC
  quote_currency VARCHAR(20) NOT NULL, -- USD, BTC, ETH, USDT
  pair_symbol VARCHAR(20) NOT NULL, -- QTC/USD
  is_active BOOLEAN DEFAULT true,
  min_order_size DECIMAL(30,8) DEFAULT 1,
  max_order_size DECIMAL(30,8) DEFAULT 1000000,
  price_precision INTEGER DEFAULT 8,
  quantity_precision INTEGER DEFAULT 8,
  maker_fee_percent DECIMAL(5,4) DEFAULT 0.1, -- 0.1%
  taker_fee_percent DECIMAL(5,4) DEFAULT 0.15, -- 0.15%
  last_price DECIMAL(30,12),
  bid_price DECIMAL(30,12), -- best bid
  ask_price DECIMAL(30,12), -- best ask
  spread_percent DECIMAL(5,4),
  volume_24h DECIMAL(30,8) DEFAULT 0,
  trades_24h INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pair_symbol)
);

-- Order book
CREATE TABLE public.exchange_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pair_id UUID NOT NULL REFERENCES public.exchange_pairs(id),
  order_type VARCHAR(20) NOT NULL, -- market, limit, stop_limit
  side VARCHAR(10) NOT NULL, -- buy, sell
  price DECIMAL(30,12), -- null for market orders
  quantity DECIMAL(30,8) NOT NULL,
  filled_quantity DECIMAL(30,8) DEFAULT 0,
  remaining_quantity DECIMAL(30,8),
  status VARCHAR(20) DEFAULT 'open', -- open, partially_filled, filled, cancelled
  time_in_force VARCHAR(10) DEFAULT 'GTC', -- GTC, IOC, FOK
  stop_price DECIMAL(30,12),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  filled_at TIMESTAMP WITH TIME ZONE
);

-- Trade history
CREATE TABLE public.exchange_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES public.exchange_pairs(id),
  buy_order_id UUID REFERENCES public.exchange_orders(id),
  sell_order_id UUID REFERENCES public.exchange_orders(id),
  buyer_user_id UUID NOT NULL,
  seller_user_id UUID NOT NULL,
  price DECIMAL(30,12) NOT NULL,
  quantity DECIMAL(30,8) NOT NULL,
  total DECIMAL(30,12) NOT NULL, -- price * quantity
  buyer_fee DECIMAL(30,8) DEFAULT 0,
  seller_fee DECIMAL(30,8) DEFAULT 0,
  is_maker_buy BOOLEAN, -- true if buyer was maker
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Liquidity pools (admin-provided liquidity)
CREATE TABLE public.exchange_liquidity_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES public.exchange_pairs(id),
  base_token_reserve DECIMAL(30,8) NOT NULL DEFAULT 0,
  quote_reserve DECIMAL(30,8) NOT NULL DEFAULT 0,
  total_liquidity DECIMAL(30,8) DEFAULT 0,
  fee_percent DECIMAL(5,4) DEFAULT 0.3, -- 0.3% swap fee
  is_active BOOLEAN DEFAULT true,
  auto_market_make BOOLEAN DEFAULT true,
  spread_percent DECIMAL(5,4) DEFAULT 0.5, -- spread for AMM
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pair_id)
);

-- User exchange balances (internal wallet for trading)
CREATE TABLE public.exchange_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  currency VARCHAR(20) NOT NULL, -- QTC, USD, BTC, ETH
  available_balance DECIMAL(30,8) DEFAULT 0,
  locked_balance DECIMAL(30,8) DEFAULT 0, -- in open orders
  total_deposited DECIMAL(30,8) DEFAULT 0,
  total_withdrawn DECIMAL(30,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Price history for charts
CREATE TABLE public.token_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID REFERENCES public.exchange_pairs(id),
  open_price DECIMAL(30,12) NOT NULL,
  high_price DECIMAL(30,12) NOT NULL,
  low_price DECIMAL(30,12) NOT NULL,
  close_price DECIMAL(30,12) NOT NULL,
  volume DECIMAL(30,8) DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  interval_type VARCHAR(10) NOT NULL, -- 1m, 5m, 15m, 1h, 4h, 1d
  interval_start TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pair_id, interval_type, interval_start)
);

-- Enable RLS
ALTER TABLE public.token_price_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view price feeds" ON public.token_price_feeds FOR SELECT USING (true);
CREATE POLICY "Admins can manage price feeds" ON public.token_price_feeds FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active pairs" ON public.exchange_pairs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pairs" ON public.exchange_pairs FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their orders" ON public.exchange_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.exchange_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel their orders" ON public.exchange_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON public.exchange_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view trades" ON public.exchange_trades FOR SELECT USING (true);
CREATE POLICY "Admins can manage trades" ON public.exchange_trades FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage liquidity pools" ON public.exchange_liquidity_pools FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view liquidity pools" ON public.exchange_liquidity_pools FOR SELECT USING (true);

CREATE POLICY "Users can view their balances" ON public.exchange_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage balances" ON public.exchange_balances FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view price history" ON public.token_price_history FOR SELECT USING (true);
CREATE POLICY "Admins can manage price history" ON public.token_price_history FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed trading pairs with initial prices
INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, last_price, bid_price, ask_price, maker_fee_percent, taker_fee_percent)
SELECT id, 'USD', symbol || '/USD', 0.001, 0.00099, 0.00101, 0.1, 0.15 FROM public.platform_tokens WHERE symbol = 'QTC';

INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, last_price, bid_price, ask_price, maker_fee_percent, taker_fee_percent)
SELECT id, 'BTC', symbol || '/BTC', 0.00000001, 0.0000000099, 0.0000000101, 0.1, 0.15 FROM public.platform_tokens WHERE symbol = 'QTC';

INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, last_price, bid_price, ask_price, maker_fee_percent, taker_fee_percent)
SELECT id, 'USD', symbol || '/USD', 0.0005, 0.000495, 0.000505, 0.1, 0.15 FROM public.platform_tokens WHERE symbol = 'QAQI';

INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, last_price, bid_price, ask_price, maker_fee_percent, taker_fee_percent)
SELECT id, 'USD', symbol || '/USD', 0.0008, 0.000792, 0.000808, 0.1, 0.15 FROM public.platform_tokens WHERE symbol = 'AIQTP';

-- Seed initial price feeds tied to BTC value
INSERT INTO public.token_price_feeds (token_id, base_currency, price, market_cap, source)
SELECT id, 'USD', 0.001, total_supply * 0.001, 'internal' FROM public.platform_tokens WHERE symbol = 'QTC';

INSERT INTO public.token_price_feeds (token_id, base_currency, price, market_cap, source)
SELECT id, 'BTC', 0.00000001, total_supply * 0.00000001, 'internal' FROM public.platform_tokens WHERE symbol = 'QTC';

-- Create triggers
CREATE TRIGGER update_exchange_pairs_updated_at BEFORE UPDATE ON public.exchange_pairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exchange_orders_updated_at BEFORE UPDATE ON public.exchange_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exchange_liquidity_pools_updated_at BEFORE UPDATE ON public.exchange_liquidity_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exchange_balances_updated_at BEFORE UPDATE ON public.exchange_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update token price
CREATE OR REPLACE FUNCTION public.update_token_price(
  p_token_id UUID,
  p_base_currency VARCHAR,
  p_new_price DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_price DECIMAL;
BEGIN
  -- Get current price
  SELECT price INTO v_old_price FROM public.token_price_feeds 
  WHERE token_id = p_token_id AND base_currency = p_base_currency;
  
  -- Update or insert price feed
  INSERT INTO public.token_price_feeds (token_id, base_currency, price, price_24h_ago, last_updated)
  VALUES (p_token_id, p_base_currency, p_new_price, v_old_price, now())
  ON CONFLICT (token_id, base_currency) DO UPDATE SET
    price = p_new_price,
    change_24h_percent = CASE 
      WHEN token_price_feeds.price_24h_ago > 0 
      THEN ((p_new_price - token_price_feeds.price_24h_ago) / token_price_feeds.price_24h_ago) * 100
      ELSE 0
    END,
    last_updated = now();
  
  -- Update exchange pair prices
  UPDATE public.exchange_pairs ep
  SET last_price = p_new_price,
      bid_price = p_new_price * 0.999, -- 0.1% spread
      ask_price = p_new_price * 1.001
  FROM public.platform_tokens pt
  WHERE ep.base_token_id = pt.id 
    AND pt.id = p_token_id 
    AND ep.quote_currency = p_base_currency;
END;
$$;