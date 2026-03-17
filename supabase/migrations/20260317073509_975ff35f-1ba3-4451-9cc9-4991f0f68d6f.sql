
-- FIX 1: Remove permissive INSERT policy on qtc_transactions that allows forging transactions
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.qtc_transactions;

-- FIX 2: Protect proprietary strategy code from public access
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Users can view accessible strategies" ON public.ai_strategies;

-- Recreate with code_protected enforcement: public can only see non-code-protected graduated strategies
CREATE POLICY "Users can view accessible strategies"
  ON public.ai_strategies
  FOR SELECT
  USING (
    -- Owner can always see their own
    (auth.uid() = user_id)
    OR
    -- Admins can see all
    (public.has_role(auth.uid(), 'admin'))
    OR
    -- Public can see graduated+approved+for-rent strategies, but only if code is NOT protected
    (is_graduated = true AND is_available_for_rent = true AND admin_approved = true AND code_protected = false)
  );

-- Also create a restricted policy for public that hides code column via the view
-- (the ai_strategies_public view already omits code, so this is defense-in-depth)

-- FIX 3: Remove self-award achievements INSERT policy, restrict to service_role only
DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;

-- FIX 4: Remove user-facing INSERT on data_mining_rewards, restrict to service_role
DROP POLICY IF EXISTS "Users can insert their own mining rewards" ON public.data_mining_rewards;

-- FIX 5: Fix graduation_tests INSERT to verify strategy ownership
DROP POLICY IF EXISTS "Users can create graduation tests" ON public.graduation_tests;

CREATE POLICY "Users can create graduation tests for own strategies"
  ON public.graduation_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.ai_strategies
      WHERE id = strategy_id AND user_id = auth.uid()
    )
  );

-- FIX 5b: Fix bot_training_queue INSERT to verify strategy ownership
DROP POLICY IF EXISTS "Users can create graduation tests" ON public.bot_training_queue;
DROP POLICY IF EXISTS "Users can submit training jobs" ON public.bot_training_queue;
DROP POLICY IF EXISTS "Users can insert training jobs" ON public.bot_training_queue;

CREATE POLICY "Users can submit training for own strategies"
  ON public.bot_training_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      strategy_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.ai_strategies
        WHERE id = strategy_id AND user_id = auth.uid()
      )
    )
  );
