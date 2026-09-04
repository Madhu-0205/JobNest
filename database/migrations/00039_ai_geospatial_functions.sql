-- Migration 00039: AI Geospatial Functions for Organizations and Events

-- 1. Find nearby organizations
CREATE OR REPLACE FUNCTION public.find_nearby_organizations(
  center_lat double precision,
  center_lon double precision,
  max_distance_meters double precision,
  limit_count int
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  industry VARCHAR,
  organization_type VARCHAR,
  verification_status VARCHAR,
  distance_meters double precision
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.industry,
    o.organization_type,
    o.verification_status,
    ST_Distance(
      o.location,
      ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
    ) AS distance_meters
  FROM public.organizations o
  WHERE ST_DWithin(
    o.location,
    ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
    max_distance_meters
  )
  ORDER BY distance_meters ASC
  LIMIT limit_count;
END;
$$;

-- 2. Find nearby events
CREATE OR REPLACE FUNCTION public.find_nearby_events(
  center_lat double precision,
  center_lon double precision,
  max_distance_meters double precision,
  limit_count int
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  category VARCHAR,
  organization_id UUID,
  creator_id UUID,
  start_time TIMESTAMPTZ,
  distance_meters double precision
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.category,
    e.organization_id,
    e.creator_id,
    e.start_time,
    ST_Distance(
      e.location,
      ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
    ) AS distance_meters
  FROM public.events e
  WHERE ST_DWithin(
    e.location,
    ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
    max_distance_meters
  )
  AND e.visibility = 'public'
  AND e.start_time >= NOW() -- Only upcoming events
  ORDER BY distance_meters ASC
  LIMIT limit_count;
END;
$$;

-- 3. Extend semantic search to handle arbitrary reference types
CREATE OR REPLACE FUNCTION public.semantic_search_generic(
  query_embedding vector(384),
  target_reference_type VARCHAR,
  match_threshold double precision,
  match_count int
)
RETURNS TABLE (
  id UUID,
  reference_id UUID,
  content TEXT,
  similarity double precision
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.reference_id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  WHERE e.reference_type = target_reference_type
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
