-- Step 1: Ensure the column has a DEFAULT so the schema diff can add it safely to Live
ALTER TABLE public.auto_invest_engine
  ALTER COLUMN user_id SET DEFAULT 'e2618acb-f33d-42b5-b8ed-2318a09c6326'::uuid;

-- Step 2: Backfill any remaining nulls (safety net)
UPDATE public.auto_invest_engine
SET user_id = 'e2618acb-f33d-42b5-b8ed-2318a09c6326'
WHERE user_id IS NULL;

-- Step 3: Remove the default so future inserts must provide user_id explicitly
ALTER TABLE public.auto_invest_engine
  ALTER COLUMN user_id DROP DEFAULT;