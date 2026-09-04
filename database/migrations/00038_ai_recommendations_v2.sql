-- Migration 00038: AI Recommendations V2
-- Extend AI tables to support new entities: organization, connection, event

-- 1. Extend embeddings reference_type
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.embeddings'::regclass
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) ILIKE '%reference_type%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.embeddings DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.embeddings 
ADD CONSTRAINT embeddings_reference_type_check 
CHECK (reference_type IN ('worker_profile', 'opportunity', 'search_query', 'organization', 'professional_post', 'event'));

-- 2. Extend recommendations type
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.recommendations'::regclass
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) ILIKE '%type%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.recommendations DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.recommendations 
ADD CONSTRAINT recommendations_type_check 
CHECK (type IN ('worker', 'employer', 'opportunity', 'organization', 'connection', 'event', 'post'));

-- 3. Create ai_explanations_cache table
-- Caches generated AI explanations to avoid LLM calls for every UI render
CREATE TABLE IF NOT EXISTS public.ai_explanations_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'worker', 'employer', 'opportunity', 'organization', 'connection', 'event'
    target_id UUID NOT NULL,
    explanation TEXT NOT NULL,
    reasons JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_explanations_user ON public.ai_explanations_cache(user_id);
