-- =============================================================================
-- AIQTP Render PostgreSQL — Core Brain Tables
-- =============================================================================
-- Run once against your Render PostgreSQL database to create the tables
-- that the trading worker and trading-service read/write.
-- These mirror the Supabase cloud schema without auth.users FK constraints.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── account_key_vault ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_key_vault (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL,
  account_id        text        NOT NULL,
  api_key_encrypted text        NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_id)
);

-- ── system_status ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_status (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text        NOT NULL UNIQUE,
  value      text        NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.system_status (key, value) VALUES ('trading_active', 'true')
  ON CONFLICT (key) DO NOTHING;

-- ── trade_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_logs (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL,
  strategy_id      uuid,
  action           text          NOT NULL,
  symbol           text,
  direction        text,
  entry_price      numeric(20,8),
  exit_price       numeric(20,8),
  realized_pnl_usd numeric(20,4),
  fee              numeric(20,4) NOT NULL DEFAULT 0,
  slippage_pct     numeric(10,6),
  status           text          NOT NULL DEFAULT 'closed',
  closed_at        timestamptz,
  created_at       timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trade_logs_status ON public.trade_logs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_logs_user   ON public.trade_logs (user_id, created_at DESC);

-- ── strategy_registry ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.strategy_registry (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid          NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_strategy_user ON public.strategy_registry (user_id, created_at DESC);

-- ── agent_directives ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_directives (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  tool        text        NOT NULL,
  agent_type  text        NOT NULL DEFAULT 'dev',
  params      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status      text        NOT NULL DEFAULT 'pending',
  result      jsonb,
  error_msg   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_directives_pending
  ON public.agent_directives (status, created_at ASC)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_agent_directives_user
  ON public.agent_directives (user_id, created_at DESC);

-- ── performance_evaluator ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.performance_evaluator (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id       uuid          NOT NULL,
  user_id           uuid          NOT NULL,
  total_trades      integer       NOT NULL DEFAULT 0,
  win_rate          numeric(5,2)  NOT NULL DEFAULT 0,
  profit_factor     numeric(10,4) NOT NULL DEFAULT 0,
  total_pnl_usd     numeric(20,4) NOT NULL DEFAULT 0,
  max_drawdown_pct  numeric(10,4) NOT NULL DEFAULT 0,
  sharpe_ratio      numeric(10,4),
  evaluated_at      timestamptz   NOT NULL DEFAULT now()
);
