-- Fix ERROR-level security findings (rerun without the optional DO/EXECUTE block)

-- 1) influencer_partners: restrict read/write to admin or record owner (user_id)
ALTER TABLE public.influencer_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete influencer_partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins can insert influencer_partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins can manage influencer partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins can manage influencers" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins can update influencer_partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins can view all influencer partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins can view all influencer_partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Influencers can view their data" ON public.influencer_partners;
DROP POLICY IF EXISTS "Users can update own influencer_partner" ON public.influencer_partners;
DROP POLICY IF EXISTS "Users can view own influencer record" ON public.influencer_partners;
DROP POLICY IF EXISTS "Users can view own influencer_partner" ON public.influencer_partners;

CREATE POLICY "Admins or owners can view influencer partners"
ON public.influencer_partners
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Admins or owners can create influencer partners"
ON public.influencer_partners
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Admins or owners can update influencer partners"
ON public.influencer_partners
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Admins or owners can delete influencer partners"
ON public.influencer_partners
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

-- 2) platform_revenue: admin-only, enforce both USING + WITH CHECK
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage platform revenue" ON public.platform_revenue;

CREATE POLICY "Admins can manage platform revenue"
ON public.platform_revenue
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) platform_wallets: admin-only, enforce both USING + WITH CHECK
ALTER TABLE public.platform_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage platform wallets" ON public.platform_wallets;

CREATE POLICY "Admins can manage platform wallets"
ON public.platform_wallets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) quwallet_wallets: remove user direct reads (especially encrypted_private_keys). Keep access via backend functions only.
ALTER TABLE public.quwallet_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.quwallet_wallets;
DROP POLICY IF EXISTS "Users can create own wallets" ON public.quwallet_wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.quwallet_wallets;
DROP POLICY IF EXISTS "Users can view own wallets" ON public.quwallet_wallets;
DROP POLICY IF EXISTS "Users can view own wallets only" ON public.quwallet_wallets;

CREATE POLICY "Admins can manage quwallet wallets"
ON public.quwallet_wallets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) Hardening: update_paper_portfolio must validate user_id parameter matches auth.uid()
CREATE OR REPLACE FUNCTION public.update_paper_portfolio(
  p_user_id uuid,
  p_symbol text,
  p_amount_change numeric,
  p_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_qty numeric;
  v_current_avg numeric;
  v_new_qty numeric;
  v_new_avg numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify another user''s portfolio';
  END IF;

  -- Get current position
  SELECT quantity, avg_price INTO v_current_qty, v_current_avg
  FROM paper_portfolio
  WHERE user_id = p_user_id AND symbol = p_symbol;

  IF NOT FOUND THEN
    -- Create new position
    IF p_amount_change > 0 THEN
      INSERT INTO paper_portfolio (user_id, symbol, quantity, avg_price)
      VALUES (p_user_id, p_symbol, p_amount_change, p_price);
    END IF;
  ELSE
    v_new_qty := v_current_qty + p_amount_change;

    IF v_new_qty <= 0 THEN
      -- Close position
      DELETE FROM paper_portfolio WHERE user_id = p_user_id AND symbol = p_symbol;
    ELSE
      -- Update position
      IF p_amount_change > 0 THEN
        -- Averaging into position
        v_new_avg := ((v_current_qty * v_current_avg) + (p_amount_change * p_price)) / v_new_qty;
      ELSE
        v_new_avg := v_current_avg; -- Keep same avg when selling
      END IF;

      UPDATE paper_portfolio
      SET quantity = v_new_qty, avg_price = v_new_avg, updated_at = now()
      WHERE user_id = p_user_id AND symbol = p_symbol;
    END IF;
  END IF;
END;
$$;