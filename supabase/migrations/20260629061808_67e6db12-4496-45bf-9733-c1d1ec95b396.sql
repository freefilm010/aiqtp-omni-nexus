-- Scope Realtime broadcast/presence channels to authenticated users (anon cannot subscribe).
-- Postgres_changes subscriptions are unaffected — they continue to apply per-table RLS for row visibility.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='realtime' AND c.relname='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND policyname='authenticated_can_receive_realtime') THEN
      EXECUTE $p$CREATE POLICY "authenticated_can_receive_realtime" ON realtime.messages FOR SELECT TO authenticated USING (true)$p$;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND policyname='authenticated_can_send_realtime') THEN
      EXECUTE $p$CREATE POLICY "authenticated_can_send_realtime" ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true)$p$;
    END IF;
  END IF;
END $$;