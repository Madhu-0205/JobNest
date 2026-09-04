-- Migration 00035: Organizations Foundation

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    logo_url TEXT,
    description TEXT,
    industry VARCHAR(100),
    organization_type VARCHAR(50) DEFAULT 'COMPANY',
    website TEXT,
    location GEOGRAPHY(Point, 4326),
    gst_number VARCHAR(15),
    categories TEXT[],
    verification_status VARCHAR(50) DEFAULT 'unverified',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER' NOT NULL, -- OWNER, ADMIN, RECRUITER, MEMBER
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (organization_id, user_id)
);

-- 3. Add organization_id to employer_profiles
ALTER TABLE public.employer_profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 4. Add organization_id to opportunities
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 5. Data Migration: Create organizations for existing employer_profiles
DO $$
DECLARE
    emp_record RECORD;
    new_org_id UUID;
    org_slug VARCHAR(255);
BEGIN
    FOR emp_record IN SELECT * FROM public.employer_profiles WHERE organization_id IS NULL LOOP
        -- Generate a simple slug
        org_slug := lower(regexp_replace(coalesce(emp_record.company_name, 'org-' || substr(emp_record.user_id::text, 1, 8)), '[^a-zA-Z0-9]+', '-', 'g'));
        
        -- Append random chars to slug to avoid collisions if necessary (naive approach for this migration)
        org_slug := org_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

        -- Insert into organizations
        INSERT INTO public.organizations (
            name, slug, description, industry, website, location, gst_number, categories, verification_status
        ) VALUES (
            coalesce(emp_record.company_name, 'Unknown Organization'),
            org_slug,
            emp_record.bio,
            emp_record.industry,
            emp_record.company_website,
            emp_record.location,
            emp_record.gst_number,
            emp_record.categories,
            coalesce(emp_record.verification_status, 'unverified')
        ) RETURNING id INTO new_org_id;

        -- Insert owner into organization_members
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (new_org_id, emp_record.user_id, 'OWNER');

        -- Update employer_profile
        UPDATE public.employer_profiles
        SET organization_id = new_org_id
        WHERE user_id = emp_record.user_id;

        -- Update existing opportunities owned by this employer
        UPDATE public.opportunities
        SET organization_id = new_org_id
        WHERE employer_id = emp_record.user_id;
    END LOOP;
END $$;

-- 6. Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = org_id AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_organization_role(org_id UUID, required_roles VARCHAR[], check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = org_id 
        AND user_id = check_user_id 
        AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_organizations ON public.organizations
    FOR SELECT USING (TRUE); -- Organizations are public

CREATE POLICY insert_organizations ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY update_organizations ON public.organizations
    FOR UPDATE USING (
        public.has_organization_role(id, ARRAY['OWNER', 'ADMIN']) OR public.is_admin(auth.uid())
    ) WITH CHECK (
        public.has_organization_role(id, ARRAY['OWNER', 'ADMIN']) OR public.is_admin(auth.uid())
    );

-- 8. RLS Policies for organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_organization_members ON public.organization_members
    FOR SELECT USING (TRUE); -- Membership is public for now (or at least visible to members of the platform)

CREATE POLICY insert_organization_members ON public.organization_members
    FOR INSERT WITH CHECK (
        public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN']) OR 
        public.is_admin(auth.uid()) OR
        -- Allow users to insert themselves as OWNER when creating a new org (handled by trigger or backend action normally, but for simplicity we let them insert if they don't exist in it yet)
        (user_id = auth.uid() AND NOT public.is_organization_member(organization_id, auth.uid()))
    );

CREATE POLICY update_organization_members ON public.organization_members
    FOR UPDATE USING (
        public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN']) OR public.is_admin(auth.uid())
    ) WITH CHECK (
        public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN']) OR public.is_admin(auth.uid())
    );

CREATE POLICY delete_organization_members ON public.organization_members
    FOR DELETE USING (
        public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN']) OR 
        user_id = auth.uid() OR -- Users can leave an org
        public.is_admin(auth.uid())
    );

-- 9. Update Opportunities RLS to include Organization membership
CREATE POLICY update_opportunities_org ON public.opportunities
    FOR UPDATE USING (
        organization_id IS NOT NULL AND 
        public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER'])
    ) WITH CHECK (
        organization_id IS NOT NULL AND 
        public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER'])
    );

CREATE POLICY insert_opportunities_org ON public.opportunities
    FOR INSERT WITH CHECK (
        organization_id IS NOT NULL AND 
        public.has_organization_role(organization_id, ARRAY['OWNER', 'ADMIN', 'RECRUITER'])
    );
