-- Fix RLS for influencer_partners table - restrict to admins and self
DROP POLICY IF EXISTS "Anyone can view influencer_partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "influencer_partners_select_policy" ON public.influencer_partners;
DROP POLICY IF EXISTS "influencer_partners_insert_policy" ON public.influencer_partners;
DROP POLICY IF EXISTS "influencer_partners_update_policy" ON public.influencer_partners;
DROP POLICY IF EXISTS "influencer_partners_delete_policy" ON public.influencer_partners;

-- Admins can view all influencer partners
CREATE POLICY "Admins can view all influencer_partners"
ON public.influencer_partners
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can only view their own influencer partner record
CREATE POLICY "Users can view own influencer_partner"
ON public.influencer_partners
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can insert influencer partners
CREATE POLICY "Admins can insert influencer_partners"
ON public.influencer_partners
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update any influencer partner
CREATE POLICY "Admins can update influencer_partners"
ON public.influencer_partners
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can update their own influencer partner record
CREATE POLICY "Users can update own influencer_partner"
ON public.influencer_partners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Only admins can delete influencer partners
CREATE POLICY "Admins can delete influencer_partners"
ON public.influencer_partners
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix RLS for faucet_claims table - protect IP addresses
DROP POLICY IF EXISTS "Anyone can view faucet_claims" ON public.faucet_claims;
DROP POLICY IF EXISTS "faucet_claims_select_policy" ON public.faucet_claims;
DROP POLICY IF EXISTS "faucet_claims_insert_policy" ON public.faucet_claims;
DROP POLICY IF EXISTS "faucet_claims_update_policy" ON public.faucet_claims;
DROP POLICY IF EXISTS "faucet_claims_delete_policy" ON public.faucet_claims;

-- Admins can view all faucet claims
CREATE POLICY "Admins can view all faucet_claims"
ON public.faucet_claims
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can only view their own faucet claims (by wallet address matching their connected accounts)
CREATE POLICY "Users can view own faucet_claims"
ON public.faucet_claims
FOR SELECT
TO authenticated
USING (
  wallet_address IN (
    SELECT COALESCE((api_key_encrypted)::text, '')
    FROM public.connected_accounts 
    WHERE user_id = auth.uid() AND account_type = 'wallet'
  )
  OR user_id = auth.uid()
);

-- Anyone can insert their own faucet claims (for claiming faucet)
CREATE POLICY "Users can insert own faucet_claims"
ON public.faucet_claims
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Only admins can delete faucet claims
CREATE POLICY "Admins can delete faucet_claims"
ON public.faucet_claims
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));