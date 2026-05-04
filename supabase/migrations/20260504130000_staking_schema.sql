-- ============================================================================
-- Platform Staking Schema — user_stakes table + APY reward tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_stakes (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_symbol    text          NOT NULL,
  token_name      text          NOT NULL,
  amount_staked   numeric(20,8) NOT NULL CHECK (amount_staked > 0),
  apy             numeric(5,2)  NOT NULL,
  lock_days       integer       NOT NULL CHECK (lock_days > 0),
  lock_until      timestamptz   NOT NULL,
  expected_reward numeric(20,8) NOT NULL DEFAULT 0,
  actual_reward   numeric(20,8) NOT NULL DEFAULT 0,
  status          text          NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','completed','cancelled')),
  unstaked_at     timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_stakes_user_active
  ON public.user_stakes (user_id, status, lock_until);

ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stakes"
  ON public.user_stakes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role manages stakes"
  ON public.user_stakes FOR ALL USING (auth.role() = 'service_role');

-- View: total staked per token (used for totalStaked display in UI)
CREATE OR REPLACE VIEW public.staking_pool_stats AS
SELECT
  token_symbol,
  token_name,
  COUNT(*)                    AS staker_count,
  SUM(amount_staked)          AS total_staked,
  AVG(apy)                    AS pool_apy,
  MAX(lock_days)              AS max_lock_days
FROM public.user_stakes
WHERE status = 'active'
GROUP BY token_symbol, token_name;

GRANT SELECT ON public.staking_pool_stats TO authenticated;

-- RPC: unstake (only after lock_until has passed)
CREATE OR REPLACE FUNCTION public.unstake(p_stake_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stake public.user_stakes;
BEGIN
  SELECT * INTO v_stake FROM public.user_stakes
  WHERE id = p_stake_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stake not found';
  END IF;

  IF v_stake.status != 'active' THEN
    RAISE EXCEPTION 'Stake is not active';
  END IF;

  IF now() < v_stake.lock_until THEN
    RAISE EXCEPTION 'Lock period has not expired. Unlocks at %', v_stake.lock_until;
  END IF;

  -- Mark completed, record actual reward
  UPDATE public.user_stakes
  SET status = 'completed',
      actual_reward = expected_reward,
      unstaked_at = now()
  WHERE id = p_stake_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unstake(uuid) TO authenticated;
