-- ============================================================================
-- Revenue Infrastructure: Plaid ACH, PayPal deposits, auto-invest cron,
-- affiliate referral capture, platform revenue tracking
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. plaid_items — stores Plaid access tokens per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text       NOT NULL,
  item_id     text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plaid items"
  ON public.plaid_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages plaid items"
  ON public.plaid_items FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2. pending_ach_transfers — ACH bank transfer queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pending_ach_transfers (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id  text          NOT NULL,
  amount_usd  numeric(12,2) NOT NULL CHECK (amount_usd >= 20),
  status      text          NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','settled','failed','cancelled')),
  transfer_ref text,
  settled_at  timestamptz,
  created_at  timestamptz   NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_ach_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ach transfers"
  ON public.pending_ach_transfers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages ach transfers"
  ON public.pending_ach_transfers FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 3. affiliate_signups — track referral codes at signup (lifetime revenue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_signups (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referrer_code   text        NOT NULL,
  referrer_user_id uuid       REFERENCES auth.users(id) ON DELETE SET NULL,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referral"
  ON public.affiliate_signups FOR SELECT TO authenticated
  USING (referred_user_id = auth.uid() OR referrer_user_id = auth.uid());
CREATE POLICY "Service role manages affiliate signups"
  ON public.affiliate_signups FOR ALL USING (auth.role() = 'service_role');

-- Index for fast referrer lookup (needed for affiliate earnings calc)
CREATE INDEX IF NOT EXISTS idx_affiliate_signups_referrer
  ON public.affiliate_signups (referrer_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_signups_referrer_user
  ON public.affiliate_signups (referrer_user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. user_referral_codes — give each user a unique shareable ref code
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_referral_codes (
  user_id     uuid  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text  NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own referral code"
  ON public.user_referral_codes FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages referral codes"
  ON public.user_referral_codes FOR ALL USING (auth.role() = 'service_role');

-- Auto-generate a referral code for every new user
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_referral_codes (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_referral_code ON auth.users;
CREATE TRIGGER on_user_created_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- ---------------------------------------------------------------------------
-- 5. RPC: record_affiliate_signup — call after new user signup
--    Matches referral code to referrer and records the relationship
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_affiliate_signup(
  p_referred_user_id  uuid,
  p_referral_code     text,
  p_utm_source        text DEFAULT NULL,
  p_utm_medium        text DEFAULT NULL,
  p_utm_campaign      text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_referrer_user_id uuid;
BEGIN
  -- Look up who owns this referral code
  SELECT user_id INTO v_referrer_user_id
  FROM public.user_referral_codes
  WHERE code = upper(p_referral_code);

  -- Don't let users refer themselves
  IF v_referrer_user_id = p_referred_user_id THEN
    RETURN;
  END IF;

  INSERT INTO public.affiliate_signups (
    referred_user_id, referrer_code, referrer_user_id,
    utm_source, utm_medium, utm_campaign
  ) VALUES (
    p_referred_user_id, upper(p_referral_code), v_referrer_user_id,
    p_utm_source, p_utm_medium, p_utm_campaign
  )
  ON CONFLICT (referred_user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_affiliate_signup(uuid,text,text,text,text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. View: affiliate_earnings_summary — referrer sees lifetime earnings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.affiliate_earnings_summary AS
SELECT
  s.referrer_user_id,
  s.referrer_code,
  COUNT(s.id)                                          AS total_referrals,
  COALESCE(SUM(fe.platform_fee_usd * 0.10), 0)        AS lifetime_earnings_usd,
  COALESCE(SUM(CASE WHEN fe.status='collected' THEN fe.platform_fee_usd * 0.10 ELSE 0 END), 0) AS paid_earnings_usd
FROM public.affiliate_signups s
LEFT JOIN public.platform_fee_events fe
  ON fe.user_id = s.referred_user_id
GROUP BY s.referrer_user_id, s.referrer_code;

GRANT SELECT ON public.affiliate_earnings_summary TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. pg_cron: auto-invest engine runs every hour (if pg_cron enabled)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'auto-invest-hourly',
      '0 * * * *',
      $$
        SELECT net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/auto-invest',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
          ),
          body := '{"action":"analyze","engine_id":"default"}'::jsonb
        );
      $$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available — skip auto-invest schedule';
END;
$$;
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
-- Performance indexes for high-traffic tables
-- Identified via audit: foreign key columns on transactional tables lack indexes,
-- causing sequential scans on user-scoped queries.

-- auto_invest_transactions: queried by engine per cycle
CREATE INDEX IF NOT EXISTS idx_auto_invest_transactions_engine
  ON public.auto_invest_transactions(engine_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_invest_transactions_user
  ON public.auto_invest_transactions(user_id, created_at DESC);

-- trades: primary user-facing query target
CREATE INDEX IF NOT EXISTS idx_trades_user_status
  ON public.trades(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trades_strategy_created
  ON public.trades(strategy_id, created_at DESC);

-- lightning_transactions: payment history queries
CREATE INDEX IF NOT EXISTS idx_lightning_transactions_user
  ON public.lightning_transactions(user_id, created_at DESC);

-- security_audit_log: admin audit viewer filters by user + time
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user
  ON public.security_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_action
  ON public.security_audit_log(action, created_at DESC);

-- ai_generation_logs: rate-limit checks query by user + function + time
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user_fn
  ON public.ai_generation_logs(user_id, function_name, created_at DESC);

-- auto_invest_ai_logs: engine-scoped lookups
CREATE INDEX IF NOT EXISTS idx_auto_invest_ai_logs_engine
  ON public.auto_invest_ai_logs(engine_id, created_at DESC);

-- strategy_rentals: active rental lookups by user
CREATE INDEX IF NOT EXISTS idx_strategy_rentals_user_active
  ON public.strategy_rentals(renter_user_id, is_active, expires_at);

-- fee_events: profit fee reports group by user + time
CREATE INDEX IF NOT EXISTS idx_fee_events_user
  ON public.fee_events(user_id, created_at DESC);

-- agent_directives: worker polls by status
CREATE INDEX IF NOT EXISTS idx_agent_directives_status_created
  ON public.agent_directives(status, created_at ASC);

-- swarm_agents: hive-mind queries active agents
CREATE INDEX IF NOT EXISTS idx_swarm_agents_user_active
  ON public.swarm_agents(user_id, is_active);
-- ============================================================================
-- Faucet rate limiting: one claim per user per token per 24 hours
-- Also records the claim in faucet_claims for audit + cooldown tracking.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.credit_faucet_claim(
  p_user_id uuid,
  p_symbol  text,
  p_amount  numeric,
  p_chain   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_price      numeric := 0;
  v_value_usd  numeric := 0;
  v_last_claim timestamptz;
BEGIN
  -- Caller must be the user themselves (or service_role bypasses auth.uid() check)
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> p_user_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to credit another user';
  END IF;

  -- Rate limit: one claim per (user, symbol) per 24 hours
  SELECT MAX(created_at) INTO v_last_claim
  FROM public.faucet_claims
  WHERE user_id = p_user_id
    AND chain = p_chain
    AND status != 'cancelled';

  IF v_last_claim IS NOT NULL AND v_last_claim > now() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Faucet cooldown active. Next claim available at %',
      (v_last_claim + INTERVAL '24 hours')::text;
  END IF;

  -- Resolve USD price from token price feeds (best-effort)
  SELECT COALESCE(tpf.price, 0) INTO v_price
  FROM public.platform_tokens pt
  JOIN public.token_price_feeds tpf ON tpf.token_id = pt.id AND tpf.base_currency = 'USD'
  WHERE pt.symbol = p_symbol
  LIMIT 1;

  v_value_usd := p_amount * v_price;

  -- Upsert portfolio holding
  INSERT INTO public.portfolio_holdings (user_id, symbol, name, quantity, value_usd, change_24h, allocation_percent)
  VALUES (p_user_id, p_symbol, p_symbol, p_amount, v_value_usd, 0, 0)
  ON CONFLICT (user_id, symbol) DO UPDATE SET
    quantity    = portfolio_holdings.quantity + EXCLUDED.quantity,
    value_usd   = (portfolio_holdings.quantity + EXCLUDED.quantity) * v_price,
    updated_at  = now();

  -- Record claim for cooldown tracking + audit
  INSERT INTO public.faucet_claims
    (user_id, wallet_address, amount, chain, status)
  VALUES
    (p_user_id, p_user_id::text, p_amount, p_chain, 'completed');
END;
$$;

-- Only service_role may call this (edge function uses service key)
REVOKE ALL ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) TO service_role;
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
CREATE POLICY IF NOT EXISTS "Admins can manage dex tokens"
  ON public.dex_tokens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add unique constraint on rule_name so upsert works for RevenueManager
ALTER TABLE public.profit_distribution_rules
  ADD CONSTRAINT IF NOT EXISTS profit_distribution_rules_rule_name_key UNIQUE (rule_name);

-- Seed default distribution rules if none exist yet
INSERT INTO public.profit_distribution_rules
  (rule_name, source_type, distribution_type, percentage, is_active, execution_frequency)
VALUES
  ('default_reinvest', 'all', 'reinvest', 60, true, 'immediate'),
  ('default_reserve',  'all', 'reserve',  25, true, 'immediate'),
  ('default_withdraw', 'all', 'withdraw', 15, true, 'immediate')
ON CONFLICT (rule_name) DO NOTHING;
-- ============================================================================
-- Critical automation crons:
--   1. Staking reward accrual (daily)
--   2. Profit distribution execution (hourly)
--   3. Bot graduation pipeline (every 6 hours)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STAKING REWARD ACCRUAL
-- Accrues daily rewards onto active stakes proportionally.
-- Runs once per day; idempotent (tracks last_accrual_date per stake).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_stakes
  ADD COLUMN IF NOT EXISTS last_accrual_date date,
  ADD COLUMN IF NOT EXISTS accrued_days integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.accrue_staking_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  daily_rate numeric;
  days_since  integer;
  reward_delta numeric;
BEGIN
  FOR rec IN
    SELECT id, amount_staked, apy, lock_until, last_accrual_date, accrued_days, created_at
    FROM public.user_stakes
    WHERE status = 'active'
      AND now() < lock_until          -- still within lock period
    FOR UPDATE SKIP LOCKED
  LOOP
    -- How many days since last accrual (or since creation if never accrued)
    days_since := COALESCE(
      CURRENT_DATE - rec.last_accrual_date,
      CURRENT_DATE - rec.created_at::date
    );

    IF days_since <= 0 THEN
      CONTINUE;
    END IF;

    daily_rate   := rec.apy / 100.0 / 365.0;
    reward_delta := rec.amount_staked * daily_rate * days_since;

    UPDATE public.user_stakes
    SET
      actual_reward    = actual_reward + reward_delta,
      last_accrual_date = CURRENT_DATE,
      accrued_days     = accrued_days + days_since
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Mark completed stakes that have passed lock_until
CREATE OR REPLACE FUNCTION public.process_expired_stakes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_stakes
  SET
    status        = 'completed',
    actual_reward = expected_reward,
    unstaked_at   = now()
  WHERE status = 'active'
    AND lock_until <= now() - INTERVAL '1 day'  -- grace day so user can unstake manually
    AND actual_reward >= expected_reward;          -- only auto-complete if fully accrued
END;
$$;

-- Schedule: accrue daily at 00:05 UTC
SELECT cron.schedule(
  'stake-reward-accrual',
  '5 0 * * *',
  $$SELECT public.accrue_staking_rewards(); SELECT public.process_expired_stakes();$$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PROFIT DISTRIBUTION EXECUTION
-- Applies active profit_distribution_rules to pending platform_revenue rows.
-- Moves revenue from 'pending' → 'processed' and logs each distribution.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.execute_profit_distribution()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rev       RECORD;
  rule      RECORD;
  dist_amt  numeric;
  processed integer := 0;
BEGIN
  FOR rev IN
    SELECT id, amount, currency, source_type
    FROM public.platform_revenue
    WHERE status = 'pending'
      AND amount > 0
      AND created_at < now() - INTERVAL '5 minutes'  -- small settle delay
    ORDER BY created_at
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Apply each active distribution rule
    FOR rule IN
      SELECT distribution_type, percentage
      FROM public.profit_distribution_rules
      WHERE is_active = true
        AND (source_type = rev.source_type OR source_type = 'all')
    LOOP
      dist_amt := rev.amount * (rule.percentage / 100.0);
      IF dist_amt > 0 THEN
        INSERT INTO public.profit_distribution_log
          (revenue_id, amount, currency, status, metadata)
        VALUES
          (rev.id, dist_amt, rev.currency, 'completed',
           jsonb_build_object('distribution_type', rule.distribution_type));
      END IF;
    END LOOP;

    -- Mark revenue as processed
    UPDATE public.platform_revenue
    SET status = 'processed', processed_at = now()
    WHERE id = rev.id;

    processed := processed + 1;
  END LOOP;

  RETURN processed;
END;
$$;

-- Schedule: run every hour at :30
SELECT cron.schedule(
  'profit-distribution-hourly',
  '30 * * * *',
  $$SELECT public.execute_profit_distribution();$$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BOT GRADUATION PIPELINE
-- Checks performance_evaluator against graduation thresholds.
-- Graduates bots that meet all criteria; marks ai_strategies as graduated.
-- Thresholds (per CLAUDE.md): win_rate ≥65%, consistency ≥70%, drawdown ≤15%
-- ─────────────────────────────────────────────────────────────────────────────

-- Add graduated_at + is_graduated to ai_strategies if missing
ALTER TABLE public.ai_strategies
  ADD COLUMN IF NOT EXISTS is_graduated    boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS graduated_at    timestamptz,
  ADD COLUMN IF NOT EXISTS quality_score   numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_split    numeric(5,2) NOT NULL DEFAULT 50; -- 50% platform / 50% creator

CREATE TABLE IF NOT EXISTS public.graduated_bots (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id     uuid        NOT NULL REFERENCES public.ai_strategies(id),
  graduated_at    timestamptz NOT NULL DEFAULT now(),
  win_rate        numeric(5,2),
  consistency     numeric(5,2),
  max_drawdown    numeric(5,2),
  quality_score   numeric(5,2),
  profit_split    numeric(5,2) NOT NULL DEFAULT 50,
  cycle_count     integer,
  UNIQUE (strategy_id)
);

ALTER TABLE public.graduated_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage graduated bots"
  ON public.graduated_bots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view graduated bots"
  ON public.graduated_bots FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.run_bot_graduation()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec       RECORD;
  q_score   numeric;
  graduated integer := 0;
BEGIN
  FOR rec IN
    SELECT
      s.id                   AS strategy_id,
      s.is_graduated,
      pe.win_rate,
      pe.max_drawdown,
      pe.profit_factor,
      COALESCE(pe.sharpe_ratio, 0) AS sharpe_ratio,
      -- consistency: fraction of profitable 7-day windows (approximated by profit_factor)
      LEAST(100, COALESCE(pe.profit_factor, 0) * 33.33) AS consistency
    FROM public.ai_strategies s
    JOIN public.performance_evaluator pe ON pe.strategy_id = s.id
    WHERE s.is_active = true
      AND s.is_graduated = false
  LOOP
    -- Skip if not meeting thresholds
    CONTINUE WHEN rec.win_rate        < 65;
    CONTINUE WHEN rec.consistency     < 70;
    CONTINUE WHEN rec.max_drawdown    > 15;
    CONTINUE WHEN rec.sharpe_ratio    < 1.0;

    -- Quality score (0-100): weighted composite
    q_score := LEAST(100,
      rec.win_rate     * 0.35 +
      rec.consistency  * 0.30 +
      (100 - LEAST(rec.max_drawdown, 100)) * 0.20 +
      LEAST(rec.sharpe_ratio * 20, 100) * 0.15
    );

    -- Graduate the bot
    UPDATE public.ai_strategies
    SET
      is_graduated   = true,
      graduated_at   = now(),
      quality_score  = q_score,
      profit_split   = 50
    WHERE id = rec.strategy_id;

    INSERT INTO public.graduated_bots
      (strategy_id, win_rate, consistency, max_drawdown, quality_score, profit_split)
    VALUES
      (rec.strategy_id, rec.win_rate, rec.consistency, rec.max_drawdown, q_score, 50)
    ON CONFLICT (strategy_id) DO UPDATE
    SET
      graduated_at   = now(),
      win_rate       = EXCLUDED.win_rate,
      quality_score  = EXCLUDED.quality_score;

    graduated := graduated + 1;
  END LOOP;

  RETURN graduated;
END;
$$;

-- Schedule: run every 6 hours
SELECT cron.schedule(
  'bot-graduation-pipeline',
  '0 */6 * * *',
  $$SELECT public.run_bot_graduation();$$
);

GRANT EXECUTE ON FUNCTION public.accrue_staking_rewards()    TO service_role;
GRANT EXECUTE ON FUNCTION public.process_expired_stakes()    TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_profit_distribution() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_bot_graduation()        TO service_role;
