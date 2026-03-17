-- Fix 1: Restrict investment_portfolio to admin-only access
DROP POLICY IF EXISTS "Authenticated users view investment portfolio" ON public.investment_portfolio;

CREATE POLICY "Admins can view investment portfolio"
  ON public.investment_portfolio
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));