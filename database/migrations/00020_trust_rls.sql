-- Migration: Enable Row Level Security (RLS) on Trust, Safety & Verification Tables

-- Helper function to check if the user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = usr_id AND r.name IN ('moderator', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;

-- 1. TRUST SCORES POLICIES
CREATE POLICY "Public read trust scores" ON public.trust_scores
    FOR SELECT USING (true);

CREATE POLICY "Moderators can write trust scores" ON public.trust_scores
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 2. VERIFICATION REQUESTS POLICIES
CREATE POLICY "Users can read own requests" ON public.verification_requests
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Users can create own requests" ON public.verification_requests
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Moderators can manage requests" ON public.verification_requests
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 3. VERIFICATION DOCUMENTS POLICIES
CREATE POLICY "Users can read own documents" ON public.verification_documents
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.verification_requests r
            WHERE r.id = request_id AND (r.user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

CREATE POLICY "Users can insert own documents" ON public.verification_documents
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.verification_requests r
            WHERE r.id = request_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Moderators can manage documents" ON public.verification_documents
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 4. VERIFICATION HISTORY POLICIES
CREATE POLICY "Users can view own request history" ON public.verification_history
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can insert history" ON public.verification_history
    FOR INSERT TO authenticated WITH CHECK (public.is_moderator_or_admin(auth.uid()));

-- 5. BUSINESS VERIFICATIONS POLICIES
CREATE POLICY "Anyone can view approved business verifications" ON public.business_verifications
    FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Users can insert business verification" ON public.business_verifications
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Moderators can manage business verifications" ON public.business_verifications
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 6. RATINGS POLICIES
CREATE POLICY "Anyone can read ratings" ON public.ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ratings" ON public.ratings
    FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own ratings" ON public.ratings
    FOR UPDATE TO authenticated USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

-- 7. REVIEWS POLICIES
CREATE POLICY "Anyone can read reviews" ON public.reviews
    FOR SELECT USING (status = 'approved' OR reviewer_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can write reviews" ON public.reviews
    FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE TO authenticated USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

-- 8. REVIEW REPLIES POLICIES
CREATE POLICY "Anyone can read replies" ON public.review_replies
    FOR SELECT USING (true);

CREATE POLICY "Users can reply to own reviews" ON public.review_replies
    FOR INSERT TO authenticated WITH CHECK (replier_id = auth.uid());

-- 9. BADGES POLICIES
CREATE POLICY "Anyone can read badges" ON public.badges
    FOR SELECT USING (true);

CREATE POLICY "Moderators can manage badges" ON public.badges
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 10. USER BADGES POLICIES
CREATE POLICY "Anyone can read user badges" ON public.user_badges
    FOR SELECT USING (true);

CREATE POLICY "Moderators can manage user badges" ON public.user_badges
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 11. REPORT EVIDENCE POLICIES
CREATE POLICY "Access report evidence" ON public.report_evidence
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.reports r
            WHERE r.id = report_id AND (r.reporter_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

CREATE POLICY "Insert report evidence" ON public.report_evidence
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reports r
            WHERE r.id = report_id AND r.reporter_id = auth.uid()
        )
    );

-- 12. INCIDENTS POLICIES
CREATE POLICY "View incidents" ON public.incidents
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Create incident" ON public.incidents
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update incident" ON public.incidents
    FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

-- 13. TRUSTED CONTACTS POLICIES
CREATE POLICY "Manage trusted contacts" ON public.trusted_contacts
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 14. BLOCKED USERS POLICIES
CREATE POLICY "Manage blocked users" ON public.blocked_users
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 15. DISPUTES POLICIES
CREATE POLICY "View disputes" ON public.disputes
    FOR SELECT TO authenticated USING (
        initiator_id = auth.uid() OR respondent_id = auth.uid() OR public.is_moderator_or_admin(auth.uid())
    );

CREATE POLICY "Open disputes" ON public.disputes
    FOR INSERT TO authenticated WITH CHECK (initiator_id = auth.uid());

CREATE POLICY "Update disputes" ON public.disputes
    FOR UPDATE TO authenticated USING (
        initiator_id = auth.uid() OR respondent_id = auth.uid() OR public.is_moderator_or_admin(auth.uid())
    );

-- 16. DISPUTE MESSAGES POLICIES
CREATE POLICY "Access dispute messages" ON public.dispute_messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.disputes d
            WHERE d.id = dispute_id AND (d.initiator_id = auth.uid() OR d.respondent_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

CREATE POLICY "Insert dispute messages" ON public.dispute_messages
    FOR INSERT TO authenticated WITH CHECK (
        sender_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.disputes d
            WHERE d.id = dispute_id AND (d.initiator_id = auth.uid() OR d.respondent_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

-- 17. DISPUTE EVIDENCE POLICIES
CREATE POLICY "Access dispute evidence" ON public.dispute_evidence
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.disputes d
            WHERE d.id = dispute_id AND (d.initiator_id = auth.uid() OR d.respondent_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

CREATE POLICY "Insert dispute evidence" ON public.dispute_evidence
    FOR INSERT TO authenticated WITH CHECK (
        uploaded_by = auth.uid() AND EXISTS (
            SELECT 1 FROM public.disputes d
            WHERE d.id = dispute_id AND (d.initiator_id = auth.uid() OR d.respondent_id = auth.uid())
        )
    );

-- 18. MODERATION ACTIONS POLICIES
CREATE POLICY "View moderation actions" ON public.moderation_actions
    FOR SELECT TO authenticated USING (target_user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators manage moderation actions" ON public.moderation_actions
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 19. FRAUD SIGNALS POLICIES
CREATE POLICY "Moderators manage fraud signals" ON public.fraud_signals
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));
