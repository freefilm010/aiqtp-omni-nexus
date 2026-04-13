
-- 1. AUTO-INVEST user-scoped policies (drop first for idempotency)
DROP POLICY IF EXISTS "Users can view own engine" ON public.auto_invest_engine;
DROP POLICY IF EXISTS "Users can view own engines" ON public.auto_invest_engine;
CREATE POLICY "Users can view own engine"
ON public.auto_invest_engine FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own allocations" ON public.auto_invest_allocations;
CREATE POLICY "Users can view own allocations"
ON public.auto_invest_allocations FOR SELECT TO authenticated
USING (public.owns_auto_invest_engine(engine_id));

DROP POLICY IF EXISTS "Users can view own transactions" ON public.auto_invest_transactions;
CREATE POLICY "Users can view own transactions"
ON public.auto_invest_transactions FOR SELECT TO authenticated
USING (public.owns_auto_invest_engine(engine_id));

DROP POLICY IF EXISTS "Users can view own ai logs" ON public.auto_invest_ai_logs;
CREATE POLICY "Users can view own ai logs"
ON public.auto_invest_ai_logs FOR SELECT TO authenticated
USING (public.owns_auto_invest_engine(engine_id));

-- 2. MARKET ALERTS: strict user-only
DROP POLICY IF EXISTS "Users read own alerts" ON public.market_alerts;
CREATE POLICY "Users read own alerts"
ON public.market_alerts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own alerts" ON public.market_alerts;
CREATE POLICY "Users insert own alerts"
ON public.market_alerts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own alerts" ON public.market_alerts;
CREATE POLICY "Users update own alerts"
ON public.market_alerts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 3. INFLUENCER PARTNERS: authenticated only
DROP POLICY IF EXISTS "Influencers view own record" ON public.influencer_partners;
CREATE POLICY "Influencers view own record"
ON public.influencer_partners FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 4. PORTFOLIO PERFORMANCE: admin-only
DROP POLICY IF EXISTS "Authenticated users view portfolio performance" ON public.portfolio_performance;
DROP POLICY IF EXISTS "Authenticated users can view performance" ON public.portfolio_performance;
DROP POLICY IF EXISTS "Admin can view portfolio performance" ON public.portfolio_performance;
CREATE POLICY "Admin can view portfolio performance"
ON public.portfolio_performance FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. PLATFORM ACTIVITY LOG: enforce non-null user_id
DROP POLICY IF EXISTS "Users can insert own activity" ON public.platform_activity_log;
CREATE POLICY "Users can insert own activity"
ON public.platform_activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);
