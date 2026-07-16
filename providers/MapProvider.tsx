"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Map as MaplibreMapInstance } from "maplibre-gl";

export interface MapContextType {
  map: MaplibreMapInstance | null;
  setMap: (map: MaplibreMapInstance | null) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  fitBounds: (bounds: [number, number, number, number]) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<MaplibreMapInstance | null>(null);

  const flyTo = useCallback((lat: number, lng: number, zoom = 14) => {
    if (!map) return;
    map.flyTo({
      center: [lng, lat],
      zoom,
      essential: true,
      duration: 1500,
    });
  }, [map]);

  const fitBounds = useCallback((bounds: [number, number, number, number]) => {
    if (!map) return;
    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 1200,
    });
  }, [map]);

  return (
    <MapContext.Provider
      value={{
        map,
        setMap,
        flyTo,
        fitBounds,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapInstance() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapInstance must be used within a MapProvider");
  }
  return context;
}
