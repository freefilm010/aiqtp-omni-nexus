-- Drop the unique constraint on auto_invest_engine.user_id
-- Users can have multiple engines, so this should NOT be unique.
-- This also unblocks the production deploy where multiple rows share the same default user_id.
DROP INDEX IF EXISTS public.auto_invest_engine_user_id_unique;

-- Ensure user-scoped SELECT policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polrelid = 'public.auto_invest_engine'::regclass 
    AND polname = 'Users can view own engine'
  ) THEN
    CREATE POLICY "Users can view own engine"
    ON public.auto_invest_engine FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;