
-- Giveaway campaigns
CREATE TABLE public.giveaway_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended', 'awarded')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  total_prize_pool DECIMAL(16,2) NOT NULL DEFAULT 0,
  funded_amount DECIMAL(16,2) NOT NULL DEFAULT 0,
  funding_status TEXT NOT NULL DEFAULT 'accruing' CHECK (funding_status IN ('accruing', 'partially_funded', 'fully_funded')),
  rules_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prizes within a campaign
CREATE TABLE public.giveaway_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.giveaway_campaigns(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL, -- 'jackpot', 'grand', 'gold', 'silver', 'bronze', 'entry'
  name TEXT NOT NULL,
  description TEXT,
  value_usd DECIMAL(16,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  min_referrals INTEGER NOT NULL DEFAULT 0, -- minimum referrals to qualify
  prize_type TEXT NOT NULL DEFAULT 'credit' CHECK (prize_type IN ('home_credit', 'vehicle_credit', 'cash', 'crypto', 'qtc_tokens', 'platform_credit', 'nft', 'merch')),
  image_url TEXT,
  awarded_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral tracking
CREATE TABLE public.giveaway_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.giveaway_campaigns(id) ON DELETE CASCADE NOT NULL,
  referrer_id UUID NOT NULL, -- user who referred
  referred_id UUID NOT NULL, -- user who signed up
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'qualified', 'disqualified')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, referred_id) -- each referred user counts once per campaign
);

-- User's giveaway entries and tier status
CREATE TABLE public.giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.giveaway_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  verified_referral_count INTEGER NOT NULL DEFAULT 0,
  current_tier TEXT NOT NULL DEFAULT 'entry',
  is_winner BOOLEAN NOT NULL DEFAULT false,
  prize_id UUID REFERENCES public.giveaway_prizes(id),
  prize_awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.giveaway_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

-- Campaigns: public read, admin write
CREATE POLICY "Anyone can view active campaigns" ON public.giveaway_campaigns FOR SELECT USING (true);
CREATE POLICY "Admins manage campaigns" ON public.giveaway_campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Prizes: public read, admin write
CREATE POLICY "Anyone can view prizes" ON public.giveaway_prizes FOR SELECT USING (true);
CREATE POLICY "Admins manage prizes" ON public.giveaway_prizes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Referrals: users see own, admin sees all
CREATE POLICY "Users see own referrals" ON public.giveaway_referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert referrals" ON public.giveaway_referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins manage referrals" ON public.giveaway_referrals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Entries: users see own, public leaderboard fields, admin full
CREATE POLICY "Users see own entries" ON public.giveaway_entries FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create entries" ON public.giveaway_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own entries" ON public.giveaway_entries FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage entries" ON public.giveaway_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public read for campaigns (anon users)
CREATE POLICY "Anon can view campaigns" ON public.giveaway_campaigns FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view prizes" ON public.giveaway_prizes FOR SELECT TO anon USING (true);
