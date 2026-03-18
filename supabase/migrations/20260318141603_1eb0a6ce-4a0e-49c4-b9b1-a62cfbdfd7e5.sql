-- Add user_id to auto_nft_generations for ownership tracking
ALTER TABLE public.auto_nft_generations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user queries
CREATE INDEX idx_auto_nft_generations_user_id ON public.auto_nft_generations(user_id);

-- Create user_nfts table for manually created NFTs
CREATE TABLE public.user_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  royalty_percent NUMERIC DEFAULT 5,
  supply INTEGER DEFAULT 1,
  attributes JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  mint_status TEXT DEFAULT 'draft',
  list_price NUMERIC,
  currency TEXT DEFAULT 'ETH',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;

-- Users can see their own NFTs
CREATE POLICY "Users can view own NFTs" ON public.user_nfts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own NFTs
CREATE POLICY "Users can create NFTs" ON public.user_nfts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own NFTs
CREATE POLICY "Users can update own NFTs" ON public.user_nfts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own NFTs
CREATE POLICY "Users can delete own NFTs" ON public.user_nfts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admins can see all NFTs
CREATE POLICY "Admins can view all NFTs" ON public.user_nfts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create QTC token balances table for real circulation
CREATE TABLE public.token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token_id UUID REFERENCES public.platform_tokens(id) NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  locked_balance NUMERIC NOT NULL DEFAULT 0,
  last_mined_at TIMESTAMPTZ,
  total_mined NUMERIC NOT NULL DEFAULT 0,
  total_received NUMERIC NOT NULL DEFAULT 0,
  total_sent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token_id)
);

ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balances" ON public.token_balances
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all balances" ON public.token_balances
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- System inserts handled via functions
CREATE POLICY "System can insert balances" ON public.token_balances
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update own balances" ON public.token_balances
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Create automation_templates table
CREATE TABLE public.automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  schedule TEXT,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can see system templates
CREATE POLICY "Anyone can view system templates" ON public.automation_templates
  FOR SELECT TO authenticated USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can manage own templates" ON public.automation_templates
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all templates" ON public.automation_templates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_user_nfts_updated_at BEFORE UPDATE ON public.user_nfts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_token_balances_updated_at BEFORE UPDATE ON public.token_balances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_automation_templates_updated_at BEFORE UPDATE ON public.automation_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();