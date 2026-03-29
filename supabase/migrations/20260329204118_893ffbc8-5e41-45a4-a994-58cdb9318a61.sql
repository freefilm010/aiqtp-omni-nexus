
-- Fix overly permissive INSERT policy on market_alerts
DROP POLICY "System inserts alerts" ON public.market_alerts;
CREATE POLICY "Users insert own alerts" ON public.market_alerts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
