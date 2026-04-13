
-- Backfill null user_id with admin UUID
UPDATE public.auto_invest_engine
SET user_id = 'e2618acb-f33d-42b5-b8ed-2318a09c6326'
WHERE user_id IS NULL;

-- Now safely add NOT NULL if not already set
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auto_invest_engine' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.auto_invest_engine ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;
