-- Migration 00045: Enable RLS on ai_explanations_cache

ALTER TABLE public.ai_explanations_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cached ai explanations"
    ON public.ai_explanations_cache
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cached ai explanations"
    ON public.ai_explanations_cache
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cached ai explanations"
    ON public.ai_explanations_cache
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cached ai explanations"
    ON public.ai_explanations_cache
    FOR DELETE
    USING (auth.uid() = user_id);
