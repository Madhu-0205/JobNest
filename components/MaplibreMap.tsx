"use client";

import { useEffect, useRef, useState } from "react";import { useI18n } from "@/lib/i18n/context";
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
  isOffline = false
}: MaplibreMapProps) {const { t: i18nT } = useI18n();
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
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],

            tileSize: 256,
            attribution: "© OpenStreetMap contributors"
          }
        },
        layers: [
        {
          id: "osm-raster-layer",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
          maxzoom: 19
        }]

      },
      center: [longitude, latitude],
      zoom: zoom
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

  // Sync Markers via GeoJSON source for Native Clustering
  useEffect(() => {
    if (!map || !styleLoaded) return;

    const geoJsonData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: markers.map((m, i) => ({
        type: "Feature",
        properties: {
          id: i,
          label: m.label || "",
          color: m.color || "#c5a880"
        },
        geometry: {
          type: "Point",
          coordinates: [m.longitude, m.latitude]
        }
      }))
    };

    if (map.getSource("markers-source")) {
      (map.getSource("markers-source") as maplibregl.GeoJSONSource).setData(geoJsonData);
    } else {
      map.addSource("markers-source", {
        type: "geojson",
        data: geoJsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "markers-source",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            10,
            "#f1f075",
            50,
            "#f28cb1"
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10,
            30,
            50,
            40
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "markers-source",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Regular"],
          "text-size": 12
        }
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "markers-source",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff"
        }
      });

      // Handle unclustered point clicks for popup
      map.on('click', 'unclustered-point', (e) => {
        const features = e.features;
        if (!features || !features[0]) return;
        
        const coordinates = (features[0].geometry as GeoJSON.Point).coordinates.slice();
        const label = features[0].properties?.['label'];

        if (label) {
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new maplibregl.Popup({ offset: 15 })
            .setLngLat([coordinates[0], coordinates[1]])
            .setHTML(`<div class="text-xs font-semibold p-1 text-black">${label}</div>`)
            .addTo(map);
        }
      });

      // Change pointer on hover
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });

      // Zoom in on cluster click
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties?.['cluster_id'];
        const source = map.getSource('markers-source') as maplibregl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom: zoom
          });
        }).catch(() => {});
      });
    }

    // Cleanup old DOM markers if any still exist
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

  }, [map, markers, styleLoaded]);

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
            coordinates: routeCoordinates
          }
        }
      });

      map.addLayer({
        id: routeLayerId,
        type: "line",
        source: routeSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#e0a96d", // Amber Route theme
          "line-width": 5,
          "line-opacity": 0.85
        }
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
        coords[0][1] !== coords[coords.length - 1][1])
        {
          coords.push(coords[0]);
        }

        geoJsonData = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coords]
          }
        };
      } else if (fence.radius && fence.latitude && fence.longitude) {
        // Generate circular polygon approximations for OpenStreetMap rendering
        const points = 64;
        const coords: [number, number][] = [];
        const distanceX = fence.radius / (111320 * Math.cos(fence.latitude * Math.PI / 180));
        const distanceY = fence.radius / 110540;

        for (let i = 0; i < points; i++) {
          const theta = i / points * (2 * Math.PI);
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
            coordinates: [coords]
          }
        };
      }

      if (geoJsonData) {
        const color = fence.type === "restricted_zone" ? "#ef4444" : "#10b981"; // Red vs Green

        map.addSource(sourceId, {
          type: "geojson",
          data: geoJsonData
        });

        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": color,
            "fill-opacity": 0.15
          }
        });

        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": color,
            "line-width": 2,
            "line-dasharray": [2, 2]
          }
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
        }});
    };
  }, [map, styleLoaded, routeCoordinates, geofences]);

  return (
    <div className="relative w-full h-112.5 rounded-2xl overflow-hidden border border-border shadow-(--shadow-luxury) backdrop-blur-md">
      <div ref={mapContainer} className="w-full h-full" />
      {isOffline &&
      <div className="absolute bottom-4 left-4 bg-destructive/90 text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse z-10">
          <span>⚠️</span>{i18nT("common.offlineModeMapCached")}
      </div>
      }
    </div>);

}

export default MaplibreMap;