"use client";

import { useEffect, useState } from "react";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { calculateDistance } from "@/utils/geospatial";

interface TrackingData {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  status: string;
}

/**
 * Custom React Hook: Live Transit Tracking.
 * - Subscribes to real-time location coordinate updates of workers in transit.
 * - Calculates remaining distances and ETAs based on velocity.
 * - Simulates route transit for showcase maps navigation.
 */
export function useLiveTracking(
  userId: string,
  destinationCoords?: { latitude: number; longitude: number }
) {
  const [currentLocation, setCurrentLocation] = useState<TrackingData | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const { channel, isFallback } = useRealtimeChannel(`live-tracking-${userId}`);

  // Load current coordinates
  useEffect(() => {
    async function loadCurrent() {
      try {
        const res = await fetch(`/api/realtime/track?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentLocation({
            latitude: data.data.latitude,
            longitude: data.data.longitude,
            speed: data.data.speed || 0,
            heading: data.data.heading || 0,
            accuracy: data.data.accuracy || 10,
            status: data.data.status || "available",
          });
        }
      } catch {
        // Fallback default coordinates
        setCurrentLocation({
          latitude: 12.9716,
          longitude: 77.5946,
          speed: 0,
          heading: 0,
          accuracy: 8,
          status: "available",
        });
      }
    }
    loadCurrent();
  }, [userId]);

  // Subscribe to changes on live tracking channels
  useEffect(() => {
    if (isFallback || !channel) return;

    const sub = channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_tracking",
          filter: `user_id=eq.${userId}`,
        },
        (payload: Record<string, unknown>) => {
          const updated = payload["new"] as unknown as TrackingData;
          if (updated) {
            setCurrentLocation({
              latitude: updated.latitude,
              longitude: updated.longitude,
              speed: updated.speed || 0,
              heading: updated.heading || 0,
              accuracy: updated.accuracy || 10,
              status: updated.status || "available",
            });
          }
        }
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [channel, isFallback, userId]);

  // Compute remaining distance and ETA durations
  useEffect(() => {
    if (!currentLocation || !destinationCoords) {
      setDistanceRemaining(null);
      setEtaSeconds(null);
      return;
    }

    const dist = calculateDistance(
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      { latitude: destinationCoords.latitude, longitude: destinationCoords.longitude }
    );
    setDistanceRemaining(dist);

    // Compute ETA using velocity (speed in meters/sec). Fallback to standard 10 m/s if stationary
    const velocity = currentLocation.speed > 0.5 ? currentLocation.speed : 10;
    const eta = dist / velocity;
    setEtaSeconds(Math.round(eta));
  }, [currentLocation, destinationCoords]);

  // Simulates transit of coords along a route for the showcase sandbox
  const simulateTransit = (routeCoords: [number, number][], onStepCompleted?: (coord: [number, number], heading: number, speed: number) => void) => {
    if (routeCoords.length === 0) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index >= routeCoords.length) {
        clearInterval(interval);
        return;
      }

      const [lon, lat] = routeCoords[index];
      let nextHeading = 0;
      if (index < routeCoords.length - 1) {
        const [nextLon, nextLat] = routeCoords[index + 1];
        nextHeading = Math.round((Math.atan2(nextLon - lon, nextLat - lat) * 180) / Math.PI);
        if (nextHeading < 0) nextHeading += 360;
      }

      const speed = 12.0 + Math.random() * 3; // ~45 km/h in m/s

      const newLoc = {
        latitude: lat,
        longitude: lon,
        speed,
        heading: nextHeading,
        accuracy: 4.5,
        status: "working",
      };

      setCurrentLocation(newLoc);
      
      if (onStepCompleted) {
        onStepCompleted([lon, lat], nextHeading, speed);
      }

      // Fire tracking coordinate to backend if online
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      if (isOnline) {
        fetch("/api/realtime/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newLoc),
        }).catch(() => {});
      }

      index++;
    }, 2000);

    return () => clearInterval(interval);
  };

  return {
    currentLocation,
    distanceRemaining,
    etaSeconds,
    simulateTransit,
  };
}

export default useLiveTracking;
