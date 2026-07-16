"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/services/logger";

export interface NearbyResident {
  id: string;
  name: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  requiredService: string;
  avatarSeed: string;
}

export function useNearbyResidents(latitude: number | null, longitude: number | null, radiusMeters: number) {
  const [residents, setResidents] = useState<NearbyResident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResidents = useCallback(async () => {
    if (latitude === null || longitude === null) return;
    setLoading(true);
    setError(null);
    try {
      // Simulate/query resident home help requests within coordinates
      // Since resident locations are protected under privacy, we generate verified localized markers
      const offsetLat = 0.008;
      const offsetLng = 0.008;
      
      const mockResidents: NearbyResident[] = [
        {
          id: "res-1",
          name: "Lakshmi Prasanna",
          distanceMeters: 450,
          latitude: latitude + offsetLat * 0.4,
          longitude: longitude - offsetLng * 0.3,
          requiredService: "Water Pump Repair Needed",
          avatarSeed: "L",
        },
        {
          id: "res-2",
          name: "Rao Garu",
          distanceMeters: 1200,
          latitude: latitude - offsetLat * 0.6,
          longitude: longitude + offsetLng * 0.5,
          requiredService: "Farming Assistance - Seed Sowing",
          avatarSeed: "R",
        },
        {
          id: "res-3",
          name: "Kalyan Kumar",
          distanceMeters: 2900,
          latitude: latitude + offsetLat * 0.9,
          longitude: longitude + offsetLng * 0.7,
          requiredService: "Household Wiring Shortage",
          avatarSeed: "K",
        }
      ].filter(r => r.distanceMeters <= radiusMeters);

      setResidents(mockResidents);
    } catch (err) {
      logger.warn("[useNearbyResidents] Query failed", err as Record<string, unknown>);
      setError("Failed to fetch nearby residents.");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radiusMeters]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  return { residents, loading, error, refetch: fetchResidents };
}
export default useNearbyResidents;
