-- Fix permissive RLS on data_token_holdings and exchange_balances
-- These should be admin-only for writes, authenticated for reads

DROP POLICY IF EXISTS "Service role manages holdings" ON public.data_token_holdings;
CREATE POLICY "Admin manages holdings" ON public.data_token_holdings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read holdings" ON public.data_token_holdings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages balances" ON public.exchange_balances;
CREATE POLICY "Admin manages balances" ON public.exchange_balances
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read balances" ON public.exchange_balances
  FOR SELECT TO authenticated
  USING (true);