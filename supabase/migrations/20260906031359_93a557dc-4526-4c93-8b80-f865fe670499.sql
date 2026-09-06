CREATE INDEX IF NOT EXISTS idx_graduation_tests_strategy_cycle_type
ON public.graduation_tests (strategy_id, ((test_data->>'cycle_type')));

CREATE INDEX IF NOT EXISTS idx_compound_snapshots_engine_snapshot_at
ON public.compound_snapshots (engine_id, snapshot_at DESC);