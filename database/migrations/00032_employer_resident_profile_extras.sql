-- Migration: Add extra onboarding fields for employers and create resident profiles table

-- 1. Alter employer_profiles to support required onboarding fields
ALTER TABLE public.employer_profiles 
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326),
ADD COLUMN IF NOT EXISTS categories TEXT[],
ADD COLUMN IF NOT EXISTS budget_range_min NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS budget_range_max NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified';

-- Alter worker_profiles to support extra onboarding fields
ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS expected_salary NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS availability VARCHAR(50);

-- Create spatial index for employer location
CREATE INDEX IF NOT EXISTS idx_employer_profiles_loc ON public.employer_profiles USING GIST(location);


-- 2. Create resident_profiles table to support resident onboarding
CREATE TABLE IF NOT EXISTS public.resident_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    saved_address TEXT,
    preferred_language VARCHAR(50),
    payment_method VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add some default business roles if missing
INSERT INTO public.roles (name, description)
VALUES 
('finance_admin', 'Manages billing, invoices, payments, escrows'),
('trust_safety', 'Handles trust scores, KYC documents, moderation'),
('operations', 'Oversees realtime events and platform health')
ON CONFLICT (name) DO NOTHING;
