-- Fix quwallet_wallets_safe view to use security_invoker so RLS on base table is enforced
DROP VIEW IF EXISTS public.quwallet_wallets_safe;

CREATE VIEW public.quwallet_wallets_safe
WITH (security_invoker=on) AS
SELECT id,
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
FROM quwallet_wallets;