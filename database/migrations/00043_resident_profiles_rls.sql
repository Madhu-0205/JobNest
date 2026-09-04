-- Migration: Enable RLS and policies on resident_profiles
ALTER TABLE public.resident_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'resident_profiles' 
      AND policyname = 'Users can view own resident profile'
  ) THEN
    CREATE POLICY "Users can view own resident profile" 
      ON public.resident_profiles 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'resident_profiles' 
      AND policyname = 'Users can insert own resident profile'
  ) THEN
    CREATE POLICY "Users can insert own resident profile" 
      ON public.resident_profiles 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'resident_profiles' 
      AND policyname = 'Users can update own resident profile'
  ) THEN
    CREATE POLICY "Users can update own resident profile" 
      ON public.resident_profiles 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;
