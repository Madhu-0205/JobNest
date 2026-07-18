"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/services/logger";
import { calculateDistance } from "@/utils/geospatial";

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

interface GeospatialResponse {
  success: boolean;
  data?: unknown[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Request deduplication cache
const activeQueries = new Map<string, Promise<GeospatialResponse>>();

async function fetchGeospatialData(
  latitude: number,
  longitude: number,
  searchType: "opportunities" | "workers",
  radiusMeters: number,
  signal?: AbortSignal
): Promise<GeospatialResponse> {
  const cacheKey = `${searchType}:${latitude.toFixed(5)}:${longitude.toFixed(5)}:${radiusMeters}`;
  
  if (activeQueries.has(cacheKey)) {
    return activeQueries.get(cacheKey)!;
  }
  
  const promise = (async () => {
    const response = await fetch(
      `/api/geospatial/search?latitude=${latitude}&longitude=${longitude}&searchType=${searchType}&maxDistance=${radiusMeters}`,
      { signal }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<GeospatialResponse>;
  })();
  
  activeQueries.set(cacheKey, promise);
  
  try {
    return await promise;
  } finally {
    activeQueries.delete(cacheKey);
  }
}

export function useNearbyJobs(latitude: number | null, longitude: number | null, radiusMeters: number) {
  const [jobs, setJobs] = useState<NearbyJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSearchCoords = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastSearchTime = useRef<number>(0);
  const lastSearchRadius = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchJobs = useCallback(async (options?: { bypassThrottle?: boolean }) => {
    if (latitude === null || longitude === null) return;

    const now = Date.now();
    const currentRadius = radiusMeters;

    // Check throttling rules
    if (!options?.bypassThrottle && lastSearchCoords.current !== null) {
      const distanceMoved = calculateDistance(
        { latitude, longitude },
        { latitude: lastSearchCoords.current.latitude, longitude: lastSearchCoords.current.longitude }
      );
      const timeElapsed = now - lastSearchTime.current;
      const radiusChanged = currentRadius !== lastSearchRadius.current;

      // Rule: Execute backend calls only if moved > 100m OR > 30s elapsed OR radius changed
      if (distanceMoved <= 100 && timeElapsed < 30000 && !radiusChanged) {
        logger.info(`[useNearbyJobs] Throttled fetch. Distance moved: ${distanceMoved.toFixed(1)}m, Time elapsed: ${Math.round(timeElapsed / 1000)}s`);
        return;
      }
    }

    // Cancel stale in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchGeospatialData(
        latitude,
        longitude,
        "opportunities",
        currentRadius,
        controller.signal
      );

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

        // Update refs on successful fetch
        lastSearchCoords.current = { latitude, longitude };
        lastSearchTime.current = now;
        lastSearchRadius.current = currentRadius;
      } else {
        setError(result.error?.message || "Failed to load nearby opportunities.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        logger.info("[useNearbyJobs] Request aborted.");
        return;
      }
      logger.warn("[useNearbyJobs] Query failed, falling back to mock opportunities.");
      setError("Network or connection failure. Using offline coordinates registry.");

      // Offline handling: Fallback mock opportunities
      const mockJobs = [
        { id: "opp-1", title: "Agricultural Harvesting Hand", district: "Bangalore Urban", salaryMin: 500, salaryMax: 700, distanceMeters: 1200, latitude: latitude + 0.005, longitude: longitude + 0.005, description: "Hyperlocal opportunity open for immediate application." },
        { id: "opp-2", title: "Brick Mason Chore", district: "Bangalore Rural", salaryMin: 600, salaryMax: 900, distanceMeters: 2800, latitude: latitude - 0.008, longitude: longitude + 0.004, description: "Hyperlocal opportunity open for immediate application." },
        { id: "opp-3", title: "Mandal Seed Sowing Assistant", district: "Ramnagar", salaryMin: 400, salaryMax: 550, distanceMeters: 4200, latitude: latitude + 0.012, longitude: longitude - 0.009, description: "Hyperlocal opportunity open for immediate application." },
      ].filter((job) => job.distanceMeters <= currentRadius);
      setJobs(mockJobs);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [latitude, longitude, radiusMeters]);

  useEffect(() => {
    fetchJobs();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchJobs]);

  const refetch = useCallback(async () => {
    await fetchJobs({ bypassThrottle: true });
  }, [fetchJobs]);

  return { jobs, loading, error, refetch };
}
export default useNearbyJobs;
