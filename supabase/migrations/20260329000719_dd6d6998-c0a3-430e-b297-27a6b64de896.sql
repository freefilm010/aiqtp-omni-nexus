-- Revoke SELECT on encrypted_private_key from non-admin roles
-- This ensures even if a permissive RLS policy is added later, the column stays hidden
REVOKE SELECT (encrypted_private_key) ON public.solana_wallets FROM anon;
REVOKE SELECT (encrypted_private_key) ON public.solana_wallets FROM authenticated;