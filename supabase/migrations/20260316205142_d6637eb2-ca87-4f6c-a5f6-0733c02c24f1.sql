
-- Marketplace category fees (admin-configurable)
CREATE TABLE public.marketplace_category_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  display_name text NOT NULL,
  finder_fee_percent numeric(5,2) NOT NULL DEFAULT 2.00,
  pass_through_fee_percent numeric(5,2) NOT NULL DEFAULT 2.00,
  min_deal_size numeric(20,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_category_fees ENABLE ROW LEVEL SECURITY;

-- Anyone can read fees (public info)
CREATE POLICY "Anyone can view marketplace fees" ON public.marketplace_category_fees
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage fees" ON public.marketplace_category_fees
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Marketplace deals/listings
CREATE TABLE public.marketplace_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  listing_price numeric(20,2),
  currency text DEFAULT 'USD',
  seller_user_id uuid REFERENCES auth.users(id),
  buyer_user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'listed' CHECK (status IN ('listed','pending','in_escrow','completed','cancelled')),
  finder_fee_amount numeric(20,2) DEFAULT 0,
  pass_through_fee_amount numeric(20,2) DEFAULT 0,
  total_platform_fee numeric(20,2) DEFAULT 0,
  external_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_deals ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view active listings
CREATE POLICY "Users can view active deals" ON public.marketplace_deals
  FOR SELECT TO authenticated USING (status = 'listed' OR seller_user_id = auth.uid() OR buyer_user_id = auth.uid());

-- Users can create listings
CREATE POLICY "Users can create deals" ON public.marketplace_deals
  FOR INSERT TO authenticated WITH CHECK (seller_user_id = auth.uid());

-- Owners and admins can update
CREATE POLICY "Owners and admins can update deals" ON public.marketplace_deals
  FOR UPDATE TO authenticated USING (seller_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Insert competitive default fees
INSERT INTO public.marketplace_category_fees (category, display_name, finder_fee_percent, pass_through_fee_percent) VALUES
  ('real_estate', 'Real Estate', 3.00, 2.00),
  ('precious_metals', 'Precious Metals', 1.50, 1.50),
  ('collectibles', 'Collectibles', 4.00, 2.50),
  ('art_nfts', 'Art & NFTs', 5.00, 3.00),
  ('virtual_assets', 'Virtual Assets', 3.50, 2.00),
  ('luxury_goods', 'Luxury Goods', 4.50, 2.50),
  ('financial_products', 'Financial Products', 2.00, 1.50),
  ('cryptocurrency', 'Cryptocurrency', 1.00, 0.50);

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_category_fees_updated_at
  BEFORE UPDATE ON public.marketplace_category_fees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_marketplace_deals_updated_at
  BEFORE UPDATE ON public.marketplace_deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
