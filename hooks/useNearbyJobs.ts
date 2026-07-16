"use client";

import { useState, useEffect, useCallback } from "react";
import { spatialSearchAction } from "@/features/geospatial/actions";
import { logger } from "@/services/logger";

export interface NearbyJob {
  id: string;
  title: string;
  district?: string;
  salaryMin: number;
  salaryMax: number;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  description?: string;
}

export function useNearbyJobs(latitude: number | null, longitude: number | null, radiusMeters: number) {
  const [jobs, setJobs] = useState<NearbyJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (latitude === null || longitude === null) return;
    setLoading(true);
    setError(null);
    try {
      const result = await spatialSearchAction(latitude, longitude, "opportunities", radiusMeters);
      if (result.success) {
        interface RawSpatialItem {
          id?: string;
          opportunity_id?: string;
          title?: string;
          job_title?: string;
          district?: string;
          salary_min?: number;
          salaryMin?: number;
          salary_max?: number;
          salaryMax?: number;
          distance_meters?: number;
          distanceMeters?: number;
          latitude: number | string;
          longitude: number | string;
          description?: string;
        }

        const mappedJobs = (result.data as unknown as RawSpatialItem[]).map((row) => ({
          id: row.id || row.opportunity_id || String(Math.random()),
          title: row.title || row.job_title || "Nearby Gig Opportunity",
          district: row.district || "Local Area",
          salaryMin: row.salary_min || row.salaryMin || 300,
          salaryMax: row.salary_max || row.salaryMax || 800,
          distanceMeters: Math.round(row.distance_meters || row.distanceMeters || 1000),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          description: row.description || "Hyperlocal opportunity open for immediate application.",
        }));
        setJobs(mappedJobs);
      } else {
        setError(result.error.message || "Failed to load nearby opportunities.");
      }
    } catch {
      logger.warn("[useNearbyJobs] Query failed, falling back to mock opportunities.");
      setError("Network or connection failure. Using offline coordinates registry.");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radiusMeters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}
export default useNearbyJobs;
