"use client";

import { useEffect } from "react";
import { useMapInstance } from "@/providers/MapProvider";

interface RoutePolylineProps {
  coordinates: [number, number][]; // Array of [lng, lat]
  color?: string;
  width?: number;
  id?: string;
}

export function RoutePolyline({
  coordinates,
  color = "#c5a880", // JobNest Gold Accent
  width = 5,
  id = "route-line-layer",
}: RoutePolylineProps) {
  const { map } = useMapInstance();

  useEffect(() => {
    if (!map || coordinates.length === 0) return;

    const sourceId = `${id}-source`;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates,
      },
    };

    // If source already exists, update data
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: id,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": color,
          "line-width": width,
          "line-opacity": 0.8,
        },
      });
    }

    return () => {
      if (map) {
        try {
          if (map.getLayer(id)) {
            map.removeLayer(id);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch {
          // Bypassed potential layer unmounting race conditions
        }
      }
    };
  }, [map, coordinates, color, width, id]);

  return null;
}
export default RoutePolyline;
