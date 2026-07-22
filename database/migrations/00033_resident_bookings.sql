-- Migration: Resident Booking Engine Schema (Phase 33)

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price > 0.00),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'disputed', 'resolved')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Alter escrows to make opportunity_id optional and add booking_id link
ALTER TABLE public.escrows ALTER COLUMN opportunity_id DROP NOT NULL;
ALTER TABLE public.escrows ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_bookings ON public.bookings FOR SELECT
    USING (auth.uid() = resident_id OR auth.uid() = worker_id);

CREATE POLICY insert_bookings ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = resident_id);

CREATE POLICY update_bookings ON public.bookings FOR UPDATE
    USING (auth.uid() = resident_id OR auth.uid() = worker_id);

-- Enable Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
END $$;
