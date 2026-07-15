-- Migration: Realtime Operations Platform Tables (Phase 6)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT unique_employer_worker_opportunity UNIQUE (employer_id, worker_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' NOT NULL, -- text, image, voice, location, system
    content TEXT,
    attachment_url TEXT,
    location_lat NUMERIC,
    location_lon NUMERIC,
    delivery_status VARCHAR(50) DEFAULT 'sent' NOT NULL, -- sent, delivered, read
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.live_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    speed NUMERIC,
    heading NUMERIC,
    accuracy NUMERIC,
    status VARCHAR(50) DEFAULT 'available' NOT NULL, -- online, offline, busy, working, available, invisible
    last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.realtime_events_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, processed, failed
    attempts INTEGER DEFAULT 0 NOT NULL,
    error_message TEXT,
    client_timestamp TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.realtime_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- Indexing for high-performance queries
CREATE INDEX IF NOT EXISTS idx_chat_rooms_employer ON public.chat_rooms (employer_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_worker ON public.chat_rooms (worker_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_tracking_user ON public.live_tracking (user_id);
CREATE INDEX IF NOT EXISTS idx_events_queue_user_status ON public.realtime_events_queue (user_id, status);
CREATE INDEX IF NOT EXISTS idx_realtime_audit_logs_event ON public.realtime_audit_logs (event_type, created_at DESC);
