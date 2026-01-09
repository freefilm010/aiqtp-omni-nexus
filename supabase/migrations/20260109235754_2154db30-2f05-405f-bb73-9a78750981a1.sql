-- Drop overly permissive public SELECT policies on sensitive tables
DROP POLICY IF EXISTS "Anyone can view ledger balances" ON public.qtc_ledger;
DROP POLICY IF EXISTS "Anyone can view treasury config" ON public.qtc_treasury_config;

-- Create proper RLS policies - only authenticated users with admin role can view ledger
-- (wallet_address is a string, not UUID, so we restrict to admins only for treasury wallets)
CREATE POLICY "Admins can view all ledger entries" ON public.qtc_ledger
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Treasury config should be admin-only
CREATE POLICY "Only admins can view treasury config" ON public.qtc_treasury_config
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);