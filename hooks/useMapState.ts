"use client";

import { useState, useCallback } from "react";

export type MapMode =
  | "landing"
  | "worker"
  | "employer"
  | "resident"
  | "tracking"
  | "search"
  | "booking"
  | "analytics";

export interface MapState {
  mode: MapMode;
  radiusMeters: number;
  selectedId: string | null;
  focusCoordinates: { lat: number; lng: number } | null;
  isMapLoaded: boolean;
}

export function useMapState(initialMode: MapMode = "landing") {
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [radiusMeters, setRadiusMeters] = useState<number>(5000); // 5km default
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusCoordinates, setFocusCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const changeMode = useCallback((newMode: MapMode) => {
    setMode(newMode);
    setSelectedId(null);
    setFocusCoordinates(null);
  }, []);

  const selectEntity = useCallback((id: string | null, coords?: { lat: number; lng: number }) => {
    setSelectedId(id);
    if (coords) {
      setFocusCoordinates(coords);
    }
  }, []);

  return {
    mode,
    radiusMeters,
    selectedId,
    focusCoordinates,
    isMapLoaded,
    setMode: changeMode,
    setRadiusMeters,
    setSelectedId,
    setFocusCoordinates,
    setIsMapLoaded,
    selectEntity,
  };
}
export default useMapState;
