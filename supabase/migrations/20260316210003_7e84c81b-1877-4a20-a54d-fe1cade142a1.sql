
-- Fix the remaining items (policy already exists, so drop first)
DROP POLICY IF EXISTS "Users can view own token holdings" ON public.data_token_holdings;
CREATE POLICY "Users select own token holdings" ON public.data_token_holdings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Fix qtc_transactions
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.qtc_transactions;
CREATE POLICY "Users can insert own transactions" ON public.qtc_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    from_address IN (SELECT wallet_address FROM public.quwallet_wallets WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
