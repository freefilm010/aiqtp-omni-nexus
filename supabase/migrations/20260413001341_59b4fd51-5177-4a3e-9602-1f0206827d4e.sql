
-- AUTO-INVEST: user-scoped via ownership
DROP POLICY IF EXISTS "Users can view own engines" ON public.auto_invest_engine;
CREATE POLICY "Users can view own engines" ON public.auto_invest_engine
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own allocations" ON public.auto_invest_allocations;
CREATE POLICY "Users can view own allocations" ON public.auto_invest_allocations
  FOR SELECT TO authenticated
  USING (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own transactions" ON public.auto_invest_transactions;
CREATE POLICY "Users can view own transactions" ON public.auto_invest_transactions
  FOR SELECT TO authenticated
  USING (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own ai logs" ON public.auto_invest_ai_logs;
CREATE POLICY "Users can view own ai logs" ON public.auto_invest_ai_logs
  FOR SELECT TO authenticated
  USING (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'));

-- ADMIN-ONLY TABLES (no user_id column — platform data)
DROP POLICY IF EXISTS "Admin can view investment portfolio" ON public.investment_portfolio;
CREATE POLICY "Admin can view investment portfolio" ON public.investment_portfolio
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view performance" ON public.portfolio_performance;
DROP POLICY IF EXISTS "Admin can view portfolio performance" ON public.portfolio_performance;
CREATE POLICY "Admin can view portfolio performance" ON public.portfolio_performance
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view platform wallets" ON public.platform_wallets;
CREATE POLICY "Admin can view platform wallets" ON public.platform_wallets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view platform investments" ON public.platform_investments;
CREATE POLICY "Admin can view platform investments" ON public.platform_investments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view platform revenue" ON public.platform_revenue;
CREATE POLICY "Admin can view platform revenue" ON public.platform_revenue
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view platform nft holdings" ON public.platform_nft_holdings;
CREATE POLICY "Admin can view platform nft holdings" ON public.platform_nft_holdings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view profit distribution log" ON public.profit_distribution_log;
CREATE POLICY "Admin can view profit distribution log" ON public.profit_distribution_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view profit distribution rules" ON public.profit_distribution_rules;
CREATE POLICY "Admin can view profit distribution rules" ON public.profit_distribution_rules
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view operator wallets" ON public.operator_wallets;
CREATE POLICY "Admin can view operator wallets" ON public.operator_wallets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view operator transactions" ON public.operator_transactions;
CREATE POLICY "Admin can view operator transactions" ON public.operator_transactions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view operator territories" ON public.operator_territories;
CREATE POLICY "Admin can view operator territories" ON public.operator_territories
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view data exports" ON public.data_exports;
CREATE POLICY "Admin can view data exports" ON public.data_exports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view data sales" ON public.data_sales;
CREATE POLICY "Admin can view data sales" ON public.data_sales
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view token revenue" ON public.token_revenue;
CREATE POLICY "Admin can view token revenue" ON public.token_revenue
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view qaqi learning data" ON public.qaqi_learning_data;
CREATE POLICY "Admin can view qaqi learning data" ON public.qaqi_learning_data
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view qaqi performance metrics" ON public.qaqi_performance_metrics;
CREATE POLICY "Admin can view qaqi performance metrics" ON public.qaqi_performance_metrics
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- FIX: market_alerts — no null user_id visibility
DROP POLICY IF EXISTS "Users can view own alerts" ON public.market_alerts;
CREATE POLICY "Users can view own alerts" ON public.market_alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
