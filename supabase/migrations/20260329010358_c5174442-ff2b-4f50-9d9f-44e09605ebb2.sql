
-- Fix the security definer view issue - make it security invoker
DROP VIEW IF EXISTS public.solana_wallets_admin_safe;

CREATE VIEW public.solana_wallets_admin_safe
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, wallet_address, wallet_type, label, owner_user_id, operator_id,
       balance_sol, is_active, last_activity, created_at, updated_at, chain
FROM public.solana_wallets;
