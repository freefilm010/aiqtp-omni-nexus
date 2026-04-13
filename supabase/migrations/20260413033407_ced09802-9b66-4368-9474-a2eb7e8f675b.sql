-- 1. Remove sensitive tables from Realtime publication (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'elite_club_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.elite_club_messages;
  END IF;
END $$;

-- 2. Fix market_alerts: remove the overly broad policy that leaks null-user_id alerts
DROP POLICY IF EXISTS "Users read own alerts" ON public.market_alerts;
DROP POLICY IF EXISTS "Authenticated users can view market alerts" ON public.market_alerts;
DROP POLICY IF EXISTS "Users can view own market alerts" ON public.market_alerts;

-- Users can only see their own alerts
CREATE POLICY "Users read own alerts"
ON public.market_alerts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can see all alerts including system (null user_id) alerts
DROP POLICY IF EXISTS "Admins read all alerts" ON public.market_alerts;
CREATE POLICY "Admins read all alerts"
ON public.market_alerts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));