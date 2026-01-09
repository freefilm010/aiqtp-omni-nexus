-- Multi-Chain Token Factory System

-- Token definitions across blockchains
CREATE TABLE public.platform_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  contract_address VARCHAR(100),
  total_supply DECIMAL(30,8) NOT NULL DEFAULT 0,
  circulating_supply DECIMAL(30,8) NOT NULL DEFAULT 0,
  treasury_supply DECIMAL(30,8) NOT NULL DEFAULT 0,
  faucet_pool DECIMAL(30,8) NOT NULL DEFAULT 0,
  decimals INTEGER NOT NULL DEFAULT 18,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_native BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Faucet claims tracking
CREATE TABLE public.faucet_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES public.platform_tokens(id),
  user_id UUID NOT NULL,
  wallet_address VARCHAR(100) NOT NULL,
  amount DECIMAL(30,8) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  tx_hash VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue distribution tracking (5% split)
CREATE TABLE public.token_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES public.platform_tokens(id),
  source_type VARCHAR(50) NOT NULL,
  gross_amount DECIMAL(30,8) NOT NULL,
  platform_share DECIMAL(30,8) NOT NULL,
  distributed_at TIMESTAMP WITH TIME ZONE,
  distribution_status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contests and giveaways
CREATE TABLE public.token_contests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  token_id UUID REFERENCES public.platform_tokens(id),
  prize_pool DECIMAL(30,8) NOT NULL,
  prize_distribution JSONB NOT NULL,
  contest_type VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rules JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  max_participants INTEGER,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contest participants and winners
CREATE TABLE public.contest_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID REFERENCES public.token_contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score DECIMAL(20,4) DEFAULT 0,
  rank INTEGER,
  prize_won DECIMAL(30,8),
  prize_paid BOOLEAN DEFAULT false,
  entry_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

-- Influencer program
CREATE TABLE public.influencer_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  platform VARCHAR(50) NOT NULL,
  handle VARCHAR(100) NOT NULL,
  follower_count INTEGER,
  tier VARCHAR(20) DEFAULT 'bronze',
  referral_code VARCHAR(20) UNIQUE,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(30,8) DEFAULT 0,
  tokens_allocated JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  contract_terms JSONB,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Influencer referral tracking
CREATE TABLE public.influencer_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID REFERENCES public.influencer_partners(id),
  referred_user_id UUID NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  signup_completed BOOLEAN DEFAULT false,
  first_trade_completed BOOLEAN DEFAULT false,
  commission_earned DECIMAL(30,8) DEFAULT 0,
  tokens_gifted JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gift/airdrop campaigns
CREATE TABLE public.token_airdrops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  token_id UUID REFERENCES public.platform_tokens(id),
  total_amount DECIMAL(30,8) NOT NULL,
  amount_per_user DECIMAL(30,8) NOT NULL,
  eligibility_criteria JSONB,
  recipient_list UUID[],
  distribution_type VARCHAR(50) NOT NULL,
  max_recipients INTEGER,
  claimed_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faucet_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_airdrops ENABLE ROW LEVEL SECURITY;

-- RLS Policies (correct signature: has_role(_user_id, _role))
CREATE POLICY "Anyone can view active tokens" ON public.platform_tokens FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tokens" ON public.platform_tokens FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their claims" ON public.faucet_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create claims" ON public.faucet_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage claims" ON public.faucet_claims FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage revenue" ON public.token_revenue FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active contests" ON public.token_contests FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage contests" ON public.token_contests FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their participation" ON public.contest_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join contests" ON public.contest_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage participants" ON public.contest_participants FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Influencers can view their data" ON public.influencer_partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage influencers" ON public.influencer_partners FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage referrals" ON public.influencer_referrals FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active airdrops" ON public.token_airdrops FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage airdrops" ON public.token_airdrops FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed initial tokens including $QTC
INSERT INTO public.platform_tokens (symbol, name, chain, total_supply, treasury_supply, faucet_pool, is_native, is_active)
VALUES 
  ('QTC', 'Quantum Time Crystal', 'qtc-mainnet', 1000000000, 900000000, 50000000, true, true),
  ('QAQI', 'QAQI Intelligence Token', 'ethereum', 500000000, 450000000, 25000000, false, true),
  ('AIQTP', 'AIQTP Platform Token', 'polygon', 750000000, 675000000, 37500000, false, true);

-- Create triggers for updated_at
CREATE TRIGGER update_platform_tokens_updated_at BEFORE UPDATE ON public.platform_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_token_contests_updated_at BEFORE UPDATE ON public.token_contests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contest_participants_updated_at BEFORE UPDATE ON public.contest_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_influencer_partners_updated_at BEFORE UPDATE ON public.influencer_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();