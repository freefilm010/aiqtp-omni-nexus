-- Update auto_invest_engine default allocation to 95/5
ALTER TABLE public.auto_invest_engine 
  ALTER COLUMN growth_target_percent SET DEFAULT 95,
  ALTER COLUMN stable_target_percent SET DEFAULT 5;

-- Update any existing engines to new allocation
UPDATE public.auto_invest_engine 
SET growth_target_percent = 95, 
    stable_target_percent = 5,
    strategy = 'ultra_aggressive'
WHERE growth_target_percent = 70 AND stable_target_percent = 30;