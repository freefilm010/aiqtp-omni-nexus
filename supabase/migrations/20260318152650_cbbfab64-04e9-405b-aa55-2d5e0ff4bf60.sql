
-- Community Polls
CREATE TABLE public.community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  poll_type TEXT NOT NULL DEFAULT 'multiple_choice',
  ticker TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  total_votes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.community_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  vote_count INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE public.community_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.community_poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Predictions
CREATE TABLE public.community_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  prediction_type TEXT NOT NULL DEFAULT 'price_target',
  direction TEXT NOT NULL DEFAULT 'bullish',
  target_price NUMERIC,
  target_date DATE,
  confidence INT DEFAULT 50,
  reasoning TEXT,
  outcome TEXT,
  outcome_resolved_at TIMESTAMPTZ,
  accuracy_score NUMERIC,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User badges/rewards
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  description TEXT,
  points INT DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Ad placements
CREATE TABLE public.ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name TEXT NOT NULL,
  advertiser_name TEXT,
  ad_content JSONB,
  impression_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  cpm_rate NUMERIC DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Data exports for monetization
CREATE TABLE public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL,
  data_category TEXT NOT NULL,
  record_count INT DEFAULT 0,
  file_url TEXT,
  buyer_info JSONB,
  price_usd NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Broadcast content queue
CREATE TABLE public.broadcast_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audio_url TEXT,
  visual_data JSONB,
  source TEXT DEFAULT 'ai_generated',
  category TEXT DEFAULT 'market_update',
  is_published BOOLEAN DEFAULT false,
  priority INT DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_content ENABLE ROW LEVEL SECURITY;

-- Public read for community content
CREATE POLICY "Anyone can read polls" ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "Anyone can read poll options" ON public.community_poll_options FOR SELECT USING (true);
CREATE POLICY "Anyone can read predictions" ON public.community_predictions FOR SELECT USING (true);
CREATE POLICY "Anyone can read badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Anyone can read ads" ON public.ad_placements FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read broadcasts" ON public.broadcast_content FOR SELECT USING (is_published = true);

-- Auth users can create
CREATE POLICY "Auth users create polls" ON public.community_polls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users create poll options" ON public.community_poll_options FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.community_polls WHERE id = poll_id AND user_id = auth.uid()));
CREATE POLICY "Auth users vote" ON public.community_poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users create predictions" ON public.community_predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own votes" ON public.community_poll_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admin for ads/exports/broadcasts
CREATE POLICY "Admin manage ads" ON public.ad_placements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage exports" ON public.data_exports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage broadcasts" ON public.broadcast_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_content;
