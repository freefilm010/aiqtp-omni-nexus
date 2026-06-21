CREATE INDEX IF NOT EXISTS idx_faucet_claims_user_id
  ON public.faucet_claims (user_id);

CREATE INDEX IF NOT EXISTS idx_faucet_claims_user_created_at_desc
  ON public.faucet_claims (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_invest_transactions_engine_created_at
  ON public.auto_invest_transactions (engine_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_auto_invest_transactions_engine_created_at_desc
  ON public.auto_invest_transactions (engine_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auto_invest_engine_id_user_id
  ON public.auto_invest_engine (id, user_id);

CREATE INDEX IF NOT EXISTS idx_ai_strategies_user_graduated
  ON public.ai_strategies (user_id, is_graduated);

CREATE INDEX IF NOT EXISTS idx_ai_factors_user_id
  ON public.ai_factors (user_id);

CREATE INDEX IF NOT EXISTS idx_agent_directives_user_created_at_desc
  ON public.agent_directives (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_directives_pending_created_at
  ON public.agent_directives (created_at ASC)
  WHERE status = 'pending';