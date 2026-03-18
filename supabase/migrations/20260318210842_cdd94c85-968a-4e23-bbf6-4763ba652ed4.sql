
-- Recreate quwallet_wallets_safe with correct columns
DROP VIEW IF EXISTS public.quwallet_wallets_safe;
CREATE VIEW public.quwallet_wallets_safe
WITH (security_invoker = true)
AS SELECT
  id, user_id, wallet_name, wallet_type, wallet_address,
  is_hardware, hardware_type, is_active, created_at
FROM public.quwallet_wallets;
