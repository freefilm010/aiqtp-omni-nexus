
-- 5. Fix quwallet_wallets_safe view: recreate with security_invoker (correct columns)
DROP VIEW IF EXISTS public.quwallet_wallets_safe;

CREATE VIEW public.quwallet_wallets_safe
WITH (security_invoker = true)
AS SELECT
  id, user_id, wallet_name, wallet_address, wallet_type,
  is_hardware, hardware_type, is_active, is_admin_controlled,
  kyber_public_key, dilithium_public_key, ecdsa_public_key,
  created_at, updated_at
FROM public.quwallet_wallets;

-- 6. Fix investment_portfolio: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view investment portfolio" ON public.investment_portfolio;

CREATE POLICY "Authenticated users view investment portfolio" ON public.investment_portfolio
  FOR SELECT TO authenticated USING (true);

-- 7. Fix portfolio_performance: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view portfolio performance" ON public.portfolio_performance;

CREATE POLICY "Authenticated users view portfolio performance" ON public.portfolio_performance
  FOR SELECT TO authenticated USING (true);
