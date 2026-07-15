"use client";

import { useEffect, useState, useRef } from "react";
import { MapGeofence } from "@/components/MaplibreMap";
import { calculateDistance } from "@/utils/geospatial";

interface GeofencingOptions {
  latitude: number | null;
  longitude: number | null;
  geofences: MapGeofence[];
  onEnter?: (geofence: MapGeofence) => void;
  onLeave?: (geofence: MapGeofence) => void;
}

function isPointInPolygon(latitude: number, longitude: number, polygon: [number, number][]): boolean {
  let inside = false;
  const x = longitude;
  const y = latitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; // longitude
    const yi = polygon[i][1]; // latitude
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Custom React Hook: Client-Side Geofencing engine.
 * - Resolves intersection of current GPS coords against circular or polygon boundaries
 * - Manages active fences inside state
 * - Dispatches network logging actions on boundary cross transition
 */
export function useGeofencing({
  latitude,
  longitude,
  geofences,
  onEnter,
  onLeave,
}: GeofencingOptions) {
  const [activeFences, setActiveFences] = useState<string[]>([]);
  const previousInsideRef = useRef<Record<string, boolean>>({});

  async function logEvent(geofenceId: string, eventType: "enter" | "leave") {
    try {
      await fetch("/api/geospatial/geofence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geofenceId,
          eventType,
          correlationId: `client-geofence-${Date.now()}`,
        }),
      });
    } catch {
      // Bypassed geofence event logging
    }
  }

  useEffect(() => {
    if (latitude === null || longitude === null || geofences.length === 0) return;

    const currentInside: Record<string, boolean> = {};
    const newlyEntered: MapGeofence[] = [];
    const newlyLeft: MapGeofence[] = [];

    geofences.forEach((fence) => {
      let inside = false;

      if (fence.boundary && fence.boundary.length > 0) {
        inside = isPointInPolygon(latitude, longitude, fence.boundary);
      } else if (fence.radius && fence.latitude && fence.longitude) {
        const dist = calculateDistance(
          { latitude, longitude },
          { latitude: fence.latitude, longitude: fence.longitude }
        );
        inside = dist <= fence.radius;
      }

      currentInside[fence.id] = inside;

      const wasInside = previousInsideRef.current[fence.id] || false;

      if (inside && !wasInside) {
        newlyEntered.push(fence);
      } else if (!inside && wasInside) {
        newlyLeft.push(fence);
      }
    });

    // Fire callbacks and log events
    newlyEntered.forEach((fence) => {
      if (onEnter) onEnter(fence);
      logEvent(fence.id, "enter");
    });

    newlyLeft.forEach((fence) => {
      if (onLeave) onLeave(fence);
      logEvent(fence.id, "leave");
    });

    previousInsideRef.current = currentInside;

    // Update active geofences list
    const active = Object.keys(currentInside).filter((id) => currentInside[id]);
    setActiveFences(active);
  }, [latitude, longitude, geofences, onEnter, onLeave]);

  return {
    activeFences,
    isInside: (geofenceId: string) => activeFences.includes(geofenceId),
  };
}

export default useGeofencing;
