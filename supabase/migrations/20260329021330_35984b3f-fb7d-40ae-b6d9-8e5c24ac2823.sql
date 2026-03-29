-- 1. QTC TRANSACTIONS: Remove the overly permissive policy (the scoped one already exists)
DROP POLICY IF EXISTS "Authenticated users view transactions" ON qtc_transactions;

-- 2. SUPPORTED CHAINS: Restrict to authenticated users only (hides internal RPC URLs from public)
DROP POLICY IF EXISTS "Anyone can view supported chains" ON supported_chains;
CREATE POLICY "Authenticated users view supported chains"
  ON supported_chains FOR SELECT TO authenticated
  USING (true);

-- 3. SOLANA WALLETS: Allow owners to read their own rows
CREATE POLICY "Owners view own solana wallets"
  ON solana_wallets FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- 4. AUTOMATION TEMPLATES: Hide webhook_url from system template view
DROP POLICY IF EXISTS "Anyone can view system templates" ON automation_templates;
CREATE POLICY "Authenticated users view system or own templates"
  ON automation_templates FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_system = true AND webhook_url IS NULL)
    OR public.has_role(auth.uid(), 'admin')
  );

-- 5. ACCOUNT KEY VAULT: Add explicit deny policy for non-admin users
CREATE POLICY "Users cannot read account key vault"
  ON account_key_vault FOR SELECT TO authenticated
  USING (false);

CREATE POLICY "Admins manage account key vault"
  ON account_key_vault FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));