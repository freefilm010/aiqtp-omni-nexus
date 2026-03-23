-- Remove newly introduced definer views; use direct table access with column-level grants instead
DROP VIEW IF EXISTS public.connected_accounts_safe;
DROP VIEW IF EXISTS public.saved_payment_methods_safe;
DROP VIEW IF EXISTS public.user_service_connections_safe;
DROP VIEW IF EXISTS public.leaderboard_entries_public;
DROP VIEW IF EXISTS public.reward_redemptions_safe;
DROP VIEW IF EXISTS public.faucet_claims_safe;

-- Existing wallet safe views must honor caller permissions
ALTER VIEW public.solana_wallets_safe SET (security_invoker = true, security_barrier = true);
ALTER VIEW public.quwallet_wallets_safe SET (security_invoker = true, security_barrier = true);
GRANT SELECT ON public.solana_wallets_safe TO authenticated;
GRANT SELECT ON public.quwallet_wallets_safe TO authenticated;

-- Restore safe SELECT access for user-facing tables while restricting selectable columns
DROP POLICY IF EXISTS "Admins can view connected accounts" ON public.connected_accounts;
CREATE POLICY "Users can view accessible connected accounts"
ON public.connected_accounts
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.connected_accounts FROM authenticated;
GRANT SELECT (id, user_id, account_name, account_type, status, balance, change_24h, last_sync_at, created_at, updated_at)
ON public.connected_accounts TO authenticated;

DROP POLICY IF EXISTS "Admins can view payment methods" ON public.saved_payment_methods;
CREATE POLICY "Users can view accessible payment methods"
ON public.saved_payment_methods
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.saved_payment_methods FROM authenticated;
GRANT SELECT (id, user_id, nickname, method_type, last_four, card_brand, bank_name, is_default, metadata, created_at, updated_at, exp_month, exp_year)
ON public.saved_payment_methods TO authenticated;

CREATE POLICY "Users can view accessible service connections"
ON public.user_service_connections
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.user_service_connections FROM authenticated;
GRANT SELECT (id, user_id, service_id, connection_status, external_account_id, metadata, connected_at, last_sync_at, created_at, updated_at)
ON public.user_service_connections TO authenticated;

CREATE POLICY "Anyone can view leaderboards"
ON public.leaderboard_entries
FOR SELECT
TO anon, authenticated
USING (true);
REVOKE SELECT ON public.leaderboard_entries FROM anon, authenticated;
GRANT SELECT (id, period_type, category, rank, score, display_name, avatar_url, highlight_stat, badge, period_start, updated_at)
ON public.leaderboard_entries TO anon, authenticated;