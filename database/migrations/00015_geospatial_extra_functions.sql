-- 1. Check if worker's coverage covers an opportunity
CREATE OR REPLACE FUNCTION public.is_worker_covering_opportunity(
    p_worker_id UUID,
    p_opp_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_covered BOOLEAN := FALSE;
    v_opp_geom GEOGRAPHY(Point, 4326);
BEGIN
    -- Get opportunity location
    SELECT location INTO v_opp_geom FROM public.opportunities WHERE id = p_opp_id;
    IF v_opp_geom IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check active service areas first
    SELECT EXISTS (
        SELECT 1 FROM public.service_areas
        WHERE user_id = p_worker_id AND is_active = TRUE
          AND (
            ST_DWithin(center_geom, v_opp_geom, radius_meters) OR
            (boundary_polygon IS NOT NULL AND ST_Contains(boundary_polygon, v_opp_geom::geometry))
          )
    ) INTO v_covered;

    -- Fallback to worker profile preference radius
    IF NOT v_covered THEN
        SELECT EXISTS (
            SELECT 1 FROM public.worker_profiles
            WHERE user_id = p_worker_id
              AND ST_DWithin(location, v_opp_geom, service_radius_meters)
        ) INTO v_covered;
    END IF;

    RETURN v_covered;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Find workers covering a specific coordinates point
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
        ST_Distance(wp.location, v_target) AS distance_meters
    FROM public.worker_profiles wp
    LEFT JOIN public.service_areas sa ON wp.user_id = sa.user_id AND sa.is_active = TRUE
    WHERE 
        -- Matches service areas (radius or boundary)
        (sa.id IS NOT NULL AND (
            ST_DWithin(sa.center_geom, v_target, sa.radius_meters) OR
            (sa.boundary_polygon IS NOT NULL AND ST_Contains(sa.boundary_polygon, v_target::geometry))
        ))
        OR
        -- Or matches default worker profile radius
        (ST_DWithin(wp.location, v_target, wp.service_radius_meters))
    ORDER BY wp.user_id, distance_meters ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Nearest opportunities proximity lookup with iterative radius scaling
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
        -- Count how many opportunities inside v_radius
        SELECT COUNT(*) INTO v_count
        FROM public.opportunities o
        WHERE o.status = 'published' AND ST_DWithin(o.location, v_target, v_radius);
        
        -- If we found at least 5 opportunities or reached max radius, break
        IF v_count >= 5 OR v_radius >= p_max_radius THEN
            EXIT;
        END IF;
        
        -- Double the search radius
        v_radius := v_radius * 2;
        IF v_radius > p_max_radius THEN
            v_radius := p_max_radius;
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        ST_Distance(o.location, v_target) AS distance_meters
    FROM public.opportunities o
    WHERE o.status = 'published' AND ST_DWithin(o.location, v_target, v_radius)
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Nearest workers proximity lookup with iterative radius scaling
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
        -- Count workers inside radius
        SELECT COUNT(*) INTO v_count
        FROM public.worker_profiles wp
        WHERE ST_DWithin(wp.location, v_target, v_radius);
        
        -- Break if target reached
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
        ST_Distance(wp.location, v_target) AS distance_meters
    FROM public.worker_profiles wp
    WHERE ST_DWithin(wp.location, v_target, v_radius)
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Check if point is in restricted zone
CREATE OR REPLACE FUNCTION public.is_point_in_restricted_zone(
    p_lat NUMERIC,
    p_lon NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    v_restricted BOOLEAN := FALSE;
    v_target GEOMETRY(Point, 4326);
BEGIN
    v_target := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326);
    
    SELECT EXISTS (
        SELECT 1 FROM public.geofences
        WHERE type = 'restricted_zone' AND ST_Contains(boundary, v_target)
    ) INTO v_restricted;
    
    RETURN v_restricted;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Get overlapping geofences
CREATE OR REPLACE FUNCTION public.get_overlapping_geofences(
    p_boundary GEOMETRY(Polygon, 4326)
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT g.id, g.name, g.type
    FROM public.geofences g
    WHERE ST_Intersects(g.boundary, p_boundary);
END;
$$ LANGUAGE plpgsql STABLE;
