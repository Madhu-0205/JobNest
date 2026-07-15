-- Migration: Enable Row Level Security (RLS) on AI Platform Tables

-- Enable RLS
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_cache ENABLE ROW LEVEL SECURITY;

-- 1. EMBEDDINGS POLICIES (Admin / System only)
CREATE POLICY "Admins manage embeddings" ON public.embeddings
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 2. AI LOGS POLICIES (Admin / System only)
CREATE POLICY "Admins manage AI logs" ON public.ai_logs
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 3. RECOMMENDATIONS POLICIES
CREATE POLICY "Users can read own recommendations" ON public.recommendations
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Admins manage recommendations" ON public.recommendations
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 4. SEMANTIC CACHE POLICIES (Admin / System only)
CREATE POLICY "Admins manage semantic cache" ON public.semantic_cache
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 5. RANKING CACHE POLICIES
CREATE POLICY "Users can read own ranking cache" ON public.ranking_cache
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Admins manage ranking cache" ON public.ranking_cache
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));
