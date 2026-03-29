
-- Remove user-level SELECT from base wallet tables - force safe view usage
-- Users should only access data through safe views

-- SOLANA_WALLETS: Remove user SELECT on base table (safe view handles it)
DROP POLICY IF EXISTS "Users view own solana wallets" ON public.solana_wallets;
DROP POLICY IF EXISTS "Users view own solana wallets via safe view" ON public.solana_wallets;

-- QUWALLET_WALLETS: Remove user SELECT on base table (safe view handles it)
DROP POLICY IF EXISTS "Users view own quwallet wallets" ON public.quwallet_wallets;

-- CONNECTED_ACCOUNTS: Tighten the existing policy to admin-only for base table
DROP POLICY IF EXISTS "Users can view accessible connected accounts" ON public.connected_accounts;

-- Admin-only SELECT on base connected_accounts table
CREATE POLICY "Admins select connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure safe views use security_invoker so RLS on base tables is enforced properly
-- Recreate safe views with security_invoker = true, security_barrier = true

DROP VIEW IF EXISTS public.solana_wallets_safe;
CREATE VIEW public.solana_wallets_safe
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, wallet_address, wallet_type, label, owner_user_id, operator_id,
       balance_sol, is_active, last_activity, created_at, updated_at, chain
FROM public.solana_wallets
WHERE (owner_user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin');

DROP VIEW IF EXISTS public.quwallet_wallets_safe;
CREATE VIEW public.quwallet_wallets_safe
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, user_id, wallet_name, wallet_address, kyber_public_key, dilithium_public_key,
       ecdsa_public_key, wallet_type, is_hardware, hardware_type, multi_sig_config,
       is_active, created_at, updated_at, is_admin_controlled
FROM public.quwallet_wallets
WHERE (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin');

DROP VIEW IF EXISTS public.connected_accounts_safe;
CREATE VIEW public.connected_accounts_safe
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, user_id, account_name, account_type, status, balance, change_24h,
       last_sync_at, created_at, updated_at
FROM public.connected_accounts
WHERE (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin');

-- Also drop the admin_safe view we created earlier (redundant with solana_wallets_safe)
DROP VIEW IF EXISTS public.solana_wallets_admin_safe;
