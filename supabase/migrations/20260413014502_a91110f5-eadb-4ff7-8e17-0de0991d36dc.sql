
-- STEP 1: Ensure user_id column exists (nullable first)
ALTER TABLE public.auto_invest_engine
ADD COLUMN IF NOT EXISTS user_id UUID;

-- STEP 2: Backfill ALL null rows with the primary admin user
UPDATE public.auto_invest_engine
SET user_id = 'e2618acb-f33d-42b5-b8ed-2318a09c6326'
WHERE user_id IS NULL;

-- STEP 3: Now safe to set NOT NULL
DO $$
BEGIN
  -- Only alter if not already NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'auto_invest_engine'
      AND column_name = 'user_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.auto_invest_engine ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- STEP 4: Indexes (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS auto_invest_engine_user_id_unique
ON public.auto_invest_engine (user_id);

CREATE INDEX IF NOT EXISTS auto_invest_engine_user_id_idx
ON public.auto_invest_engine (user_id);

-- STEP 5: Secure Realtime — remove sensitive tables from publication
DO $$
BEGIN
  -- Remove chat_messages from realtime if published
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
  END IF;

  -- Remove elite_club_messages from realtime if published
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'elite_club_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.elite_club_messages;
  END IF;
END $$;
