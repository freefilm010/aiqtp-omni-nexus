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
