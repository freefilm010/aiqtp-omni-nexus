DROP POLICY IF EXISTS "Authenticated users can read supported chains" ON public.supported_chains;
DROP POLICY IF EXISTS "Public read on supported_chains" ON public.supported_chains;
DROP POLICY IF EXISTS "Anyone can read supported chains" ON public.supported_chains;
DROP POLICY IF EXISTS "Admins can select supported chains" ON public.supported_chains;

CREATE POLICY "Admins can select supported chains" ON public.supported_chains
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));