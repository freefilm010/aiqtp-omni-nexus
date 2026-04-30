-- =============================================================================
-- Core Trading Schema — AIQTP Omni-Nexus Control Panel Architecture
--
-- This migration establishes the data layer that separates the frontend
-- Control Panel from the Python trading worker on Render:
--
--   strategy_registry   → frontend writes configs; worker reads and executes
--   system_status       → frontend writes kill-switch flag; worker checks it
--   performance_evaluator → worker writes results; frontend reads via realtime
--   trade_logs (ALTER)  → worker writes trades; frontend reads via realtime
--                          (table already exists — only new columns added)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. strategy_registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strategy_registry (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    text          NOT NULL,
  description             text,
  bot_type                text          NOT NULL,
  data_category           text          NOT NULL,
  collection_frequency    text          NOT NULL,
  sources                 jsonb         NOT NULL DEFAULT '[]'::jsonb,
  creator_profit_share    integer       NOT NULL DEFAULT 30,
  aggregation_rules       jsonb         NOT NULL DEFAULT '{}'::jsonb,
  is_active               boolean       NOT NULL DEFAULT false,
  pending_graduation      boolean       NOT NULL DEFAULT false,
  is_graduated            boolean       NOT NULL DEFAULT false,
  quality_score           numeric(5,2)  NOT NULL DEFAULT 0,
  reliability_score       numeric(5,2)  NOT NULL DEFAULT 0,
  total_records_collected bigint        NOT NULL DEFAULT 0,
  total_earnings          numeric(20,4) NOT NULL DEFAULT 0,
  created_at              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategy_registry_user
  ON public.strategy_registry (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_registry_active
  ON public.strategy_registry (is_active)
  WHERE is_active = true;

ALTER TABLE public.strategy_registry ENABLE ROW LEVEL SECURITY;

-- Authenticated users manage their own strategies (Control Panel writes)
CREATE POLICY "Users manage own strategies"
  ON public.strategy_registry FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role (Python worker) can read all active strategies
CREATE POLICY "Service role manages all strategies"
  ON public.strategy_registry FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2. system_status
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_status (
  key        text        PRIMARY KEY,
  active     boolean     NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  reason     text
);

ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;

-- All authenticated sessions read status (MasterKillSwitch badge)
CREATE POLICY "Authenticated users read system status"
  ON public.system_status FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can upsert the kill-switch row (Control Panel writes)
CREATE POLICY "Authenticated users upsert system status"
  ON public.system_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update system status"
  ON public.system_status FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role (Python worker) has full access
CREATE POLICY "Service role manages system status"
  ON public.system_status FOR ALL
  USING (auth.role() = 'service_role');

-- Seed the canonical control row so the UI never gets a null read
INSERT INTO public.system_status (key, active, reason)
VALUES ('main', true, 'System initialized')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. performance_evaluator
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_evaluator (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id    uuid         REFERENCES public.strategy_registry(id) ON DELETE CASCADE,
  win_rate       numeric(5,2) NOT NULL DEFAULT 0,
  max_drawdown   numeric(5,2) NOT NULL DEFAULT 0,
  profit_factor  numeric(8,4) NOT NULL DEFAULT 0,
  total_trades   integer      NOT NULL DEFAULT 0,
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perf_eval_strategy
  ON public.performance_evaluator (strategy_id, updated_at DESC);

ALTER TABLE public.performance_evaluator ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (SignalMonitor dashboard)
CREATE POLICY "Authenticated users read performance"
  ON public.performance_evaluator FOR SELECT
  TO authenticated
  USING (true);

-- Only the Python worker (service role) writes performance data
CREATE POLICY "Service role manages performance"
  ON public.performance_evaluator FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4. trade_logs — ADD COLUMNS ONLY (table already exists)
--
-- The trade-execute edge function writes using the original columns.
-- These new columns are populated by the Python worker on Render.
-- No existing columns are modified to preserve backward compatibility.
-- ---------------------------------------------------------------------------
ALTER TABLE public.trade_logs
  ADD COLUMN IF NOT EXISTS strategy_id  uuid         REFERENCES public.strategy_registry(id),
  ADD COLUMN IF NOT EXISTS direction    text,
  ADD COLUMN IF NOT EXISTS entry_price  numeric(20,8),
  ADD COLUMN IF NOT EXISTS exit_price   numeric(20,8),
  ADD COLUMN IF NOT EXISTS closed_at    timestamptz;

CREATE INDEX IF NOT EXISTS idx_trade_logs_strategy
  ON public.trade_logs (strategy_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trade_logs_status_created
  ON public.trade_logs (status, created_at DESC);
