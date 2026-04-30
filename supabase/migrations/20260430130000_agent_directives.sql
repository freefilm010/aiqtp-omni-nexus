-- =============================================================================
-- Agent Directives — QuantClaw Command Center dispatch bus
--
-- This table is the async message bus between the QuantClaw React UI and the
-- Render Python Worker:
--
--   UI (frontend)  → INSERT a directive row with tool + params
--   Python Worker  → polls for 'pending' rows, executes, writes result back
--   UI (realtime)  → subscribes to changes on its own rows to show live status
--
-- Tool routing:
--   search_*              → qaqi-agent / aiqtp-agent edge functions (NOT this table)
--   freqtrade_backtest    → Worker backtest simulation
--   freqtrade_optimize    → Worker optimization simulation
--   ccxt_sim_order        → Worker paper trade (no broker)
--   ccxt_live_order       → Worker → Alpaca REST API (prod-gated only)
--   factor_generation     → Worker factor engine
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_directives (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool        text        NOT NULL,
  agent_type  text        NOT NULL DEFAULT 'dev',
  params      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status      text        NOT NULL DEFAULT 'pending',
  result      jsonb,
  error_msg   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for the worker's polling query: SELECT WHERE status='pending' ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_agent_directives_pending
  ON public.agent_directives (status, created_at ASC)
  WHERE status = 'pending';

-- Index so the UI can efficiently load its own directive history
CREATE INDEX IF NOT EXISTS idx_agent_directives_user
  ON public.agent_directives (user_id, created_at DESC);

ALTER TABLE public.agent_directives ENABLE ROW LEVEL SECURITY;

-- Authenticated users manage their own directive rows (insert + read results)
CREATE POLICY "Users manage own directives"
  ON public.agent_directives FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role (Python Worker on Render) has full access:
--   SELECT to poll pending rows, UPDATE to write status/result
CREATE POLICY "Service role manages all directives"
  ON public.agent_directives FOR ALL
  USING (auth.role() = 'service_role');

-- Constraint: ccxt_live_order is only valid for prod agent
-- Enforced in application layer (worker rejects; migration documents intent)
-- ALTER TABLE public.agent_directives
--   ADD CONSTRAINT chk_live_order_prod_only
--   CHECK (tool <> 'ccxt_live_order' OR agent_type = 'prod');
-- NOTE: constraint commented out so the worker can surface a meaningful error_msg
-- rather than a PG constraint violation when a dev-agent live order is attempted.
