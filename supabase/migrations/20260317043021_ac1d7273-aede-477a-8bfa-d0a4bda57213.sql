
-- 1. forensic_transactions: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can view forensic transactions" ON public.forensic_transactions;
CREATE POLICY "Authenticated users can view forensic transactions"
ON public.forensic_transactions FOR SELECT TO authenticated
USING (true);

-- 2. exchange_balances: replace ALL with SELECT-only
DROP POLICY IF EXISTS "Users can manage own balances" ON public.exchange_balances;
CREATE POLICY "Users can view own balances"
ON public.exchange_balances FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Service role manages balances"
ON public.exchange_balances FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 3. data_token_holdings: replace ALL with SELECT-only  
DROP POLICY IF EXISTS "Users can view own holdings" ON public.data_token_holdings;
CREATE POLICY "Users can read own holdings"
ON public.data_token_holdings FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Service role manages holdings"
ON public.data_token_holdings FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 4. ai_strategies: fix code exposure for graduated strategies
DROP POLICY IF EXISTS "Users can view own or graduated strategies" ON public.ai_strategies;
CREATE POLICY "Users can view own strategies"
ON public.ai_strategies FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 5. data_aggregator_bots: fix code exposure for graduated bots
DROP POLICY IF EXISTS "Authenticated users view graduated bots" ON public.data_aggregator_bots;
CREATE POLICY "Users can view own bots"
ON public.data_aggregator_bots FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Create safe public view for graduated bots (no code column)
DROP VIEW IF EXISTS public.data_aggregator_bots_public;
CREATE VIEW public.data_aggregator_bots_public WITH (security_invoker = true) AS
SELECT id, name, description, bot_type, data_category, is_active, is_graduated,
       quality_score, reliability_score, total_records_collected, total_earnings,
       creator_profit_share, admin_approved, graduation_date, code_protected,
       collection_frequency, output_format, user_id, created_at, updated_at
FROM public.data_aggregator_bots
WHERE is_graduated = true;
