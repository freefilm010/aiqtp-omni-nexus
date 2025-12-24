-- =============================================
-- PLATFORM MULTI-ASSET WALLET SYSTEM
-- =============================================

-- Platform wallets for fiat, crypto, NFTs, and all asset types
CREATE TABLE public.platform_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('fiat', 'crypto', 'nft', 'commodity', 'real_estate', 'collectible')),
  currency TEXT NOT NULL,
  balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  available_balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  locked_balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  wallet_address TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue/profit tracking from all sources
CREATE TABLE public.platform_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('finder_fee', 'commission', 'subscription', 'trading_fee', 'spread', 'staking_yield', 'investment_return', 'api_fee', 'premium_feature')),
  source_category TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  wallet_id UUID REFERENCES public.platform_wallets(id),
  deal_id UUID,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'distributed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automated profit distribution rules
CREATE TABLE public.profit_distribution_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  distribution_type TEXT NOT NULL CHECK (distribution_type IN ('reinvest', 'reserve', 'withdraw', 'compound')),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  target_wallet_id UUID REFERENCES public.platform_wallets(id),
  is_active BOOLEAN DEFAULT true,
  min_threshold DECIMAL(20,8) DEFAULT 0,
  execution_frequency TEXT DEFAULT 'immediate' CHECK (execution_frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'monthly')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automated distribution execution log
CREATE TABLE public.profit_distribution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.profit_distribution_rules(id),
  revenue_id UUID REFERENCES public.platform_revenue(id),
  from_wallet_id UUID REFERENCES public.platform_wallets(id),
  to_wallet_id UUID REFERENCES public.platform_wallets(id),
  amount DECIMAL(20,8) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Platform investment positions (auto-invest from profits)
CREATE TABLE public.platform_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.platform_wallets(id),
  asset_symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'etf', 'bond', 'commodity', 'real_estate', 'nft')),
  quantity DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  current_price DECIMAL(20,8),
  unrealized_pnl DECIMAL(20,8) DEFAULT 0,
  realized_pnl DECIMAL(20,8) DEFAULT 0,
  strategy TEXT DEFAULT 'growth',
  is_auto_managed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- NFT holdings for platform treasury
CREATE TABLE public.platform_nft_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.platform_wallets(id),
  collection_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  token_uri TEXT,
  acquisition_price DECIMAL(20,8),
  current_valuation DECIMAL(20,8),
  currency TEXT DEFAULT 'ETH',
  chain TEXT DEFAULT 'ethereum',
  metadata JSONB DEFAULT '{}',
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.platform_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_distribution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_distribution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_nft_holdings ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies (platform treasury management)
CREATE POLICY "Admins can manage platform wallets"
  ON public.platform_wallets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage platform revenue"
  ON public.platform_revenue FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage distribution rules"
  ON public.profit_distribution_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view distribution logs"
  ON public.profit_distribution_log FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage platform investments"
  ON public.platform_investments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage NFT holdings"
  ON public.platform_nft_holdings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_platform_wallets_updated_at
  BEFORE UPDATE ON public.platform_wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_distribution_rules_updated_at
  BEFORE UPDATE ON public.profit_distribution_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_platform_investments_updated_at
  BEFORE UPDATE ON public.platform_investments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_platform_nft_holdings_updated_at
  BEFORE UPDATE ON public.platform_nft_holdings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX idx_platform_wallets_type ON public.platform_wallets(wallet_type);
CREATE INDEX idx_platform_revenue_source ON public.platform_revenue(source_type);
CREATE INDEX idx_platform_revenue_status ON public.platform_revenue(status);
CREATE INDEX idx_distribution_rules_active ON public.profit_distribution_rules(is_active);
CREATE INDEX idx_platform_investments_wallet ON public.platform_investments(wallet_id);

-- Function to process and distribute profits automatically
CREATE OR REPLACE FUNCTION public.process_profit_distribution(p_revenue_id UUID)
RETURNS VOID AS $$
DECLARE
  v_revenue RECORD;
  v_rule RECORD;
  v_distribution_amount DECIMAL(20,8);
BEGIN
  -- Get the revenue record
  SELECT * INTO v_revenue FROM public.platform_revenue WHERE id = p_revenue_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Apply each active distribution rule for this source type
  FOR v_rule IN 
    SELECT * FROM public.profit_distribution_rules 
    WHERE source_type = v_revenue.source_type 
    AND is_active = true
    AND v_revenue.amount >= min_threshold
  LOOP
    v_distribution_amount := v_revenue.amount * (v_rule.percentage / 100);
    
    -- Log the distribution
    INSERT INTO public.profit_distribution_log (
      rule_id, revenue_id, from_wallet_id, to_wallet_id, amount, currency
    ) VALUES (
      v_rule.id, p_revenue_id, v_revenue.wallet_id, v_rule.target_wallet_id, v_distribution_amount, v_revenue.currency
    );
    
    -- Update target wallet balance
    IF v_rule.target_wallet_id IS NOT NULL THEN
      UPDATE public.platform_wallets 
      SET balance = balance + v_distribution_amount,
          available_balance = available_balance + v_distribution_amount
      WHERE id = v_rule.target_wallet_id;
    END IF;
  END LOOP;
  
  -- Mark revenue as distributed
  UPDATE public.platform_revenue 
  SET status = 'distributed', processed_at = now()
  WHERE id = p_revenue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert default platform wallets
INSERT INTO public.platform_wallets (wallet_type, currency, balance) VALUES
  ('fiat', 'USD', 0),
  ('fiat', 'EUR', 0),
  ('crypto', 'BTC', 0),
  ('crypto', 'ETH', 0),
  ('crypto', 'USDC', 0),
  ('nft', 'ETH', 0),
  ('commodity', 'GOLD', 0),
  ('real_estate', 'USD', 0);