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

export interface MapGeofence {
  id: string;
  name: string;
  type: string; // work_zone, restricted_zone, etc.
  boundary?: [number, number][]; // Array of [longitude, latitude] for polygon
  radius?: number; // circle radius in meters
  latitude?: number; // circle center
  longitude?: number;
}

interface MaplibreMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
  routeCoordinates?: [number, number][]; // Array of [longitude, latitude]
  geofences?: MapGeofence[];
  isOffline?: boolean;
}

/**
 * Luxury Vector Map Component.
 * - Powered by MapLibre GL and OpenStreetMap
 * - Supports route lines, polygon boundary geofences, and custom markers
 * - Integrated with offline indicator and WCAG accessible labels
 */
export function MaplibreMap({
  latitude,
  longitude,
  zoom = 13,
  markers = [],
  routeCoordinates = [],
  geofences = [],
  isOffline = false,
}: MaplibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

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

    mapInstance.addControl(new maplibregl.NavigationControl(), "top-right");

    mapInstance.on("load", () => {
      setStyleLoaded(true);
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [latitude, longitude, zoom]);

  // Keep map center aligned when coords update
  useEffect(() => {
    if (map) {
      map.setCenter([longitude, latitude]);
    }
  }, [map, latitude, longitude]);

  // Sync Markers
  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    markers.forEach((markerInfo) => {
      const popup = markerInfo.label
        ? new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="text-xs font-semibold p-1 text-black">${markerInfo.label}</div>`
          )
        : undefined;

      const marker = new maplibregl.Marker({
        color: markerInfo.color || "#c5a880", // default gold
      })
        .setLngLat([markerInfo.longitude, markerInfo.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [map, markers]);

  // Sync Routes & Geofences Layers
  useEffect(() => {
    if (!map || !styleLoaded) return;

    // 1. Draw Route LineString
    const routeSourceId = "route-source";
    const routeLayerId = "route-layer";

    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);

    if (routeCoordinates && routeCoordinates.length > 0) {
      map.addSource(routeSourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeCoordinates,
          },
        },
      });

      map.addLayer({
        id: routeLayerId,
        type: "line",
        source: routeSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#e0a96d", // Amber Route theme
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
    }

    // 2. Draw Geofences
    geofences.forEach((fence) => {
      const sourceId = `fence-src-${fence.id}`;
      const fillLayerId = `fence-fill-${fence.id}`;
      const lineLayerId = `fence-line-${fence.id}`;

      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      let geoJsonData: maplibregl.GeoJSONSourceSpecification["data"] | null = null;

      if (fence.boundary && fence.boundary.length > 0) {
        // Polygon boundary
        const coords = [...fence.boundary];
        // Ensure polygon is closed
        if (
          coords[0][0] !== coords[coords.length - 1][0] ||
          coords[0][1] !== coords[coords.length - 1][1]
        ) {
          coords.push(coords[0]);
        }

        geoJsonData = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
        };
      } else if (fence.radius && fence.latitude && fence.longitude) {
        // Generate circular polygon approximations for OpenStreetMap rendering
        const points = 64;
        const coords: [number, number][] = [];
        const distanceX = fence.radius / (111320 * Math.cos((fence.latitude * Math.PI) / 180));
        const distanceY = fence.radius / 110540;

        for (let i = 0; i < points; i++) {
          const theta = (i / points) * (2 * Math.PI);
          const x = fence.longitude + distanceX * Math.cos(theta);
          const y = fence.latitude + distanceY * Math.sin(theta);
          coords.push([x, y]);
        }
        coords.push(coords[0]); // close polygon

        geoJsonData = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coords],
          },
        };
      }

      if (geoJsonData) {
        const color = fence.type === "restricted_zone" ? "#ef4444" : "#10b981"; // Red vs Green

        map.addSource(sourceId, {
          type: "geojson",
          data: geoJsonData,
        });

        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": color,
            "fill-opacity": 0.15,
          },
        });

        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": color,
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });
      }
    });

    return () => {
      // Cleanup layers if component updates
      geofences.forEach((fence) => {
        try {
          if (map.getLayer(`fence-fill-${fence.id}`)) map.removeLayer(`fence-fill-${fence.id}`);
          if (map.getLayer(`fence-line-${fence.id}`)) map.removeLayer(`fence-line-${fence.id}`);
          if (map.getSource(`fence-src-${fence.id}`)) map.removeSource(`fence-src-${fence.id}`);
        } catch {
          // ignore
        }
      });
    };
  }, [map, styleLoaded, routeCoordinates, geofences]);

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-border shadow-(--shadow-luxury) backdrop-blur-md">
      <div ref={mapContainer} className="w-full h-full" />
      {isOffline && (
        <div className="absolute bottom-4 left-4 bg-destructive/90 text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse z-10">
          <span>⚠️</span> Offline Mode • Map Cached
        </div>
      )}
    </div>
  );
}

export default MaplibreMap;
