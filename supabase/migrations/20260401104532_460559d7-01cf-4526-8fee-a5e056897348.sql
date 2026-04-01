
DO $$
BEGIN
  -- Remove chat_messages from realtime if it's published
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
  END IF;

  -- Remove elite_club_messages from realtime if it's published
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'elite_club_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.elite_club_messages;
  END IF;
END $$;
