-- Migration: Setup pgvector semantic search and hybrid geospatial search functions

-- 1. Standard semantic search for opportunities
CREATE OR REPLACE FUNCTION public.semantic_search_opportunities(
  query_embedding vector(384),
  match_threshold double precision,
  match_count int
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  similarity double precision
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.title,
    o.description,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  JOIN public.opportunities o ON e.reference_id = o.id
  WHERE e.reference_type = 'opportunity'
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- 2. Hybrid Geospatial Semantic Search
-- Filters by ST_DWithin and ST_Distance postgis metrics, sorted by vector similarity
CREATE OR REPLACE FUNCTION public.nearby_semantic_search_opportunities(
  query_embedding vector(384),
  lat NUMERIC,
  lon NUMERIC,
  max_distance_meters double precision,
  match_threshold double precision,
  match_count int
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  similarity double precision,
  distance double precision
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.title,
    o.description,
    1 - (e.embedding <=> query_embedding) AS similarity,
    ST_Distance(
      o.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) AS distance
  FROM public.embeddings e
  JOIN public.opportunities o ON e.reference_id = o.id
  WHERE e.reference_type = 'opportunity'
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
    AND ST_DWithin(
      o.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
      max_distance_meters
    )
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
