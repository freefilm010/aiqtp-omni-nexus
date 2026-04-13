-- Re-add the DEFAULT so the schema diff can safely add NOT NULL column to Live
ALTER TABLE public.auto_invest_engine
  ALTER COLUMN user_id SET DEFAULT 'e2618acb-f33d-42b5-b8ed-2318a09c6326'::uuid;