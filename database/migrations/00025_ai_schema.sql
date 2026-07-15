-- Migration: Create AI Intelligence Platform Tables

-- 1. EMBEDDINGS (pgvector storage)
CREATE TABLE IF NOT EXISTS public.embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type VARCHAR(100) NOT NULL CHECK (reference_type IN ('worker_profile', 'opportunity', 'search_query')),
    reference_id UUID NOT NULL, -- Link to profiles(id) or opportunities(id)
    embedding vector(384) NOT NULL, -- Nomics text embeddings dimensions
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. AI LOGS (Token accounting & latency audits)
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider VARCHAR(100) DEFAULT 'ollama' NOT NULL, -- 'ollama', 'gemini'
    model VARCHAR(100) NOT NULL,
    task VARCHAR(100) NOT NULL, -- 'embedding', 'recommendation', 'translation', 'fraud_check'
    input_tokens INTEGER DEFAULT 0 NOT NULL,
    output_tokens INTEGER DEFAULT 0 NOT NULL,
    latency_ms INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('worker', 'employer', 'opportunity')),
    results JSONB DEFAULT '[]'::jsonb NOT NULL, -- Rank candidates details array
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. SEMANTIC CACHE
CREATE TABLE IF NOT EXISTS public.semantic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT UNIQUE NOT NULL,
    results JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. RANKING CACHE
CREATE TABLE IF NOT EXISTS public.ranking_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    results JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_embeddings_ref ON public.embeddings(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_cache_user ON public.ranking_cache(user_id);
