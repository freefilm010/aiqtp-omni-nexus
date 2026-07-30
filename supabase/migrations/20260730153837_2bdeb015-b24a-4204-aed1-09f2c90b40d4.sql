DROP POLICY IF EXISTS "Authenticated users view signals" ON public.trading_signals;

CREATE POLICY "View system or own trading signals"
ON public.trading_signals
FOR SELECT
TO authenticated
USING (
  user_id IS NULL
  OR user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);