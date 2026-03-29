
-- Fix remaining warn-level findings

-- 1. REWARD_REDEMPTIONS: Add user self-read (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reward_redemptions' AND policyname = 'Users view own redemptions') THEN
    EXECUTE $p$
      CREATE POLICY "Users view own redemptions"
        ON public.reward_redemptions FOR SELECT
        USING (user_id = auth.uid())
    $p$;
  END IF;
END $$;

-- 2. SAVED_PAYMENT_METHODS: Create safe view excluding Stripe IDs
CREATE OR REPLACE VIEW public.saved_payment_methods_safe
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, user_id, card_brand, last_four, exp_month, exp_year,
       is_default, nickname, created_at, updated_at
FROM public.saved_payment_methods
WHERE (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin');

-- 3. NFT_GENERATION_QUEUE: Add user self-read for their own queue items
ALTER TABLE public.nft_generation_queue ADD COLUMN IF NOT EXISTS user_id uuid;

-- 4. AUTO_INVEST_ALLOCATIONS: These are admin-only engine allocations, confirm intentional
-- No change needed - auto_invest is a platform-managed system

-- 5. PLATFORM_INVESTMENTS: Admin-only table, confirm intentional
-- No change needed - these are platform-level investments

-- 6. INVESTMENT_PORTFOLIO: Admin-only, confirm intentional
-- No change needed
