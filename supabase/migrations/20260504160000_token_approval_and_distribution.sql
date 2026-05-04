-- ============================================================================
-- Token approval workflow + distribution rules unique constraint
-- ============================================================================

-- 1. Add status column to dex_tokens for admin approval workflow
ALTER TABLE public.dex_tokens
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Index for fast pending-approval queries
CREATE INDEX IF NOT EXISTS idx_dex_tokens_status
  ON public.dex_tokens (status, created_at DESC);

-- Admins can update dex_token status
DROP POLICY IF EXISTS "Admins can manage dex tokens" ON public.dex_tokens;
CREATE POLICY "Admins can manage dex tokens"
  ON public.dex_tokens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add unique constraint on rule_name so upsert works for RevenueManager
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profit_distribution_rules_rule_name_key'
  ) THEN
    ALTER TABLE public.profit_distribution_rules
      ADD CONSTRAINT profit_distribution_rules_rule_name_key UNIQUE (rule_name);
  END IF;
END $$;

-- Seed default distribution rules if none exist yet
INSERT INTO public.profit_distribution_rules
  (rule_name, source_type, distribution_type, percentage, is_active, execution_frequency)
VALUES
  ('default_reinvest', 'all', 'reinvest', 60, true, 'immediate'),
  ('default_reserve',  'all', 'reserve',  25, true, 'immediate'),
  ('default_withdraw', 'all', 'withdraw', 15, true, 'immediate')
ON CONFLICT (rule_name) DO NOTHING;
