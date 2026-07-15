-- Enable Row Level Security
ALTER TABLE public.route_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- 1. POLICIES FOR public.route_segments
CREATE POLICY select_route_segments ON public.route_segments 
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY manage_route_segments ON public.route_segments 
    FOR ALL USING (public.is_admin(auth.uid()));

-- 2. POLICIES FOR public.travel_estimates
CREATE POLICY select_travel_estimates ON public.travel_estimates 
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY manage_travel_estimates ON public.travel_estimates 
    FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 3. POLICIES FOR public.service_areas
CREATE POLICY select_service_areas ON public.service_areas 
    FOR SELECT USING (is_active = TRUE OR auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY manage_service_areas ON public.service_areas 
    FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 4. POLICIES FOR public.coverage_zones
CREATE POLICY select_coverage_zones ON public.coverage_zones 
    FOR SELECT USING (TRUE);
CREATE POLICY manage_coverage_zones ON public.coverage_zones 
    FOR ALL USING (public.is_admin(auth.uid()));

-- 5. POLICIES FOR public.saved_locations
CREATE POLICY select_saved_locations ON public.saved_locations 
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY manage_saved_locations ON public.saved_locations 
    FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
