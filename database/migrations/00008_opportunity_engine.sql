-- 1. OPPORTUNITY CATEGORIES
CREATE TABLE IF NOT EXISTS public.opportunity_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_key VARCHAR(100) UNIQUE NOT NULL, -- translation key
    description_key VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. OPPORTUNITY TYPES
CREATE TABLE IF NOT EXISTS public.opportunity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_key VARCHAR(100) UNIQUE NOT NULL, -- translation key e.g. permanent, freelance, daily_wage
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.opportunity_categories(id) ON DELETE SET NULL,
    type_id UUID REFERENCES public.opportunity_types(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- draft, published, closed, completed, disputed, cancelled, archived, expired
    pricing_model VARCHAR(50) DEFAULT 'fixed' NOT NULL, -- hourly, daily, weekly, monthly, fixed, negotiable
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    house_number VARCHAR(100),
    street VARCHAR(255),
    landmark VARCHAR(255),
    village VARCHAR(100),
    town VARCHAR(100),
    city VARCHAR(100),
    mandal_taluk VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India' NOT NULL,
    pincode VARCHAR(20),
    location GEOGRAPHY(Point, 4326), -- PostGIS Point
    hiring_radius_meters INT DEFAULT 5000 NOT NULL,
    voice_intro_url TEXT, -- Voice post audio link (STT ready)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ
);

-- 4. OPPORTUNITY SKILLS CROSS-LINK
CREATE TABLE IF NOT EXISTS public.opportunity_skills (
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (opportunity_id, skill_id)
);

-- 5. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'applied' NOT NULL, -- applied, withdrawn, shortlisted, interview, offered, accepted, rejected, completed, disputed, cancelled
    cover_letter TEXT,
    resume_url TEXT,
    voice_intro_url TEXT, -- Voice cover recording
    expected_salary NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (opportunity_id, worker_id)
);

-- 6. APPLICATION STATUS HISTORY (State Machine logging)
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. SHORTLISTS
CREATE TABLE IF NOT EXISTS public.shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (opportunity_id, worker_id)
);

-- 8. OFFERS
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, accepted, rejected, expired
    salary_offered NUMERIC(12, 2) NOT NULL,
    terms TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. SAVED OPPORTUNITIES
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, opportunity_id)
);

-- 10. FAVORITE WORKERS
CREATE TABLE IF NOT EXISTS public.favorite_workers (
    employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (employer_id, worker_id)
);

-- 11. REPORTS (Moderation & Abuse)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, investigated, dismissed, action_taken
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. INDEX DEFINITIONS FOR EFFICIENT HYPERLOCAL SEARCHES
CREATE INDEX IF NOT EXISTS idx_opportunities_employer ON public.opportunities(employer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_location ON public.opportunities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_pincode ON public.opportunities(pincode);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_skill ON public.opportunity_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_worker ON public.applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_offers_worker ON public.offers(worker_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
