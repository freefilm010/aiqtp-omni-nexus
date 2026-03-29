
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON qtc_transactions;
DROP POLICY IF EXISTS "Anyone can view confirmed transactions" ON qtc_transactions;

CREATE POLICY "Users view own qtc transactions"
  ON qtc_transactions FOR SELECT TO authenticated
  USING (
    from_address IN (SELECT wallet_address FROM quwallet_wallets WHERE user_id = auth.uid())
    OR to_address IN (SELECT wallet_address FROM quwallet_wallets WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
