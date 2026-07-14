"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapMarker {
  latitude: number;
  longitude: number;
  label?: string;
  color?: string;
}

interface MaplibreMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
}

/**
 * Luxury Client-Side Vector Map Component.
 * - Powered by MapLibre GL and OpenStreetMap Open Tiles
 * - Encapsulated inside Client Component boundaries for SSR safety
 * - Supports dynamic markers and custom accessibility labels
 */
export function MaplibreMap({ latitude, longitude, zoom = 13, markers = [] }: MaplibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre instance on container mount
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-raster-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [longitude, latitude],
      zoom: zoom,
    });

    // Add navigation tools
    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");
    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [latitude, longitude, zoom]);

  // Keep map center aligned when coordinates update
  useEffect(() => {
    if (map) {
      map.setCenter([longitude, latitude]);
    }
  }, [map, latitude, longitude]);

  // Synchronize map markers
  useEffect(() => {
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Append new markers
    markers.forEach((markerInfo) => {
      const popup = markerInfo.label
        ? new maplibregl.Popup({ offset: 25 }).setHTML(`<div class="text-sm font-semibold p-1 text-black">${markerInfo.label}</div>`)
        : undefined;

      const marker = new maplibregl.Marker({
        color: markerInfo.color || "#c5a880", // JobNest Gold theme default
      })
        .setLngLat([markerInfo.longitude, markerInfo.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [map, markers]);

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-border shadow-[var(--shadow-luxury)] backdrop-blur-md">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

export default MaplibreMap;
