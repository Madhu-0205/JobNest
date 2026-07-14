-- 1. ST_Distance wrapper helper function returning distance in meters
CREATE OR REPLACE FUNCTION public.calculate_distance(
    lat1 NUMERIC, lon1 NUMERIC,
    lat2 NUMERIC, lon2 NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. ST_Within wrapper helper to verify geofence intersection
CREATE OR REPLACE FUNCTION public.is_point_in_geofence(
    lat NUMERIC, lon NUMERIC,
    geofence_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_inside BOOLEAN;
BEGIN
    SELECT ST_Contains(boundary, ST_SetSRID(ST_MakePoint(lon, lat), 4326))
    INTO v_inside
    FROM public.geofences
    WHERE id = geofence_id;
    
    RETURN COALESCE(v_inside, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. High-performance Nearby Opportunity Search query resolver
CREATE OR REPLACE FUNCTION public.find_nearby_opportunities(
    user_lat NUMERIC,
    user_lon NUMERIC,
    max_distance_meters INT,
    limit_count INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    employer_id UUID,
    pricing_model VARCHAR,
    salary_min NUMERIC,
    salary_max NUMERIC,
    pincode VARCHAR,
    distance_meters NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        o.description,
        o.employer_id,
        o.pricing_model,
        o.salary_min,
        o.salary_max,
        o.pincode,
        ST_Distance(o.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography) AS distance_meters
    FROM public.opportunities o
    WHERE o.status = 'published'
      AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography, max_distance_meters)
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. High-performance Nearby Worker Search query resolver
CREATE OR REPLACE FUNCTION public.find_nearby_workers(
    center_lat NUMERIC,
    center_lon NUMERIC,
    max_distance_meters INT,
    limit_count INT DEFAULT 50
)
RETURNS TABLE (
    user_id UUID,
    job_title VARCHAR,
    bio TEXT,
    experience_years INT,
    distance_meters NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wp.user_id,
        wp.job_title,
        wp.bio,
        wp.experience_years,
        ST_Distance(wp.location, ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography) AS distance_meters
    FROM public.worker_profiles wp
    WHERE ST_DWithin(wp.location, ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography, max_distance_meters)
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
