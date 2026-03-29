
-- Revoke direct SELECT on sensitive columns from quwallet_wallets
REVOKE SELECT (encrypted_private_keys, key_derivation_salt) ON public.quwallet_wallets FROM anon, authenticated;

-- Revoke direct SELECT on sensitive columns from connected_accounts
REVOKE SELECT (api_key_encrypted) ON public.connected_accounts FROM anon, authenticated;

-- Revoke direct SELECT on sensitive columns from saved_payment_methods  
REVOKE SELECT (stripe_payment_method_id, stripe_customer_id) ON public.saved_payment_methods FROM anon, authenticated;

-- Hash IP addresses in faucet_claims - revoke direct access to ip_address
REVOKE SELECT (ip_address) ON public.faucet_claims FROM anon, authenticated;
