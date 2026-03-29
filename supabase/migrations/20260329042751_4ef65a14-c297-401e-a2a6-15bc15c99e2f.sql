-- Idempotent cleanup: ensure all policies exist exactly once
-- This fixes deploy failures from prior partial migrations

-- QTC TRANSACTIONS
DROP POLICY IF EXISTS "Authenticated users view transactions" ON qtc_transactions;
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON qtc_transactions;
DROP POLICY IF EXISTS "Anyone can view confirmed transactions" ON qtc_transactions;
DROP POLICY IF EXISTS "Users view own qtc transactions" ON qtc_transactions;
CREATE POLICY "Users view own qtc transactions"
  ON qtc_transactions FOR SELECT TO authenticated
  USING (
    from_address IN (SELECT wallet_address FROM quwallet_wallets WHERE user_id = auth.uid())
    OR to_address IN (SELECT wallet_address FROM quwallet_wallets WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- SUPPORTED CHAINS
DROP POLICY IF EXISTS "Anyone can view supported chains" ON supported_chains;
DROP POLICY IF EXISTS "Authenticated users view supported chains" ON supported_chains;
CREATE POLICY "Authenticated users view supported chains"
  ON supported_chains FOR SELECT TO authenticated
  USING (true);

-- SOLANA WALLETS
DROP POLICY IF EXISTS "Owners view own solana wallets" ON solana_wallets;
CREATE POLICY "Owners view own solana wallets"
  ON solana_wallets FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- AUTOMATION TEMPLATES
DROP POLICY IF EXISTS "Anyone can view system templates" ON automation_templates;
DROP POLICY IF EXISTS "Authenticated users view system or own templates" ON automation_templates;
CREATE POLICY "Authenticated users view system or own templates"
  ON automation_templates FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_system = true AND webhook_url IS NULL)
    OR public.has_role(auth.uid(), 'admin')
  );

-- ACCOUNT KEY VAULT
DROP POLICY IF EXISTS "Users cannot read account key vault" ON account_key_vault;
CREATE POLICY "Users cannot read account key vault"
  ON account_key_vault FOR SELECT TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Admins manage account key vault" ON account_key_vault;
CREATE POLICY "Admins manage account key vault"
  ON account_key_vault FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));