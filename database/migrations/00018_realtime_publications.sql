-- Migration: Register tables in Supabase Realtime Replication publication (Phase 6)
DO $$
DECLARE
    pub_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) INTO pub_exists;

    IF pub_exists THEN
        -- Enable Realtime events for tables
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_tracking;
    END IF;
END $$;
