-- Fix SECURITY DEFINER view issue - drop and recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.quwallet_wallets_safe;

-- Create view with SECURITY INVOKER (default, but explicit for clarity)
CREATE VIEW public.quwallet_wallets_safe
WITH (security_invoker = true)
AS
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
FROM public.quwallet_wallets;