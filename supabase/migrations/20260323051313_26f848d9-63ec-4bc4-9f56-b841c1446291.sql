-- Drop user SELECT policies that expose sensitive columns
DROP POLICY IF EXISTS "Users view own solana wallets via safe view" ON public.solana_wallets;
DROP POLICY IF EXISTS "Users can view own wallets via safe view" ON public.quwallet_wallets;
DROP POLICY IF EXISTS "Users can view own faucet claims" ON public.faucet_claims;
DROP POLICY IF EXISTS "Users can manage own connected accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can view own connected accounts" ON public.connected_accounts;

-- connected_accounts: admin-only raw SELECT, user write via specific ops
CREATE POLICY "Admins can select connected accounts"
ON public.connected_accounts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert connected accounts"
ON public.connected_accounts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update connected accounts"
ON public.connected_accounts FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete connected accounts"
ON public.connected_accounts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Safe view for connected_accounts (no api_key_encrypted)
CREATE OR REPLACE VIEW public.connected_accounts_safe
WITH (security_barrier = true) AS
SELECT id, user_id, account_name, account_type, status, balance, change_24h, last_sync_at, created_at, updated_at
FROM public.connected_accounts
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.connected_accounts_safe TO authenticated;

-- Safe view for faucet_claims (no ip_address)
CREATE OR REPLACE VIEW public.faucet_claims_safe
WITH (security_barrier = true) AS
SELECT id, token_id, user_id, wallet_address, amount, chain, tx_hash, status, created_at
FROM public.faucet_claims
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.faucet_claims_safe TO authenticated;