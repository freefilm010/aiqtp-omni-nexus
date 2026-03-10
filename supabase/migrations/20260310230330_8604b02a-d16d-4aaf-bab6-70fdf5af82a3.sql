-- HARDEN: Replace all overly permissive RLS policies

-- 1. auto_nft_generations
DROP POLICY IF EXISTS "Service role manages auto NFTs" ON public.auto_nft_generations;
CREATE POLICY "Admins manage auto NFTs" ON public.auto_nft_generations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. data_products
DROP POLICY IF EXISTS "Service role manages data products" ON public.data_products;
CREATE POLICY "Admins manage data products" ON public.data_products
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. data_sales
DROP POLICY IF EXISTS "Service role manages data sales" ON public.data_sales;
CREATE POLICY "Admins manage data sales" ON public.data_sales
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. data_token_boosts
DROP POLICY IF EXISTS "System can insert token boosts" ON public.data_token_boosts;
CREATE POLICY "Admins insert token boosts" ON public.data_token_boosts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. dex_pairs
DROP POLICY IF EXISTS "Service role manages dex pairs" ON public.dex_pairs;
CREATE POLICY "Admins manage dex pairs" ON public.dex_pairs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. market_coins
DROP POLICY IF EXISTS "Service role manages market coins" ON public.market_coins;
CREATE POLICY "Admins manage market coins" ON public.market_coins
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. market_ohlcv
DROP POLICY IF EXISTS "Service role manages market ohlcv" ON public.market_ohlcv;
CREATE POLICY "Admins manage market ohlcv" ON public.market_ohlcv
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. market_prices
DROP POLICY IF EXISTS "Service role manages market prices" ON public.market_prices;
CREATE POLICY "Admins manage market prices" ON public.market_prices
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. market_sync_logs
DROP POLICY IF EXISTS "Service role manages sync logs" ON public.market_sync_logs;
CREATE POLICY "Admins manage sync logs" ON public.market_sync_logs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. nft_generation_queue
DROP POLICY IF EXISTS "Service role manages NFT queue" ON public.nft_generation_queue;
CREATE POLICY "Admins manage NFT queue" ON public.nft_generation_queue
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. solana_token_balances
DROP POLICY IF EXISTS "Service role manages token balances" ON public.solana_token_balances;
CREATE POLICY "Admins manage token balances" ON public.solana_token_balances
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. solana_tokens
DROP POLICY IF EXISTS "Service role manages solana tokens" ON public.solana_tokens;
CREATE POLICY "Admins manage solana tokens" ON public.solana_tokens
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. solana_transactions
DROP POLICY IF EXISTS "Service role manages solana transactions" ON public.solana_transactions;
CREATE POLICY "Admins manage solana transactions" ON public.solana_transactions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. solana_wallets
DROP POLICY IF EXISTS "Service role manages solana wallets" ON public.solana_wallets;
CREATE POLICY "Admins manage solana wallets" ON public.solana_wallets
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. trade_logs
DROP POLICY IF EXISTS "System can insert trade logs" ON public.trade_logs;
CREATE POLICY "Authenticated users insert own trade logs" ON public.trade_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);