-- Enable Row Level Security on all geospatial tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_events ENABLE ROW LEVEL SECURITY;

-- 1. POLICIES FOR public.locations
CREATE POLICY select_locations ON public.locations FOR SELECT USING (TRUE);
CREATE POLICY manage_locations ON public.locations FOR ALL USING (auth.role() = 'authenticated');

-- 2. POLICIES FOR public.addresses
CREATE POLICY select_addresses ON public.addresses FOR SELECT USING (TRUE);
CREATE POLICY manage_addresses ON public.addresses FOR ALL USING (auth.role() = 'authenticated');

-- 3. POLICIES FOR public.geofences
CREATE POLICY select_geofences ON public.geofences FOR SELECT USING (TRUE);
CREATE POLICY manage_geofences ON public.geofences FOR ALL USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

-- 4. POLICIES FOR public.worker_locations
CREATE POLICY select_worker_locations ON public.worker_locations FOR SELECT 
USING (
    auth.uid() = user_id OR 
    EXISTS (
        -- Allow employers holding active applications/shortlists to view location coordinates
        SELECT 1 FROM public.applications a
        JOIN public.opportunities o ON a.opportunity_id = o.id
        WHERE a.worker_id = user_id AND o.employer_id = auth.uid() AND a.status IN ('shortlisted', 'offered', 'accepted')
    ) OR 
    public.is_admin(auth.uid())
);

CREATE POLICY manage_worker_locations ON public.worker_locations FOR ALL 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 5. POLICIES FOR public.location_history
CREATE POLICY select_location_history ON public.location_history FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY insert_location_history ON public.location_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. POLICIES FOR public.routes
CREATE POLICY select_routes ON public.routes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY manage_routes ON public.routes FOR ALL USING (public.is_admin(auth.uid()));

-- 7. POLICIES FOR public.location_events
CREATE POLICY select_location_events ON public.location_events FOR SELECT 
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.geofences g WHERE g.id = geofence_id AND g.created_by = auth.uid()
    ) OR 
    public.is_admin(auth.uid())
);

CREATE POLICY insert_location_events ON public.location_events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 8. AUDIT TRIGGERS ON GEOGRAPHIC ZONE CONFIGURATIONS
CREATE TRIGGER audit_geofences_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.geofences
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
