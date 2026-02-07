-- Fix ERROR-level issues: allow users to access their own data while protecting sensitive fields

-- 1) qtc_ledger: Add policy for users to view their own ledger via their wallet address
ALTER TABLE public.qtc_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage qtc_ledger" ON public.qtc_ledger;
DROP POLICY IF EXISTS "Users can view own ledger" ON public.qtc_ledger;
DROP POLICY IF EXISTS "Service role can manage qtc_ledger" ON public.qtc_ledger;

-- Admins can manage all
CREATE POLICY "Admins can manage qtc_ledger"
ON public.qtc_ledger
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view ledger entries for wallets they own (via subquery to quwallet_wallets)
CREATE POLICY "Users can view own ledger entries"
ON public.qtc_ledger
FOR SELECT
TO authenticated
USING (
  wallet_address IN (
    SELECT wallet_address FROM public.quwallet_wallets WHERE user_id = auth.uid()
  )
);

-- 2) quwallet_wallets: Allow users to view/create/update their own wallets (but we'll use a view to hide encrypted_private_keys)
DROP POLICY IF EXISTS "Admins can manage quwallet wallets" ON public.quwallet_wallets;

-- Admins can manage all wallets
CREATE POLICY "Admins can manage quwallet wallets"
ON public.quwallet_wallets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own wallets
CREATE POLICY "Users can view own wallets"
ON public.quwallet_wallets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own wallets
CREATE POLICY "Users can create own wallets"
ON public.quwallet_wallets
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own wallets
CREATE POLICY "Users can update own wallets"
ON public.quwallet_wallets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create a secure view that hides encrypted_private_keys from regular users
CREATE OR REPLACE VIEW public.quwallet_wallets_safe AS
SELECT 
  id,
  user_id,
  wallet_name,
  wallet_address,
  wallet_type,
  kyber_public_key,
  dilithium_public_key,
  ecdsa_public_key,
  is_hardware,
  is_active,
  created_at
  -- encrypted_private_keys and key_derivation_salt are NOT exposed
FROM public.quwallet_wallets
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');