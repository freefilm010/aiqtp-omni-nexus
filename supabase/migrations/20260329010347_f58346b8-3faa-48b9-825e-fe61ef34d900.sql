
-- ============================================================
-- FIX ERROR-LEVEL FINDINGS (3): Replace admin ALL policies with
-- granular policies that exclude sensitive columns via safe views
-- ============================================================

-- 1. SOLANA_WALLETS: Replace admin ALL with granular policies
DROP POLICY IF EXISTS "Admins manage solana wallets" ON public.solana_wallets;
DROP POLICY IF EXISTS "Admins view all solana wallets" ON public.solana_wallets;

-- Admin safe view (excludes encrypted_private_key)
CREATE OR REPLACE VIEW public.solana_wallets_admin_safe AS
SELECT id, wallet_address, wallet_type, label, owner_user_id, operator_id,
       balance_sol, is_active, last_activity, created_at, updated_at, chain
FROM public.solana_wallets;

-- Admin can SELECT via safe columns only (no encrypted_private_key)
CREATE POLICY "Admins select solana wallets safely"
  ON public.solana_wallets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can INSERT/UPDATE/DELETE  
CREATE POLICY "Admins insert solana wallets"
  ON public.solana_wallets FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update solana wallets"
  ON public.solana_wallets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete solana wallets"
  ON public.solana_wallets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Owner can view own wallets (safe columns enforced by column-level REVOKE already in place)
CREATE POLICY "Users view own solana wallets"
  ON public.solana_wallets FOR SELECT
  USING (owner_user_id = auth.uid());

-- Revoke encrypted_private_key column access (reinforcing previous migration)
REVOKE SELECT (encrypted_private_key) ON public.solana_wallets FROM anon, authenticated;


-- 2. QUWALLET_WALLETS: Replace admin ALL with granular policies
DROP POLICY IF EXISTS "Admins can manage quwallet wallets" ON public.quwallet_wallets;

CREATE POLICY "Admins select quwallet wallets"
  ON public.quwallet_wallets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert quwallet wallets"
  ON public.quwallet_wallets FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update quwallet wallets"
  ON public.quwallet_wallets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete quwallet wallets"
  ON public.quwallet_wallets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view own wallets
CREATE POLICY "Users view own quwallet wallets"
  ON public.quwallet_wallets FOR SELECT
  USING (user_id = auth.uid());

-- Revoke sensitive columns
REVOKE SELECT (encrypted_private_keys, key_derivation_salt) ON public.quwallet_wallets FROM anon, authenticated;


-- 3. CONNECTED_ACCOUNTS: Remove redundant admin-only SELECT, fix column access
DROP POLICY IF EXISTS "Admins can select connected accounts" ON public.connected_accounts;
-- The "Users can view accessible connected accounts" policy already covers admin via OR

-- Revoke sensitive column
REVOKE SELECT (api_key_encrypted) ON public.connected_accounts FROM anon, authenticated;


-- ============================================================
-- FIX WARN-LEVEL FINDINGS (7)
-- ============================================================

-- 4. INFLUENCER_PARTNERS: Add user self-access
CREATE POLICY "Influencers view own record"
  ON public.influencer_partners FOR SELECT
  USING (user_id = auth.uid());


-- 5. REWARD_REDEMPTIONS: Add user self-read
CREATE POLICY "Users view own redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (user_id = auth.uid());


-- 6. FAUCET_CLAIMS: Replace admin ALL with granular + add user self-read
DROP POLICY IF EXISTS "Admins can manage claims" ON public.faucet_claims;

CREATE POLICY "Admins insert faucet claims"
  ON public.faucet_claims FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update faucet claims"
  ON public.faucet_claims FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User can view own claims
CREATE POLICY "Users view own faucet claims"
  ON public.faucet_claims FOR SELECT
  USING (user_id = auth.uid());

-- Revoke ip_address from regular users
REVOKE SELECT (ip_address) ON public.faucet_claims FROM anon, authenticated;


-- 7. USER_SERVICE_CONNECTIONS: Already has user+admin SELECT.
-- Finding is advisory about api_key_hash - it's already hashed, acknowledge only.
-- No policy change needed.


-- 8. QTC_TRANSACTIONS: Restrict public SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.qtc_transactions;

CREATE POLICY "Authenticated users view transactions"
  ON public.qtc_transactions FOR SELECT
  TO authenticated
  USING (true);


-- 9. SOLANA_TRANSACTIONS: Restrict confirmed tx view to authenticated
DROP POLICY IF EXISTS "Anyone can view confirmed solana transactions" ON public.solana_transactions;

CREATE POLICY "Authenticated users view confirmed solana transactions"
  ON public.solana_transactions FOR SELECT
  TO authenticated
  USING (status IN ('confirmed', 'finalized'));


-- 10. PORTFOLIO_PERFORMANCE: Already has no user_id. This is platform-level aggregate data.
-- Restrict to authenticated (already is) but add comment. No change needed - finding is advisory.


-- 11. SAVED_PAYMENT_METHODS: Revoke stripe IDs from direct access (reinforcing)
REVOKE SELECT (stripe_payment_method_id, stripe_customer_id) ON public.saved_payment_methods FROM anon, authenticated;
