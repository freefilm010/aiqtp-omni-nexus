-- Safe view for connected accounts without encrypted API keys
CREATE OR REPLACE VIEW public.connected_accounts_safe
WITH (security_barrier = true) AS
SELECT
  id,
  user_id,
  account_name,
  account_type,
  status,
  balance,
  change_24h,
  last_sync_at,
  created_at,
  updated_at
FROM public.connected_accounts
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.connected_accounts_safe TO authenticated;

-- Safe view for payment methods without Stripe processor identifiers
CREATE OR REPLACE VIEW public.saved_payment_methods_safe
WITH (security_barrier = true) AS
SELECT
  id,
  user_id,
  nickname,
  method_type,
  last_four,
  card_brand,
  bank_name,
  is_default,
  metadata,
  created_at,
  updated_at,
  exp_month,
  exp_year
FROM public.saved_payment_methods
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.saved_payment_methods_safe TO authenticated;

-- Safe view for service connections without API key hashes
CREATE OR REPLACE VIEW public.user_service_connections_safe
WITH (security_barrier = true) AS
SELECT
  id,
  user_id,
  service_id,
  connection_status,
  external_account_id,
  metadata,
  connected_at,
  last_sync_at,
  created_at,
  updated_at
FROM public.user_service_connections
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.user_service_connections_safe TO authenticated;

-- Safe public leaderboard view without internal user UUIDs
CREATE OR REPLACE VIEW public.leaderboard_entries_public
WITH (security_barrier = true) AS
SELECT
  id,
  period_type,
  category,
  rank,
  score,
  display_name,
  avatar_url,
  highlight_stat,
  badge,
  period_start,
  updated_at
FROM public.leaderboard_entries;
GRANT SELECT ON public.leaderboard_entries_public TO anon, authenticated;

-- Safe view for reward redemption history without shipping addresses
CREATE OR REPLACE VIEW public.reward_redemptions_safe
WITH (security_barrier = true) AS
SELECT
  id,
  user_id,
  reward_id,
  payment_method,
  amount_paid,
  currency,
  status,
  tracking_number,
  notes,
  budget_year,
  created_at,
  updated_at
FROM public.reward_redemptions
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.reward_redemptions_safe TO authenticated;

-- Safe view for faucet claims without IP addresses
CREATE OR REPLACE VIEW public.faucet_claims_safe
WITH (security_barrier = true) AS
SELECT
  id,
  token_id,
  user_id,
  wallet_address,
  amount,
  chain,
  tx_hash,
  status,
  created_at
FROM public.faucet_claims
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.faucet_claims_safe TO authenticated;

-- Safe wallet views that exclude private key material and self-scope rows explicitly
CREATE OR REPLACE VIEW public.solana_wallets_safe
WITH (security_barrier = true) AS
SELECT
  id,
  wallet_address,
  wallet_type,
  label,
  owner_user_id,
  operator_id,
  balance_sol,
  is_active,
  last_activity,
  created_at,
  updated_at,
  chain
FROM public.solana_wallets
WHERE owner_user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.solana_wallets_safe TO authenticated;

CREATE OR REPLACE VIEW public.quwallet_wallets_safe
WITH (security_barrier = true) AS
SELECT
  id,
  user_id,
  wallet_name,
  wallet_address,
  kyber_public_key,
  dilithium_public_key,
  ecdsa_public_key,
  wallet_type,
  is_hardware,
  hardware_type,
  multi_sig_config,
  is_active,
  created_at,
  updated_at,
  is_admin_controlled
FROM public.quwallet_wallets
WHERE user_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin');
GRANT SELECT ON public.quwallet_wallets_safe TO authenticated;

-- Lock down direct table selects on sensitive tables
DROP POLICY IF EXISTS "Users can view own connected accounts" ON public.connected_accounts;
DROP POLICY IF EXISTS "Users can manage own connected accounts" ON public.connected_accounts;
CREATE POLICY "Users can insert own connected accounts"
ON public.connected_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connected accounts"
ON public.connected_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own connected accounts"
ON public.connected_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins can view connected accounts"
ON public.connected_accounts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own payment methods" ON public.saved_payment_methods;
CREATE POLICY "Admins can view payment methods"
ON public.saved_payment_methods
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users manage own service connections" ON public.user_service_connections;
CREATE POLICY "Users can insert own service connections"
ON public.user_service_connections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service connections"
ON public.user_service_connections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own service connections"
ON public.user_service_connections
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboard_entries;

DROP POLICY IF EXISTS "Users see own redemptions" ON public.reward_redemptions;

DROP POLICY IF EXISTS "Users can view own faucet claims" ON public.faucet_claims;

DROP POLICY IF EXISTS "Users view own solana wallets via safe view" ON public.solana_wallets;
DROP POLICY IF EXISTS "Users can view own wallets via safe view" ON public.quwallet_wallets;

-- Restrict influencer partner records to admins only at the raw-table level
DROP POLICY IF EXISTS "Admins or owners can view influencer partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins or owners can update influencer partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins or owners can delete influencer partners" ON public.influencer_partners;
DROP POLICY IF EXISTS "Admins or owners can create influencer partners" ON public.influencer_partners;
CREATE POLICY "Admins can view influencer partners"
ON public.influencer_partners
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update influencer partners"
ON public.influencer_partners
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete influencer partners"
ON public.influencer_partners
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create influencer partners"
ON public.influencer_partners
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));