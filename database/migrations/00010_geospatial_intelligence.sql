-- 1. LOCATIONS REGISTRY
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geohash VARCHAR(12) NOT NULL, -- GeoHash code for quick caching index
    plus_code VARCHAR(20), -- Google Plus Code representation
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL, -- spatial geography mapping
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. NORMALIZED ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    house_number VARCHAR(100),
    street VARCHAR(255),
    landmark VARCHAR(255),
    village VARCHAR(100),
    town VARCHAR(100),
    city VARCHAR(100),
    mandal_taluk VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India' NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. GEOFENCES TABLE (Polygons mapping work/village/restricted zones)
CREATE TABLE IF NOT EXISTS public.geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'work_zone' NOT NULL, -- work_zone, restricted_zone, village_zone, farm_zone
    boundary GEOMETRY(Polygon, 4326) NOT NULL, -- PostGIS Polygon field
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. WORKER CURRENT LOCATIONS
CREATE TABLE IF NOT EXISTS public.worker_locations (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    gps_accuracy_meters NUMERIC(5, 2),
    signal_quality VARCHAR(20) DEFAULT 'good', -- bad, average, good, excellent
    is_spoofed BOOLEAN DEFAULT FALSE NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. LOCATION TRACKING HISTORY (For impossible speed / spoofing analysis)
CREATE TABLE IF NOT EXISTS public.location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    speed_mps NUMERIC(6, 2), -- speed in meters per second
    gps_accuracy_meters NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. ROUTES TABLE
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    end_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    travel_mode VARCHAR(50) DEFAULT 'driving' NOT NULL, -- driving, walking, cycling
    distance_meters INT NOT NULL,
    duration_seconds INT NOT NULL,
    geometry GEOMETRY(LineString, 4326) NOT NULL, -- LineString route segment representation
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. GEOFENCE EVENTS LOGS
CREATE TABLE IF NOT EXISTS public.location_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    geofence_id UUID REFERENCES public.geofences(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- enter, leave
    correlation_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. INDEXES FOR GEOSPATIAL ACTIONS
CREATE INDEX IF NOT EXISTS idx_locations_geom ON public.locations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_locations_geohash ON public.locations(geohash);
CREATE INDEX IF NOT EXISTS idx_geofences_boundary ON public.geofences USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_worker_loc_id ON public.worker_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_loc_history_user_time ON public.location_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loc_history_geom ON public.location_history USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_routes_geom ON public.routes USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_loc_events_user ON public.location_events(user_id);
