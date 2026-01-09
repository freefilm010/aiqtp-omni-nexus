-- Create comprehensive market data tables for real trading

-- Table to store all available trading pairs from CoinGecko (5000+)
CREATE TABLE public.market_coins (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  platforms JSONB DEFAULT '{}',
  market_cap_rank INTEGER,
  thumb_url TEXT,
  large_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Real-time price data for all tracked coins
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL REFERENCES public.market_coins(id) ON DELETE CASCADE,
  price_usd DECIMAL(30, 18) NOT NULL,
  price_btc DECIMAL(30, 18),
  price_eth DECIMAL(30, 18),
  market_cap DECIMAL(30, 2),
  market_cap_rank INTEGER,
  fully_diluted_valuation DECIMAL(30, 2),
  total_volume DECIMAL(30, 2),
  high_24h DECIMAL(30, 18),
  low_24h DECIMAL(30, 18),
  price_change_24h DECIMAL(30, 18),
  price_change_percentage_24h DECIMAL(10, 4),
  price_change_percentage_7d DECIMAL(10, 4),
  price_change_percentage_30d DECIMAL(10, 4),
  market_cap_change_24h DECIMAL(30, 2),
  circulating_supply DECIMAL(30, 8),
  total_supply DECIMAL(30, 8),
  max_supply DECIMAL(30, 8),
  ath DECIMAL(30, 18),
  ath_change_percentage DECIMAL(10, 4),
  ath_date TIMESTAMPTZ,
  atl DECIMAL(30, 18),
  atl_change_percentage DECIMAL(10, 4),
  atl_date TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coin_id)
);

-- OHLCV historical data for charting
CREATE TABLE public.market_ohlcv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_id TEXT NOT NULL REFERENCES public.market_coins(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL, -- '1m', '5m', '15m', '1h', '4h', '1d', '1w'
  open_time TIMESTAMPTZ NOT NULL,
  open DECIMAL(30, 18) NOT NULL,
  high DECIMAL(30, 18) NOT NULL,
  low DECIMAL(30, 18) NOT NULL,
  close DECIMAL(30, 18) NOT NULL,
  volume DECIMAL(30, 8),
  close_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coin_id, timeframe, open_time)
);

-- Solana-specific token data
CREATE TABLE public.solana_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  decimals INTEGER DEFAULT 9,
  logo_uri TEXT,
  coingecko_id TEXT REFERENCES public.market_coins(id),
  is_verified BOOLEAN DEFAULT false,
  is_platform_token BOOLEAN DEFAULT false,
  total_supply DECIMAL(30, 8),
  holder_count INTEGER,
  daily_volume DECIMAL(30, 2),
  price_usd DECIMAL(30, 18),
  price_change_24h DECIMAL(10, 4),
  liquidity_usd DECIMAL(30, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Solana wallet tracking for platform operations
CREATE TABLE public.solana_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_type TEXT NOT NULL, -- 'treasury', 'operator', 'user', 'faucet', 'fee_collector'
  label TEXT,
  owner_user_id UUID,
  operator_id UUID REFERENCES public.operators(id),
  encrypted_private_key TEXT, -- Encrypted for platform-controlled wallets
  balance_sol DECIMAL(20, 9) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Solana token balances per wallet
CREATE TABLE public.solana_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.solana_wallets(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.solana_tokens(id) ON DELETE CASCADE,
  balance DECIMAL(30, 18) DEFAULT 0,
  value_usd DECIMAL(20, 2),
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wallet_id, token_id)
);

-- Solana transactions log
CREATE TABLE public.solana_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature TEXT UNIQUE NOT NULL,
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  token_mint TEXT, -- NULL for SOL transfers
  amount DECIMAL(30, 18) NOT NULL,
  fee_lamports BIGINT,
  slot BIGINT,
  block_time TIMESTAMPTZ,
  status TEXT DEFAULT 'confirmed', -- 'pending', 'confirmed', 'finalized', 'failed'
  tx_type TEXT NOT NULL, -- 'transfer', 'swap', 'stake', 'unstake', 'create_token', 'mint', 'burn'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DEX trading pairs with real liquidity data
CREATE TABLE public.dex_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL DEFAULT 'solana',
  dex_name TEXT NOT NULL, -- 'raydium', 'orca', 'jupiter', 'uniswap', 'pancakeswap'
  pair_address TEXT UNIQUE NOT NULL,
  base_token_address TEXT NOT NULL,
  quote_token_address TEXT NOT NULL,
  base_symbol TEXT NOT NULL,
  quote_symbol TEXT NOT NULL,
  price DECIMAL(30, 18),
  price_usd DECIMAL(30, 18),
  liquidity_usd DECIMAL(20, 2),
  volume_24h DECIMAL(20, 2),
  price_change_24h DECIMAL(10, 4),
  fee_percent DECIMAL(5, 4),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Market data sync logs
CREATE TABLE public.market_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'coins_list', 'prices', 'ohlcv', 'dex_pairs', 'solana_tokens'
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_market_prices_coin_id ON public.market_prices(coin_id);
CREATE INDEX idx_market_prices_market_cap_rank ON public.market_prices(market_cap_rank);
CREATE INDEX idx_market_ohlcv_coin_time ON public.market_ohlcv(coin_id, timeframe, open_time DESC);
CREATE INDEX idx_solana_tokens_symbol ON public.solana_tokens(symbol);
CREATE INDEX idx_solana_tokens_mint ON public.solana_tokens(mint_address);
CREATE INDEX idx_solana_wallets_type ON public.solana_wallets(wallet_type);
CREATE INDEX idx_solana_transactions_wallet ON public.solana_transactions(from_wallet);
CREATE INDEX idx_dex_pairs_chain_dex ON public.dex_pairs(chain, dex_name);
CREATE INDEX idx_dex_pairs_volume ON public.dex_pairs(volume_24h DESC);

-- Enable RLS
ALTER TABLE public.market_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_ohlcv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solana_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dex_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_sync_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for market data
CREATE POLICY "Anyone can view market coins" ON public.market_coins FOR SELECT USING (true);
CREATE POLICY "Anyone can view market prices" ON public.market_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can view market ohlcv" ON public.market_ohlcv FOR SELECT USING (true);
CREATE POLICY "Anyone can view solana tokens" ON public.solana_tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can view dex pairs" ON public.dex_pairs FOR SELECT USING (true);

-- Users can view their own wallets, admins can view all
CREATE POLICY "Users view own solana wallets" ON public.solana_wallets 
  FOR SELECT USING (owner_user_id = auth.uid() OR wallet_type IN ('treasury', 'faucet'));

CREATE POLICY "Users view own token balances" ON public.solana_token_balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.solana_wallets sw WHERE sw.id = wallet_id AND sw.owner_user_id = auth.uid())
  );

CREATE POLICY "Anyone can view confirmed solana transactions" ON public.solana_transactions
  FOR SELECT USING (status = 'confirmed' OR status = 'finalized');

CREATE POLICY "Anyone can view sync logs" ON public.market_sync_logs FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Service role manages market coins" ON public.market_coins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages market prices" ON public.market_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages market ohlcv" ON public.market_ohlcv FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages solana tokens" ON public.solana_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages solana wallets" ON public.solana_wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages token balances" ON public.solana_token_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages solana transactions" ON public.solana_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages dex pairs" ON public.dex_pairs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages sync logs" ON public.market_sync_logs FOR ALL USING (true) WITH CHECK (true);

-- Function to update prices and sync timestamp
CREATE OR REPLACE FUNCTION public.update_market_price(
  p_coin_id TEXT,
  p_price_usd DECIMAL,
  p_price_btc DECIMAL DEFAULT NULL,
  p_price_eth DECIMAL DEFAULT NULL,
  p_market_cap DECIMAL DEFAULT NULL,
  p_volume DECIMAL DEFAULT NULL,
  p_change_24h DECIMAL DEFAULT NULL,
  p_change_7d DECIMAL DEFAULT NULL,
  p_high_24h DECIMAL DEFAULT NULL,
  p_low_24h DECIMAL DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.market_prices (
    coin_id, price_usd, price_btc, price_eth, market_cap, 
    total_volume, price_change_percentage_24h, price_change_percentage_7d,
    high_24h, low_24h, last_updated
  ) VALUES (
    p_coin_id, p_price_usd, p_price_btc, p_price_eth, p_market_cap,
    p_volume, p_change_24h, p_change_7d, p_high_24h, p_low_24h, now()
  )
  ON CONFLICT (coin_id) DO UPDATE SET
    price_usd = EXCLUDED.price_usd,
    price_btc = COALESCE(EXCLUDED.price_btc, market_prices.price_btc),
    price_eth = COALESCE(EXCLUDED.price_eth, market_prices.price_eth),
    market_cap = COALESCE(EXCLUDED.market_cap, market_prices.market_cap),
    total_volume = COALESCE(EXCLUDED.total_volume, market_prices.total_volume),
    price_change_percentage_24h = COALESCE(EXCLUDED.price_change_percentage_24h, market_prices.price_change_percentage_24h),
    price_change_percentage_7d = COALESCE(EXCLUDED.price_change_percentage_7d, market_prices.price_change_percentage_7d),
    high_24h = COALESCE(EXCLUDED.high_24h, market_prices.high_24h),
    low_24h = COALESCE(EXCLUDED.low_24h, market_prices.low_24h),
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;