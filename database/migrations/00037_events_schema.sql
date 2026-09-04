-- Migration 00037: Events Schema
-- First-class entity for Professional Events

-- 1. Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- startup meetup, technology conference, hackathon, career fair, networking event, workshop, webinar, hiring event, community meetup
    location geography(Point, 4326),
    location_name VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    capacity INTEGER,
    visibility VARCHAR(20) DEFAULT 'public' NOT NULL, -- public, private, invite_only
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create event_attendees table
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered' NOT NULL, -- registered, attended, cancelled, waitlisted
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(event_id, user_id)
);

-- 3. RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_events ON public.events
    FOR SELECT USING (
        visibility = 'public' 
        OR (visibility IN ('private', 'invite_only') AND EXISTS (
            SELECT 1 FROM public.event_attendees ea WHERE ea.event_id = public.events.id AND ea.user_id = auth.uid()
        ))
        OR creator_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER', 'MEMBER']))
        OR public.is_admin(auth.uid())
    );

CREATE POLICY insert_events ON public.events
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id AND
        (organization_id IS NULL OR public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER', 'MEMBER']))
    );

CREATE POLICY update_events ON public.events
    FOR UPDATE USING (
        creator_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN']))
        OR public.is_admin(auth.uid())
    );

CREATE POLICY delete_events ON public.events
    FOR DELETE USING (
        creator_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN']))
        OR public.is_admin(auth.uid())
    );

-- 4. RLS for event_attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_event_attendees ON public.event_attendees
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.events e WHERE e.id = event_id AND (
                e.creator_id = auth.uid() OR
                (e.organization_id IS NOT NULL AND public.has_organization_role(e.organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER', 'MEMBER']))
            )
        )
        OR public.is_admin(auth.uid())
    );

CREATE POLICY insert_event_attendees ON public.event_attendees
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY update_event_attendees ON public.event_attendees
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.events e WHERE e.id = event_id AND (
                e.creator_id = auth.uid() OR
                (e.organization_id IS NOT NULL AND public.has_organization_role(e.organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER', 'MEMBER']))
            )
        )
        OR public.is_admin(auth.uid())
    );

CREATE POLICY delete_event_attendees ON public.event_attendees
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.events e WHERE e.id = event_id AND (
                e.creator_id = auth.uid() OR
                (e.organization_id IS NOT NULL AND public.has_organization_role(e.organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER']))
            )
        )
        OR public.is_admin(auth.uid())
    );

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_events_organization ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON public.event_attendees(user_id);
