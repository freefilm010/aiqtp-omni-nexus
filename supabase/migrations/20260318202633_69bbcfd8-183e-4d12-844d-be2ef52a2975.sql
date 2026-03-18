
-- Rewards budget cap (10% of annual profit fail-safe)
CREATE TABLE public.rewards_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL UNIQUE,
  total_platform_profit DECIMAL(16,2) NOT NULL DEFAULT 0,
  max_rewards_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- 10% cap
  max_rewards_budget DECIMAL(16,2) GENERATED ALWAYS AS (total_platform_profit * max_rewards_percent / 100) STORED,
  total_allocated DECIMAL(16,2) NOT NULL DEFAULT 0,
  total_distributed DECIMAL(16,2) NOT NULL DEFAULT 0,
  remaining_budget DECIMAL(16,2) GENERATED ALWAYS AS ((total_platform_profit * max_rewards_percent / 100) - total_distributed) STORED,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rewards catalog (merch, trips, swag, experiences)
CREATE TABLE public.rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('merch', 'swag', 'trip', 'experience', 'crypto', 'qtc_tokens', 'platform_credit', 'nft', 'hardware', 'vehicle', 'home')),
  subcategory TEXT, -- e.g. 'hoodie', 'cap', 'resort', 'conference'
  value_usd DECIMAL(16,2) NOT NULL DEFAULT 0,
  qtc_price DECIMAL(16,4), -- price in $QTC tokens
  points_price INTEGER, -- price in platform points
  image_url TEXT,
  tier_required TEXT DEFAULT 'any', -- 'any', 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  stock_quantity INTEGER, -- null = unlimited
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_seasonal BOOLEAN NOT NULL DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reward redemptions
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_id UUID REFERENCES public.rewards_catalog(id) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qtc_tokens', 'points', 'contest_win', 'giveaway', 'achievement')),
  amount_paid DECIMAL(16,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'QTC',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB,
  tracking_number TEXT,
  notes TEXT,
  budget_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Budget guard function — prevents over-allocation
CREATE OR REPLACE FUNCTION public.check_rewards_budget()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_budget RECORD;
  v_reward_value DECIMAL;
BEGIN
  -- Get reward value
  SELECT value_usd INTO v_reward_value FROM rewards_catalog WHERE id = NEW.reward_id;
  
  -- Get current year budget
  SELECT * INTO v_budget FROM rewards_budget WHERE fiscal_year = NEW.budget_year;
  
  -- If no budget record exists, deny
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No rewards budget configured for year %', NEW.budget_year;
  END IF;
  
  -- If budget is locked, deny
  IF v_budget.is_locked THEN
    RAISE EXCEPTION 'Rewards budget is locked for year %', NEW.budget_year;
  END IF;
  
  -- Check if distribution would exceed 10% cap
  IF (v_budget.total_distributed + v_reward_value) > v_budget.max_rewards_budget THEN
    RAISE EXCEPTION 'Reward exceeds annual budget cap (10%% of profits). Remaining: $%', 
      ROUND(v_budget.remaining_budget, 2);
  END IF;
  
  -- Update distributed total
  UPDATE rewards_budget 
  SET total_distributed = total_distributed + v_reward_value,
      updated_at = now()
  WHERE fiscal_year = NEW.budget_year;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_rewards_budget
  BEFORE INSERT ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.check_rewards_budget();

-- RLS
ALTER TABLE public.rewards_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Budget: admin only
CREATE POLICY "Admins manage budget" ON public.rewards_budget FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read budget" ON public.rewards_budget FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Catalog: public read
CREATE POLICY "Anyone can view rewards" ON public.rewards_catalog FOR SELECT USING (true);
CREATE POLICY "Anon can view rewards" ON public.rewards_catalog FOR SELECT TO anon USING (true);
CREATE POLICY "Admins manage catalog" ON public.rewards_catalog FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Redemptions: users see own
CREATE POLICY "Users see own redemptions" ON public.reward_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create redemptions" ON public.reward_redemptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage redemptions" ON public.reward_redemptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
