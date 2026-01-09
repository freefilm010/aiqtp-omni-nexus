-- Operator-Based Accounting System

-- Territories (groupings of operators for metrics)
CREATE TABLE public.operator_territories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  territory_type VARCHAR(50) NOT NULL, -- affiliates, trading_bots, services, platform_fees
  total_revenue DECIMAL(30,8) DEFAULT 0,
  total_expenses DECIMAL(30,8) DEFAULT 0,
  active_operators INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Operators (core entity - bots, affiliates, services, fee collectors)
CREATE TABLE public.operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  territory_id UUID REFERENCES public.operator_territories(id),
  operator_type VARCHAR(50) NOT NULL, -- trading_bot, affiliate, service, fee_collector, reinvestment_pool
  name VARCHAR(200) NOT NULL,
  description TEXT,
  parent_operator_id UUID REFERENCES public.operators(id), -- for clones
  is_clone BOOLEAN DEFAULT false,
  is_admin_owned BOOLEAN DEFAULT false,
  owner_user_id UUID,
  linked_strategy_id UUID REFERENCES public.ai_strategies(id),
  linked_rental_id UUID REFERENCES public.strategy_rentals(id),
  linked_influencer_id UUID REFERENCES public.influencer_partners(id),
  commission_rate DECIMAL(5,2) DEFAULT 0, -- percentage this operator earns
  reinvestment_rate DECIMAL(5,2) DEFAULT 0, -- percentage auto-reinvested
  status VARCHAR(20) DEFAULT 'active', -- active, paused, terminated
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Operator Wallets (each operator can have multiple currency wallets)
CREATE TABLE public.operator_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  currency VARCHAR(20) NOT NULL, -- QTC, USD, BTC, ETH, etc
  balance DECIMAL(30,8) DEFAULT 0,
  available_balance DECIMAL(30,8) DEFAULT 0,
  locked_balance DECIMAL(30,8) DEFAULT 0,
  total_deposited DECIMAL(30,8) DEFAULT 0,
  total_withdrawn DECIMAL(30,8) DEFAULT 0,
  total_fees_collected DECIMAL(30,8) DEFAULT 0,
  total_fees_paid DECIMAL(30,8) DEFAULT 0,
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(operator_id, currency)
);

-- Operator Transactions (all fund flows between operators)
CREATE TABLE public.operator_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_operator_id UUID REFERENCES public.operators(id),
  to_operator_id UUID REFERENCES public.operators(id),
  from_wallet_id UUID REFERENCES public.operator_wallets(id),
  to_wallet_id UUID REFERENCES public.operator_wallets(id),
  amount DECIMAL(30,8) NOT NULL,
  currency VARCHAR(20) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- fee, rental_income, reinvestment, profit_share, referral_bonus, trade_profit, platform_fee
  reference_type VARCHAR(50), -- rental, trade, referral, subscription
  reference_id UUID, -- ID of the related entity
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bot Clones (track rented bot instances)
CREATE TABLE public.bot_clones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_strategy_id UUID NOT NULL REFERENCES public.ai_strategies(id),
  clone_operator_id UUID NOT NULL REFERENCES public.operators(id),
  renter_user_id UUID NOT NULL,
  rental_id UUID REFERENCES public.strategy_rentals(id),
  clone_name VARCHAR(200),
  configuration JSONB, -- cloned settings
  is_active BOOLEAN DEFAULT true,
  total_trades INTEGER DEFAULT 0,
  total_profit DECIMAL(30,8) DEFAULT 0,
  total_fees_generated DECIMAL(30,8) DEFAULT 0,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operator_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_clones ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only for operator management)
CREATE POLICY "Admins can manage territories" ON public.operator_territories 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage operators" ON public.operators 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their operators" ON public.operators 
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can manage operator wallets" ON public.operator_wallets 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage transactions" ON public.operator_transactions 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage bot clones" ON public.bot_clones 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their bot clones" ON public.bot_clones 
  FOR SELECT USING (auth.uid() = renter_user_id);

-- Seed default territories
INSERT INTO public.operator_territories (name, description, territory_type) VALUES
  ('Affiliate Network', 'Affiliates generating new user accounts and referrals', 'affiliates'),
  ('Trading Bot Fleet', 'Active rental trading bots generating fees', 'trading_bots'),
  ('Platform Services', 'Platform fee collectors and services', 'services'),
  ('Reinvestment Pools', 'Auto-reinvestment operators', 'reinvestment');

-- Seed master platform operator
INSERT INTO public.operators (name, description, operator_type, is_admin_owned, status)
VALUES ('AIQTP Platform', 'Master platform operator collecting all platform fees', 'fee_collector', true, 'active');

-- Create trigger for updated_at
CREATE TRIGGER update_operator_territories_updated_at BEFORE UPDATE ON public.operator_territories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operator_wallets_updated_at BEFORE UPDATE ON public.operator_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bot_clones_updated_at BEFORE UPDATE ON public.bot_clones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create operator with wallet
CREATE OR REPLACE FUNCTION public.create_operator_with_wallet(
  p_territory_id UUID,
  p_operator_type VARCHAR,
  p_name VARCHAR,
  p_owner_user_id UUID DEFAULT NULL,
  p_is_admin_owned BOOLEAN DEFAULT false,
  p_currencies VARCHAR[] DEFAULT ARRAY['QTC', 'USD']
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_operator_id UUID;
  v_currency VARCHAR;
BEGIN
  -- Create operator
  INSERT INTO public.operators (territory_id, operator_type, name, owner_user_id, is_admin_owned)
  VALUES (p_territory_id, p_operator_type, p_name, p_owner_user_id, p_is_admin_owned)
  RETURNING id INTO v_operator_id;
  
  -- Create wallets for each currency
  FOREACH v_currency IN ARRAY p_currencies LOOP
    INSERT INTO public.operator_wallets (operator_id, currency)
    VALUES (v_operator_id, v_currency);
  END LOOP;
  
  -- Update territory operator count
  UPDATE public.operator_territories 
  SET active_operators = active_operators + 1
  WHERE id = p_territory_id;
  
  RETURN v_operator_id;
END;
$$;

-- Function to record operator transaction
CREATE OR REPLACE FUNCTION public.record_operator_transaction(
  p_from_operator_id UUID,
  p_to_operator_id UUID,
  p_amount DECIMAL,
  p_currency VARCHAR,
  p_transaction_type VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_reference_type VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_from_wallet_id UUID;
  v_to_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get wallet IDs
  IF p_from_operator_id IS NOT NULL THEN
    SELECT id INTO v_from_wallet_id FROM public.operator_wallets 
    WHERE operator_id = p_from_operator_id AND currency = p_currency;
    
    -- Deduct from source wallet
    UPDATE public.operator_wallets 
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        total_withdrawn = total_withdrawn + p_amount,
        last_transaction_at = now()
    WHERE id = v_from_wallet_id;
  END IF;
  
  IF p_to_operator_id IS NOT NULL THEN
    SELECT id INTO v_to_wallet_id FROM public.operator_wallets 
    WHERE operator_id = p_to_operator_id AND currency = p_currency;
    
    -- Add to destination wallet
    UPDATE public.operator_wallets 
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount,
        total_deposited = total_deposited + p_amount,
        last_transaction_at = now()
    WHERE id = v_to_wallet_id;
    
    -- Track fees if applicable
    IF p_transaction_type IN ('fee', 'platform_fee', 'rental_income') THEN
      UPDATE public.operator_wallets 
      SET total_fees_collected = total_fees_collected + p_amount
      WHERE id = v_to_wallet_id;
    END IF;
  END IF;
  
  -- Record transaction
  INSERT INTO public.operator_transactions (
    from_operator_id, to_operator_id, from_wallet_id, to_wallet_id,
    amount, currency, transaction_type, description, reference_type, reference_id
  ) VALUES (
    p_from_operator_id, p_to_operator_id, v_from_wallet_id, v_to_wallet_id,
    p_amount, p_currency, p_transaction_type, p_description, p_reference_type, p_reference_id
  )
  RETURNING id INTO v_transaction_id;
  
  -- Update territory revenue
  IF p_to_operator_id IS NOT NULL THEN
    UPDATE public.operator_territories t
    SET total_revenue = total_revenue + p_amount
    FROM public.operators o
    WHERE o.id = p_to_operator_id AND t.id = o.territory_id;
  END IF;
  
  RETURN v_transaction_id;
END;
$$;