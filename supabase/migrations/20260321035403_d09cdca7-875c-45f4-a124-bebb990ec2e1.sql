-- Drop and recreate quwallet_wallets_safe with all non-sensitive columns
DROP VIEW IF EXISTS public.quwallet_wallets_safe;
CREATE VIEW public.quwallet_wallets_safe
WITH (security_invoker = true)
AS SELECT
  id, user_id, wallet_name, wallet_address, kyber_public_key, dilithium_public_key,
  ecdsa_public_key, wallet_type, is_hardware, hardware_type, multi_sig_config,
  is_active, created_at, updated_at, is_admin_controlled
FROM public.quwallet_wallets;

-- Create solana_wallets_safe view (excludes encrypted_private_key)
CREATE VIEW public.solana_wallets_safe
WITH (security_invoker = true)
AS SELECT
  id, wallet_address, wallet_type, label, owner_user_id, operator_id,
  balance_sol, is_active, last_activity, created_at, updated_at, chain
FROM public.solana_wallets;

-- Fix RLS: drop old policies that expose private keys via direct table queries
DROP POLICY IF EXISTS "Users view own solana wallets" ON public.solana_wallets;
DROP POLICY IF EXISTS "Users can view own wallets" ON public.quwallet_wallets;

-- Recreate SELECT policies (needed for security_invoker views to work)
CREATE POLICY "Users view own solana wallets via safe view"
ON public.solana_wallets FOR SELECT TO authenticated
USING (owner_user_id = auth.uid());

CREATE POLICY "Users can view own wallets via safe view"
ON public.quwallet_wallets FOR SELECT TO authenticated
USING (user_id = auth.uid())