-- 1. ROUTE SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.route_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
    segment_index INT NOT NULL,
    distance_meters INT NOT NULL,
    duration_seconds INT NOT NULL,
    instruction TEXT,
    street_name VARCHAR(255),
    geom GEOMETRY(LineString, 4326), -- coordinates of the specific step
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. TRAVEL ESTIMATES (DYNAMIC ETA TRACKING)
CREATE TABLE IF NOT EXISTS public.travel_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_latitude NUMERIC(9, 6) NOT NULL,
    start_longitude NUMERIC(9, 6) NOT NULL,
    end_latitude NUMERIC(9, 6) NOT NULL,
    end_longitude NUMERIC(9, 6) NOT NULL,
    travel_mode VARCHAR(50) DEFAULT 'driving' NOT NULL, -- driving, walking, cycling
    distance_meters INT NOT NULL,
    duration_seconds INT NOT NULL,
    eta_time TIMESTAMPTZ NOT NULL,
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    traffic_factor NUMERIC(3, 2) DEFAULT 1.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. SERVICE AREAS TABLE
CREATE TABLE IF NOT EXISTS public.service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    radius_meters INT DEFAULT 5000 NOT NULL,
    center_geom GEOGRAPHY(Point, 4326) NOT NULL,
    boundary_polygon GEOMETRY(Polygon, 4326),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. COVERAGE ZONES TABLE
CREATE TABLE IF NOT EXISTS public.coverage_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) DEFAULT 'mandal' NOT NULL, -- mandal, taluk, village, city, district
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. SAVED LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
    label VARCHAR(100) NOT NULL, -- e.g. Home, Work, Farm, Construction Site
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, label)
);

-- INDEXES FOR EXTENDED GEOSPATIAL SEARCHES
CREATE INDEX IF NOT EXISTS idx_route_segments_route_id ON public.route_segments(route_id);
CREATE INDEX IF NOT EXISTS idx_travel_estimates_user_id ON public.travel_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_user_id ON public.service_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_center_geom ON public.service_areas USING GIST(center_geom);
CREATE INDEX IF NOT EXISTS idx_service_areas_boundary ON public.service_areas USING GIST(boundary_polygon);
CREATE INDEX IF NOT EXISTS idx_coverage_zones_boundary ON public.coverage_zones USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_coverage_zones_type ON public.coverage_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_loc_id ON public.saved_locations(location_id);
