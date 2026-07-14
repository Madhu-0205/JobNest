-- 1. WORKER PROFILES (Modular Role Profile for Workers/Freelancers)
CREATE TABLE IF NOT EXISTS public.worker_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_title VARCHAR(255),
    bio TEXT,
    experience_years INT DEFAULT 0 NOT NULL,
    service_radius_meters INT DEFAULT 5000 NOT NULL, -- default 5km
    location GEOGRAPHY(Point, 4326), -- PostGIS Point
    preferred_work_area TEXT,
    travel_distance_km INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. EMPLOYER PROFILES (Modular Role Profile for Employers/Businesses)
CREATE TABLE IF NOT EXISTS public.employer_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    company_website TEXT,
    industry VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. SKILLS ENGINE
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. WORKER SKILLS LINK
CREATE TABLE IF NOT EXISTS public.worker_skills (
    worker_id UUID REFERENCES public.worker_profiles(user_id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (worker_id, skill_id)
);

-- 5. PORTFOLIO ITEMS
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url TEXT,
    project_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. EXPERIENCE LEDGER
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE, -- Null means current
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. EDUCATION HISTORY
CREATE TABLE IF NOT EXISTS public.educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. CERTIFICATIONS
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id VARCHAR(100),
    credential_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. LANGUAGES REGISTER
CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g. en, hi, te, ta, kn, ml, mr, gu, bn, pa, or
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 10. USER LANGUAGES LINK
CREATE TABLE IF NOT EXISTS public.user_languages (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) DEFAULT 'conversational' NOT NULL, -- basic, conversational, fluent, native
    PRIMARY KEY (user_id, language_id)
);

-- 11. AVAILABILITY CALENDAR
CREATE TABLE IF NOT EXISTS public.availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (start_time < end_time),
    UNIQUE (user_id, day_of_week, start_time, end_time)
);

-- 12. KYC DOCUMENTS
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- Aadhar, PAN, Passport, DrivingLicense, VoterId
    document_number VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
    reviewed_by UUID, -- references auth.users(id)
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Attach review foreign key link if auth schema exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        ALTER TABLE public.kyc_documents ADD CONSTRAINT fk_kyc_docs_reviewer FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 13. INDEX DEFINITIONS FOR DOMAIN SEARCHES
CREATE INDEX IF NOT EXISTS idx_worker_profiles_loc ON public.worker_profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_worker_skills_worker ON public.worker_skills(worker_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON public.portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_user ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user ON public.educations(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user ON public.certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_user ON public.user_languages(user_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_user ON public.availabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_docs_user ON public.kyc_documents(user_id);
