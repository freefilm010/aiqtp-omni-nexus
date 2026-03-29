
-- Fix 1: Restrict solana_transactions to wallet owners only
DROP POLICY IF EXISTS "Authenticated users view confirmed solana transactions" ON solana_transactions;

CREATE POLICY "Users view own solana transactions"
  ON solana_transactions FOR SELECT TO authenticated
  USING (
    status = ANY (ARRAY['confirmed'::text, 'finalized'::text])
    AND (
      from_wallet IN (SELECT wallet_address FROM solana_wallets WHERE owner_user_id = auth.uid())
      OR to_wallet IN (SELECT wallet_address FROM solana_wallets WHERE owner_user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Fix 2: Add defensive SELECT policy on wallet_key_vault (service-role only by design, but add explicit deny for users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallet_key_vault' AND policyname = 'Users cannot read vault keys'
  ) THEN
    CREATE POLICY "Users cannot read vault keys"
      ON wallet_key_vault FOR SELECT TO authenticated
      USING (false);
  END IF;
END $$;

-- Fix 3: Restrict market_sync_logs to admin only
DROP POLICY IF EXISTS "Anyone can view sync logs" ON market_sync_logs;

CREATE POLICY "Admins view sync logs"
  ON market_sync_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
