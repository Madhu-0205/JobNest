-- Enable Row Level Security (RLS) on all opportunity engine tables
ALTER TABLE public.opportunity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. POLICIES FOR public.opportunity_categories
CREATE POLICY select_categories ON public.opportunity_categories FOR SELECT USING (TRUE);
CREATE POLICY manage_categories ON public.opportunity_categories FOR ALL USING (public.is_admin(auth.uid()));

-- 2. POLICIES FOR public.opportunity_types
CREATE POLICY select_types ON public.opportunity_types FOR SELECT USING (TRUE);
CREATE POLICY manage_types ON public.opportunity_types FOR ALL USING (public.is_admin(auth.uid()));

-- 3. POLICIES FOR public.opportunities
CREATE POLICY select_opportunities ON public.opportunities FOR SELECT 
USING (status = 'published' OR auth.uid() = employer_id OR public.is_admin(auth.uid()));

CREATE POLICY insert_opportunities ON public.opportunities FOR INSERT 
WITH CHECK (auth.uid() = employer_id AND (public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'resident') OR public.is_admin(auth.uid())));

CREATE POLICY update_opportunities ON public.opportunities FOR UPDATE 
USING (auth.uid() = employer_id OR public.is_admin(auth.uid())) 
WITH CHECK (auth.uid() = employer_id OR public.is_admin(auth.uid()));

-- 4. POLICIES FOR public.opportunity_skills
CREATE POLICY select_opportunity_skills ON public.opportunity_skills FOR SELECT USING (TRUE);
CREATE POLICY manage_opportunity_skills ON public.opportunity_skills FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.opportunities o 
    WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
) OR public.is_admin(auth.uid()));

-- 5. POLICIES FOR public.applications
CREATE POLICY select_applications ON public.applications FOR SELECT 
USING (
    auth.uid() = worker_id OR 
    EXISTS (
        SELECT 1 FROM public.opportunities o 
        WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
    ) OR 
    public.is_admin(auth.uid())
);

CREATE POLICY insert_applications ON public.applications FOR INSERT 
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY update_applications ON public.applications FOR UPDATE 
USING (
    auth.uid() = worker_id OR 
    EXISTS (
        SELECT 1 FROM public.opportunities o 
        WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
    ) OR 
    public.is_admin(auth.uid())
)
WITH CHECK (
    auth.uid() = worker_id OR 
    EXISTS (
        SELECT 1 FROM public.opportunities o 
        WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
    ) OR 
    public.is_admin(auth.uid())
);

-- 6. POLICIES FOR public.application_status_history
CREATE POLICY select_app_history ON public.application_status_history FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND (
            a.worker_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.opportunities o
                WHERE o.id = a.opportunity_id AND o.employer_id = auth.uid()
            )
        )
    ) OR public.is_admin(auth.uid())
);

CREATE POLICY insert_app_history ON public.application_status_history FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND (
            a.worker_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM public.opportunities o
                WHERE o.id = a.opportunity_id AND o.employer_id = auth.uid()
            )
        )
    ) OR public.is_admin(auth.uid())
);

-- 7. POLICIES FOR public.shortlists
CREATE POLICY select_shortlists ON public.shortlists FOR SELECT 
USING (auth.uid() = worker_id OR EXISTS (
    SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
) OR public.is_admin(auth.uid()));

CREATE POLICY manage_shortlists ON public.shortlists FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
) OR public.is_admin(auth.uid()));

-- 8. POLICIES FOR public.offers
CREATE POLICY select_offers ON public.offers FOR SELECT 
USING (auth.uid() = worker_id OR EXISTS (
    SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
) OR public.is_admin(auth.uid()));

CREATE POLICY manage_offers ON public.offers FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.employer_id = auth.uid()
) OR public.is_admin(auth.uid()));

-- 9. POLICIES FOR public.saved_opportunities
CREATE POLICY manage_saved_opportunities ON public.saved_opportunities FOR ALL 
USING (auth.uid() = user_id);

-- 10. POLICIES FOR public.favorite_workers
CREATE POLICY manage_favorite_workers ON public.favorite_workers FOR ALL 
USING (auth.uid() = employer_id);

-- 11. POLICIES FOR public.reports
CREATE POLICY select_reports ON public.reports FOR SELECT 
USING (auth.uid() = reporter_id OR public.is_admin(auth.uid()));

CREATE POLICY insert_reports ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- 12. AUDIT LOG TRIGGERS FOR OPPORTUNITY MODIFICATIONS
CREATE TRIGGER audit_opportunities_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_applications_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_offers_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
