-- Migration: Setup Trust score initialization and history logging database triggers

-- 1. Log verification history entry automatically on update
CREATE OR REPLACE FUNCTION public.log_verification_history_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.verification_history (request_id, user_id, status, notes)
    VALUES (NEW.id, NEW.user_id, NEW.status, NEW.notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_log_verification_history
AFTER UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.log_verification_history_entry();


-- 2. Automatically initialize user trust score record on profile insert
CREATE OR REPLACE FUNCTION public.init_user_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.trust_scores (user_id, score, factors)
  VALUES (
    NEW.id,
    80,
    '{"identity_verified": false, "business_verified": false, "profile_complete": false, "rating_average": 5.0, "disputes_count": 0}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_init_user_trust_score
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.init_user_trust_score();


-- 3. Populate existing users' trust scores for backward compatibility
INSERT INTO public.trust_scores (user_id, score, factors)
SELECT 
  id, 
  80, 
  '{"identity_verified": false, "business_verified": false, "profile_complete": false, "rating_average": 5.0, "disputes_count": 0}'::jsonb
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
