-- Enable Row Level Security (RLS) on all new domain tables
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- 1. POLICIES FOR public.worker_profiles
CREATE POLICY select_worker_profiles ON public.worker_profiles FOR SELECT USING (TRUE);
CREATE POLICY insert_worker_profiles ON public.worker_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_worker_profiles ON public.worker_profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2. POLICIES FOR public.employer_profiles
CREATE POLICY select_employer_profiles ON public.employer_profiles FOR SELECT USING (TRUE);
CREATE POLICY insert_employer_profiles ON public.employer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_employer_profiles ON public.employer_profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 3. POLICIES FOR public.skills
CREATE POLICY select_skills ON public.skills FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY manage_skills ON public.skills FOR ALL USING (public.is_admin(auth.uid()));

-- 4. POLICIES FOR public.worker_skills
CREATE POLICY select_worker_skills ON public.worker_skills FOR SELECT USING (TRUE);
CREATE POLICY manage_worker_skills ON public.worker_skills FOR ALL USING (auth.uid() = worker_id OR public.is_admin(auth.uid()));

-- 5. POLICIES FOR public.portfolio_items
CREATE POLICY select_portfolio ON public.portfolio_items FOR SELECT USING (TRUE);
CREATE POLICY manage_portfolio ON public.portfolio_items FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 6. POLICIES FOR public.experiences
CREATE POLICY select_experience ON public.experiences FOR SELECT USING (TRUE);
CREATE POLICY manage_experience ON public.experiences FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 7. POLICIES FOR public.educations
CREATE POLICY select_education ON public.educations FOR SELECT USING (TRUE);
CREATE POLICY manage_education ON public.educations FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 8. POLICIES FOR public.certifications
CREATE POLICY select_certifications ON public.certifications FOR SELECT USING (TRUE);
CREATE POLICY manage_certifications ON public.certifications FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 9. POLICIES FOR public.languages
CREATE POLICY select_languages ON public.languages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY manage_languages ON public.languages FOR ALL USING (public.is_admin(auth.uid()));

-- 10. POLICIES FOR public.user_languages
CREATE POLICY select_user_languages ON public.user_languages FOR SELECT USING (TRUE);
CREATE POLICY manage_user_languages ON public.user_languages FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 11. POLICIES FOR public.availabilities
CREATE POLICY select_availabilities ON public.availabilities FOR SELECT USING (TRUE);
CREATE POLICY manage_availabilities ON public.availabilities FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 12. POLICIES FOR public.kyc_documents
CREATE POLICY select_kyc ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY insert_kyc ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY manage_kyc ON public.kyc_documents FOR ALL USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'moderator'));

-- 13. AUDIT LOG TRIGGERS FOR NEW TABLES
CREATE TRIGGER audit_worker_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_employer_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.employer_profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_kyc_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.kyc_documents
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
