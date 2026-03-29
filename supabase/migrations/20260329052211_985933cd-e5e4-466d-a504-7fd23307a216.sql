
DROP POLICY IF EXISTS "Users can select their own wallets" ON public.quwallet_wallets;
CREATE POLICY "Users can select their own wallets" ON public.quwallet_wallets
FOR SELECT TO authenticated
USING (user_id = auth.uid());
