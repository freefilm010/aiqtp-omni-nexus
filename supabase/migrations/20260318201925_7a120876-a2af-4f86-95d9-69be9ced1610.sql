
-- Fix overly permissive insert policies
DROP POLICY "Authenticated can insert referrals" ON public.giveaway_referrals;
CREATE POLICY "Authenticated can insert referrals" ON public.giveaway_referrals FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY "Authenticated can create entries" ON public.giveaway_entries;
CREATE POLICY "Authenticated can create entries" ON public.giveaway_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
