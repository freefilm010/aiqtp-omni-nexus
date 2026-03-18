
-- Fix permissive INSERT policies
DROP POLICY IF EXISTS "System inserts vouchers" ON public.fee_vouchers;
CREATE POLICY "Admin inserts vouchers" ON public.fee_vouchers FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System inserts burns" ON public.token_burns;
CREATE POLICY "Authenticated inserts burns" ON public.token_burns FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());
