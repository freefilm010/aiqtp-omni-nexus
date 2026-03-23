DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Anyone can read badges" ON public.user_badges;
CREATE POLICY "Users can view own badges"
ON public.user_badges
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));