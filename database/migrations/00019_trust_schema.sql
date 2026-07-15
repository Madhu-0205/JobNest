-- Migration: Create Trust, Safety & Verification Platform Schemas

-- 1. TRUST SCORES
CREATE TABLE IF NOT EXISTS public.trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    score INTEGER DEFAULT 100 NOT NULL CHECK (score >= 0 AND score <= 100),
    factors JSONB DEFAULT '{}'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. VERIFICATION REQUESTS
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'identity', 'business', 'kyc'
    status VARCHAR(50) DEFAULT 'submitted' NOT NULL, -- 'submitted', 'pending', 'in_review', 'approved', 'rejected', 'expired', 'resubmission'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. VERIFICATION DOCUMENTS
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'aadhaar', 'pan', 'passport', 'driving_licence', 'voter_id', 'business_gst', 'selfie', 'live_photo', 'video'
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. VERIFICATION HISTORY
CREATE TABLE IF NOT EXISTS public.verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. BUSINESS VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.business_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    gst_number VARCHAR(100),
    registration_number VARCHAR(100),
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    authorized_contact VARCHAR(255) NOT NULL,
    business_category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    verification_request_id UUID REFERENCES public.verification_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. RATINGS
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    score NUMERIC(2,1) NOT NULL CHECK (score >= 1.0 AND score <= 5.0),
    category_scores JSONB DEFAULT '{}'::jsonb NOT NULL, -- punctuality, quality, safety, speed
    rating_type VARCHAR(50) NOT NULL, -- 'worker', 'employer'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating_id UUID REFERENCES public.ratings(id) ON DELETE SET NULL,
    review_text TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(50) DEFAULT 'approved' NOT NULL, -- 'approved', 'flagged', 'hidden'
    attachments TEXT[] DEFAULT '{}'::text[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. REVIEW REPLIES
CREATE TABLE IF NOT EXISTS public.review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE UNIQUE NOT NULL,
    replier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. BADGES
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- 'verified_identity', 'verified_business', 'top_rated', 'fast_responder'
    name JSONB NOT NULL, -- Localized name (en, hi, te, ta, kn, ml, mr, gu, pa, bn, or)
    description JSONB NOT NULL, -- Localized description
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. USER BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- 11. REPORTS ENHANCEMENT
-- Add category and updated_at to existing reports table if they do not exist
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'other' NOT NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- 12. REPORT EVIDENCE
CREATE TABLE IF NOT EXISTS public.report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'screenshot', 'image', 'video', 'voice_note'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. SAFETY INCIDENTS
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL, -- 'sos_alert', 'checkin_failed', 'safety_report'
    status VARCHAR(50) DEFAULT 'open' NOT NULL, -- 'open', 'investigating', 'resolved'
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    timeline JSONB DEFAULT '[]'::jsonb NOT NULL, -- Timeline logs array
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. TRUSTED CONTACTS
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    is_emergency_sos BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, contact_phone)
);

-- 15. BLOCKED USERS
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) DEFAULT 'block' NOT NULL, -- 'block', 'mute'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, blocked_user_id, type)
);

-- 16. DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
    initiator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    respondent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' NOT NULL, -- 'open', 'evidence_collection', 'in_mediation', 'resolved', 'closed', 'appealed'
    mediator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 17. DISPUTE MESSAGES
CREATE TABLE IF NOT EXISTS public.dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 18. DISPUTE EVIDENCE
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES public.disputes(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 19. MODERATION ACTIONS
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- 'suspend', 'ban', 'warn', 'clear'
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 20. FRAUD SIGNALS
CREATE TABLE IF NOT EXISTS public.fraud_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    signal_type VARCHAR(100) NOT NULL, -- 'duplicate_account', 'suspicious_login', 'location_mismatch', 'behaviour_anomaly'
    score NUMERIC(4,2) NOT NULL CHECK (score >= 0.0 AND score <= 1.0),
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 21. INDEX DEFINITIONS FOR SPEEDY RETRIEVALS
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON public.trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_business_verifications_user ON public.business_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviewee ON public.ratings(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opportunity ON public.disputes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(user_id);
