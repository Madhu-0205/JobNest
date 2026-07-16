"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createPortal } from "react-dom";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useMapInstance } from "@/providers/MapProvider";
import { useNearbyJobs } from "@/hooks/useNearbyJobs";
import { useNearbyWorkers } from "@/hooks/useNearbyWorkers";
import { useNearbyResidents } from "@/hooks/useNearbyResidents";
import { useRouteNavigation } from "@/hooks/useRouteNavigation";
import { MapMode } from "@/hooks/useMapState";

// Inner Map Components
import CurrentLocationButton from "./CurrentLocationButton";
import MapControls from "./MapControls";
import MapSearch from "./MapSearch";
import RadiusSelector from "./RadiusSelector";
import MapBottomSheet from "./MapBottomSheet";
import WorkerMarker from "./WorkerMarker";
import OpportunityMarker from "./OpportunityMarker";
import RoutePolyline from "./RoutePolyline";
import ETAWidget from "./ETAWidget";
import LiveStatusIndicator from "./LiveStatusIndicator";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { ShieldAlert, Share2 } from "lucide-react";
import { logger } from "@/services/logger";

interface MapViewProps {
  mode: MapMode;
  onSelectEntity?: (id: string | null) => void;
}

export function MapView({ mode, onSelectEntity }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { latitude, longitude } = useCurrentLocation();
  const { map, setMap } = useMapInstance();
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(5000); // 5km
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 12.9716,
    lng: 77.5946,
  });

  // Track map marker portal anchors
  const [portals, setPortals] = useState<React.ReactPortal[]>([]);
  const markerContainersRef = useRef<HTMLDivElement[]>([]);

  // Fetching spatial datasets
  const activeLat = latitude || centerCoordinates.lat;
  const activeLng = longitude || centerCoordinates.lng;

  const { jobs } = useNearbyJobs(activeLat, activeLng, selectedRadius);
  const { workers } = useNearbyWorkers(activeLat, activeLng, selectedRadius);
  useNearbyResidents(activeLat, activeLng, selectedRadius);

  // Tracking route simulation point coords
  const trackingTarget = mode === "tracking" && workers.length > 0 ? workers[0] : null;
  const { route, etaMinutes, distanceRemainingMeters, speechInstruction } = useRouteNavigation(
    activeLat,
    activeLng,
    trackingTarget ? trackingTarget.latitude : null,
    trackingTarget ? trackingTarget.longitude : null,
    "driving-car"
  );

  // Initialize Map
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
      center: [activeLng, activeLat],
      zoom: mode === "tracking" ? 14 : 13,
    });

    mapInstance.on("load", () => {
      setStyleLoaded(true);
      setMap(mapInstance);
      logger.info("[MapView] MapLibre instances initialized successfully.");
    });

    return () => {
      mapInstance.remove();
      setMap(null);
      setStyleLoaded(false);
    };
  }, [setMap]);

  // Center Map on coordinate updates
  useEffect(() => {
    if (map && styleLoaded) {
      map.setCenter([activeLng, activeLat]);
    }
  }, [map, styleLoaded, activeLat, activeLng]);

  // Render Portal Markers in MapLibre
  useEffect(() => {
    if (!map || !styleLoaded) return;

    // Clear old portals and DOM markers
    markerContainersRef.current.forEach((el) => el.remove());
    markerContainersRef.current = [];
    setPortals([]);

    const newPortals: React.ReactPortal[] = [];

    // 1. Render Opportunity Markers
    if (mode === "worker" || mode === "landing" || mode === "search") {
      jobs.forEach((job) => {
        const el = document.createElement("div");
        map.getContainer().appendChild(el);
        markerContainersRef.current.push(el);

        new maplibregl.Marker({ element: el })
          .setLngLat([job.longitude, job.latitude])
          .addTo(map);

        newPortals.push(
          createPortal(
            <OpportunityMarker
              title={job.title}
              salaryMax={job.salaryMax}
              isSelected={selectedItemId === job.id}
              onClick={() => {
                setSelectedItemId(job.id);
                if (onSelectEntity) onSelectEntity(job.id);
              }}
            />,
            el
          )
        );
      });
    }

    // 2. Render Worker Markers
    if (mode === "employer" || mode === "resident") {
      workers.forEach((worker) => {
        const el = document.createElement("div");
        map.getContainer().appendChild(el);
        markerContainersRef.current.push(el);

        new maplibregl.Marker({ element: el })
          .setLngLat([worker.longitude, worker.latitude])
          .addTo(map);

        newPortals.push(
          createPortal(
            <WorkerMarker
              jobTitle={worker.jobTitle}
              experienceYears={worker.experienceYears}
              isSelected={selectedItemId === worker.userId}
              onClick={() => {
                setSelectedItemId(worker.userId);
                if (onSelectEntity) onSelectEntity(worker.userId);
              }}
            />,
            el
          )
        );
      });
    }

    // 3. Render active target tracking marker
    if (mode === "tracking" && trackingTarget) {
      const el = document.createElement("div");
      map.getContainer().appendChild(el);
      markerContainersRef.current.push(el);

      new maplibregl.Marker({ element: el })
        .setLngLat([trackingTarget.longitude, trackingTarget.latitude])
        .addTo(map);

      newPortals.push(
        createPortal(
          <WorkerMarker
            jobTitle={trackingTarget.jobTitle}
            experienceYears={trackingTarget.experienceYears}
            isSelected={true}
          />,
          el
        )
      );

      // Centered employer marker
      const elEmp = document.createElement("div");
      map.getContainer().appendChild(elEmp);
      markerContainersRef.current.push(elEmp);
      new maplibregl.Marker({ element: elEmp })
        .setLngLat([activeLng, activeLat])
        .addTo(map);
        
      newPortals.push(
        createPortal(
          <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md">
            ME
          </div>,
          elEmp
        )
      );
    }

    setPortals(newPortals);
  }, [map, styleLoaded, mode, jobs, workers, trackingTarget, selectedItemId, activeLat, activeLng]);

  // Handle circular radius overlay layer
  useEffect(() => {
    if (!map || !styleLoaded) return;

    const sourceId = "circle-radius-source";
    const fillLayerId = "circle-radius-fill";
    const lineLayerId = "circle-radius-line";

    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Build circle polygon
    const points = 64;
    const coords: [number, number][] = [];
    const distanceX = selectedRadius / (111320 * Math.cos((activeLat * Math.PI) / 180));
    const distanceY = selectedRadius / 110540;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = activeLng + distanceX * Math.cos(theta);
      const y = activeLat + distanceY * Math.sin(theta);
      coords.push([x, y]);
    }
    coords.push(coords[0]);

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      },
    });

    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#c5a880",
        "fill-opacity": 0.08,
      },
    });

    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#c5a880",
        "line-width": 1.5,
        "line-dasharray": [3, 3],
      },
    });

    return () => {
      try {
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
    };
  }, [map, styleLoaded, selectedRadius, activeLat, activeLng]);

  const handleSearch = (query: string, radius?: number) => {
    logger.info(`[MapView] AI Search triggered for query: ${query}`);
    if (radius) {
      setSelectedRadius(radius);
    }
  };

  const getSelectedDetails = () => {
    if (mode === "worker" || mode === "landing" || mode === "search") {
      const job = jobs.find((j) => j.id === selectedItemId);
      if (job) {
        return (
          <div className="flex flex-col gap-3">
            <div>
              <Typography variant="h3" className="text-base font-bold text-foreground">
                {job.title}
              </Typography>
              <Typography variant="muted" className="text-xs">
                {job.district} · {job.distanceMeters}m away
              </Typography>
            </div>
            <Typography variant="p" className="text-xs leading-relaxed text-muted-foreground">
              {job.description}
            </Typography>
            <div className="flex justify-between items-center bg-card border border-border p-3 rounded-xl mt-1">
              <div>
                <span className="text-[10px] text-muted block uppercase">Salary Package</span>
                <span className="text-sm font-bold text-primary">₹{job.salaryMin} - ₹{job.salaryMax} / day</span>
              </div>
              <Button size="sm" className="rounded-lg font-bold text-xs py-2">
                Apply Now
              </Button>
            </div>
          </div>
        );
      }
    }

    if (mode === "employer" || mode === "resident") {
      const worker = workers.find((w) => w.userId === selectedItemId);
      if (worker) {
        return (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <Typography variant="h3" className="text-base font-bold text-foreground">
                  {worker.jobTitle}
                </Typography>
                <Typography variant="muted" className="text-xs">
                  {worker.experienceYears} Years Exp · {worker.distanceMeters}m away
                </Typography>
              </div>
              <div className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold py-0.5 px-2 rounded-full">
                {worker.trustScore}% Trust
              </div>
            </div>
            <Typography variant="p" className="text-xs leading-relaxed text-muted-foreground">
              {worker.bio}
            </Typography>
            <div className="flex gap-2 w-full mt-2">
              <Button variant="outline" size="sm" className="w-full text-xs rounded-lg py-2">
                View Profile
              </Button>
              <Button size="sm" className="w-full text-xs rounded-lg py-2 font-bold bg-primary text-primary-foreground hover:bg-primary/95">
                Book Professional
              </Button>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="relative w-full h-[550px] rounded-3xl overflow-hidden border border-primary/10 shadow-xl bg-card">
      {/* Mapbox/MapLibre container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Status / Security Indicators */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <LiveStatusIndicator />
      </div>

      {/* Floating Search Bar */}
      {(mode === "landing" || mode === "search") && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4 pointer-events-auto">
          <MapSearch onSearch={handleSearch} onSelectCoordinates={(lat, lng) => setCenterCoordinates({ lat, lng })} />
        </div>
      )}

      {/* Floating Current Location Trigger */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <MapControls />
        <CurrentLocationButton />
      </div>

      {/* Bottom overlay overlays: Radius Selector */}
      {mode !== "tracking" && (
        <div className="absolute bottom-6 left-4 z-10 max-w-[calc(100%-80px)] pointer-events-auto">
          <RadiusSelector currentRadius={selectedRadius} onChange={setSelectedRadius} />
        </div>
      )}

      {/* Tracking widgets */}
      {mode === "tracking" && route && (
        <div className="absolute top-4 right-4 z-10 pointer-events-auto flex flex-col gap-2 items-end">
          <ETAWidget
            etaMinutes={etaMinutes}
            distanceRemainingMeters={distanceRemainingMeters}
            speechInstruction={speechInstruction}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg bg-red-950/80 text-red-300 border-red-800 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg bg-background/90 text-primary border-primary/20 flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Location</span>
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Sheet Details */}
      <MapBottomSheet
        isOpen={selectedItemId !== null}
        onClose={() => setSelectedItemId(null)}
        title={mode === "worker" ? "Gig Details" : "Worker Profile"}
      >
        {getSelectedDetails()}
      </MapBottomSheet>

      {/* Route Render Line */}
      {mode === "tracking" && route && (
        <RoutePolyline coordinates={route.coordinates} color="#e0a96d" />
      )}

      {/* React Portals for Maplibre GL Marker Elements */}
      {portals}
    </div>
  );
}
export default MapView;
