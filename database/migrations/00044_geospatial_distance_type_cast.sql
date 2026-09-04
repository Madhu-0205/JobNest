-- Migration 00044: Fix ST_Distance type cast to NUMERIC in geospatial search functions

-- 1. High-performance Nearby Opportunity Search query resolver
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
    distance_meters NUMERIC,
    latitude NUMERIC,
    longitude NUMERIC,
    employer_name VARCHAR,
    verification_status VARCHAR
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
        ST_Distance(o.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography)::NUMERIC AS distance_meters,
        ST_Y(o.location::geometry)::NUMERIC AS latitude,
        ST_X(o.location::geometry)::NUMERIC AS longitude,
        COALESCE(ep.company_name, 'Local Employer')::VARCHAR AS employer_name,
        COALESCE(ep.verification_status, 'unverified')::VARCHAR AS verification_status
    FROM public.opportunities o
    LEFT JOIN public.employer_profiles ep ON o.employer_id = ep.user_id
    WHERE o.status = 'published'
      AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography, max_distance_meters)
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. High-performance Nearby Worker Search query resolver
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
        ST_Distance(wp.location, ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography)::NUMERIC AS distance_meters
    FROM public.worker_profiles wp
    WHERE ST_DWithin(wp.location, ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography, max_distance_meters)
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Find workers covering a specific coordinates point
CREATE OR REPLACE FUNCTION public.find_workers_covering_point(
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_max_distance_meters INT DEFAULT 50000
)
RETURNS TABLE (
    worker_id UUID,
    distance_meters NUMERIC
) AS $$
DECLARE
    v_target GEOGRAPHY(Point, 4326);
BEGIN
    v_target := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
    
    RETURN QUERY
    SELECT DISTINCT ON (wp.user_id)
        wp.user_id AS worker_id,
        ST_Distance(wp.location, v_target)::NUMERIC AS distance_meters
    FROM public.worker_profiles wp
    LEFT JOIN public.service_areas sa ON wp.user_id = sa.user_id AND sa.is_active = TRUE
    WHERE 
        (sa.id IS NOT NULL AND (
            ST_DWithin(sa.center_geom, v_target, sa.radius_meters) OR
            (sa.boundary_polygon IS NOT NULL AND ST_Contains(sa.boundary_polygon, v_target::geometry))
        ))
        OR
        (ST_DWithin(wp.location, v_target, wp.service_radius_meters))
    ORDER BY wp.user_id, distance_meters ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Nearest opportunities proximity lookup with iterative radius scaling
CREATE OR REPLACE FUNCTION public.nearest_opportunities_with_radius_expansion(
    p_lat NUMERIC,
    p_lon NUMERIC,
    p_initial_radius INT DEFAULT 5000,
    p_max_radius INT DEFAULT 50000
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    distance_meters NUMERIC
) AS $$
DECLARE
    v_radius INT := p_initial_radius;
    v_count INT := 0;
    v_target GEOGRAPHY(Point, 4326);
BEGIN
    v_target := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography;
    
    LOOP
        SELECT COUNT(*) INTO v_count
        FROM public.opportunities o
        WHERE o.status = 'published' AND ST_DWithin(o.location, v_target, v_radius);
        
        IF v_count >= 5 OR v_radius >= p_max_radius THEN
            EXIT;
        END IF;
        
        v_radius := v_radius * 2;
        IF v_radius > p_max_radius THEN
            v_radius := p_max_radius;
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        ST_Distance(o.location, v_target)::NUMERIC AS distance_meters
    FROM public.opportunities o
    WHERE o.status = 'published' AND ST_DWithin(o.location, v_target, v_radius)
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Nearest workers proximity lookup with iterative radius scaling
CREATE OR REPLACE FUNCTION public.nearest_workers_with_radius_expansion(
    p_lat NUMERIC,
    p_lon NUMERIC,
    p_initial_radius INT DEFAULT 5000,
    p_max_radius INT DEFAULT 50000
)
RETURNS TABLE (
    user_id UUID,
    job_title VARCHAR,
    distance_meters NUMERIC
) AS $$
DECLARE
    v_radius INT := p_initial_radius;
    v_count INT := 0;
    v_target GEOGRAPHY(Point, 4326);
BEGIN
    v_target := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography;
    
    LOOP
        SELECT COUNT(*) INTO v_count
        FROM public.worker_profiles wp
        WHERE ST_DWithin(wp.location, v_target, v_radius);
        
        IF v_count >= 5 OR v_radius >= p_max_radius THEN
            EXIT;
        END IF;
        
        v_radius := v_radius * 2;
        IF v_radius > p_max_radius THEN
            v_radius := p_max_radius;
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT 
        wp.user_id,
        wp.job_title,
        ST_Distance(wp.location, v_target)::NUMERIC AS distance_meters
    FROM public.worker_profiles wp
    WHERE ST_DWithin(wp.location, v_target, v_radius)
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;
