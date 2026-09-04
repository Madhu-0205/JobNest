-- Migration: User E2EE Public Keys (Phase 7 - End-to-End Encryption)
CREATE TABLE IF NOT EXISTS public.user_e2ee_keys (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    public_key JSONB NOT NULL,
    key_id VARCHAR(100) NOT NULL,
    algorithm VARCHAR(50) DEFAULT 'ECDH-P256' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_e2ee_keys_user_id ON public.user_e2ee_keys (user_id);

-- Enable RLS
ALTER TABLE public.user_e2ee_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read public keys (public by definition for key agreement)
CREATE POLICY select_user_e2ee_keys ON public.user_e2ee_keys FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Users can only insert their own public key
CREATE POLICY insert_user_e2ee_keys ON public.user_e2ee_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own public key
CREATE POLICY update_user_e2ee_keys ON public.user_e2ee_keys FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own public key
CREATE POLICY delete_user_e2ee_keys ON public.user_e2ee_keys FOR DELETE
USING (auth.uid() = user_id);
