CREATE POLICY "Rental creator must own strategy"
ON public.strategy_rentals
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  renter_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.ai_strategies s
    WHERE s.id = strategy_rentals.strategy_id
      AND s.user_id = strategy_rentals.creator_user_id
  )
);

CREATE POLICY "Elite members must author own messages"
ON public.elite_club_messages
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.elite_club_members m
    WHERE m.user_id = auth.uid()
  )
);