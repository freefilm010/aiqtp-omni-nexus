
-- FIX 1: solana_wallets - Remove public access to treasury/faucet wallets
DROP POLICY IF EXISTS "Users view own solana wallets" ON public.solana_wallets;

CREATE POLICY "Users view own solana wallets"
  ON public.solana_wallets FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "Admins view all solana wallets"
  ON public.solana_wallets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- FIX 2: data_aggregator_bots - Remove anon access to graduated bots
DROP POLICY IF EXISTS "Anyone can view graduated bots" ON public.data_aggregator_bots;

CREATE POLICY "Authenticated users view graduated bots"
  ON public.data_aggregator_bots FOR SELECT TO authenticated
  USING (is_graduated = true);

-- FIX 3: faucet_claims - Remove broken wallet/api_key policy
DROP POLICY IF EXISTS "Users can view own faucet_claims" ON public.faucet_claims;
