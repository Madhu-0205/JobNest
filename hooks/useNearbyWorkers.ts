"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/services/logger";
import { calculateDistance } from "@/utils/geospatial";

export interface NearbyWorker {
  userId: string;
  jobTitle: string;
  experienceYears: number;
  bio: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  trustScore?: number;
  responseTimeMinutes?: number;
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

export function useNearbyWorkers(latitude: number | null, longitude: number | null, radiusMeters: number) {
  const [workers, setWorkers] = useState<NearbyWorker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSearchCoords = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastSearchTime = useRef<number>(0);
  const lastSearchRadius = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWorkers = useCallback(async (options?: { bypassThrottle?: boolean }) => {
    if (latitude === null || longitude === null || radiusMeters <= 0) return;

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

      // Rule: Execute backend calls only if moved > 50m OR > 60s elapsed OR radius changed
      if (distanceMoved <= 50 && timeElapsed < 60000 && !radiusChanged) {
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
        "workers",
        currentRadius,
        controller.signal
      );

      if (result.success) {
        interface RawWorkerItem {
          user_id?: string;
          userId?: string;
          job_title?: string;
          jobTitle?: string;
          experience_years?: number;
          experienceYears?: number;
          bio?: string;
          distance_meters?: number;
          distanceMeters?: number;
          latitude: number | string;
          longitude: number | string;
          trust_score?: number;
          trustScore?: number;
          response_time_minutes?: number;
          responseTimeMinutes?: number;
        }

        const mappedWorkers = (result.data as unknown as RawWorkerItem[]).map((row) => ({
          userId: row.user_id || row.userId || String(Math.random()),
          jobTitle: row.job_title || row.jobTitle || "Skilled Handyman",
          experienceYears: row.experience_years || row.experienceYears || 3,
          bio: row.bio || "Available for hyperlocal tasks and immediate booking.",
          distanceMeters: Math.round(row.distance_meters || row.distanceMeters || 1500),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          trustScore: row.trust_score || row.trustScore || 95,
          responseTimeMinutes: row.response_time_minutes || row.responseTimeMinutes || 15,
        }));
        setWorkers(mappedWorkers);

        // Update refs on successful fetch
        lastSearchCoords.current = { latitude, longitude };
        lastSearchTime.current = now;
        lastSearchRadius.current = currentRadius;
      } else {
        setError(result.error?.message || "Failed to load nearby workers.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        logger.info("[useNearbyWorkers] Request aborted.");
        return;
      }
      logger.error("[useNearbyWorkers] Query failed", err as Record<string, unknown>);
      setError("Network connection failure while loading nearby workers.");
      setWorkers([]); // Explicitly empty instead of using mocks
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [latitude, longitude, radiusMeters]);

  useEffect(() => {
    fetchWorkers();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWorkers]);

  const refetch = useCallback(async () => {
    await fetchWorkers({ bypassThrottle: true });
  }, [fetchWorkers]);

  return { workers, loading, error, refetch };
}
export default useNearbyWorkers;
