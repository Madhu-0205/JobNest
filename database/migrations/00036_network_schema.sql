-- Migration 00036: Professional Network Schema

-- 1. Create connections table
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, accepted, rejected, withdrawn, blocked
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT connections_prevent_self CHECK (requester_id != recipient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_connections 
ON public.connections (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));

-- 2. Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'user' or 'organization'
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_follows
ON public.follows (follower_id, target_type, target_id);

-- 3. Create professional_posts table
CREATE TABLE IF NOT EXISTS public.professional_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- If posted as a company
    post_type VARCHAR(50) DEFAULT 'update', -- 'update', 'hiring', 'achievement', 'project'
    content TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. RLS for connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_connections ON public.connections
    FOR SELECT USING (
        auth.uid() = requester_id OR 
        auth.uid() = recipient_id OR 
        public.is_admin(auth.uid())
    );

CREATE POLICY insert_connections ON public.connections
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id
    );

CREATE POLICY update_connections ON public.connections
    FOR UPDATE USING (
        auth.uid() = requester_id OR 
        auth.uid() = recipient_id OR 
        public.is_admin(auth.uid())
    ) WITH CHECK (
        auth.uid() = requester_id OR 
        auth.uid() = recipient_id OR 
        public.is_admin(auth.uid())
    );

CREATE POLICY delete_connections ON public.connections
    FOR DELETE USING (
        auth.uid() = requester_id OR 
        auth.uid() = recipient_id OR 
        public.is_admin(auth.uid())
    );

-- 5. RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_follows ON public.follows
    FOR SELECT USING (TRUE); -- Publicly viewable

CREATE POLICY insert_follows ON public.follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id
    );

CREATE POLICY delete_follows ON public.follows
    FOR DELETE USING (
        auth.uid() = follower_id OR public.is_admin(auth.uid())
    );

-- 6. RLS for professional_posts
ALTER TABLE public.professional_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_professional_posts ON public.professional_posts
    FOR SELECT USING (TRUE); -- Publicly viewable for now

CREATE POLICY insert_professional_posts ON public.professional_posts
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        (organization_id IS NULL OR public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER', 'MEMBER']))
    );

CREATE POLICY update_professional_posts ON public.professional_posts
    FOR UPDATE USING (
        auth.uid() = author_id OR public.is_admin(auth.uid())
    );

CREATE POLICY delete_professional_posts ON public.professional_posts
    FOR DELETE USING (
        auth.uid() = author_id OR public.is_admin(auth.uid())
    );

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON public.connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);
CREATE INDEX IF NOT EXISTS idx_follows_target ON public.follows(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.professional_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_org ON public.professional_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.professional_posts(created_at DESC);
