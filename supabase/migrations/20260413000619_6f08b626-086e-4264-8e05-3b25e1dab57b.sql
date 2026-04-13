
-- Fix market_alerts INSERT policy to prevent global alert injection
DROP POLICY IF EXISTS "Users can create own alerts" ON public.market_alerts;
CREATE POLICY "Users can create own alerts" ON public.market_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix market_alerts SELECT policy to prevent reading null-user alerts
DROP POLICY IF EXISTS "Users can view own alerts" ON public.market_alerts;
CREATE POLICY "Users can view own alerts" ON public.market_alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin can manage all alerts
DROP POLICY IF EXISTS "Admins can manage all alerts" ON public.market_alerts;
CREATE POLICY "Admins can manage all alerts" ON public.market_alerts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
