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
import { ShieldAlert, Share2, Loader2, CloudOff } from "lucide-react";
import { logger } from "@/services/logger";
import { geocodeAddressAction } from "@/features/geospatial/actions";

interface MapViewProps {
  mode: MapMode;
  onSelectEntity?: (id: string | null) => void;
}

export function MapView({ mode, onSelectEntity }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const {
    latitude,
    longitude,
    permissionStatus,
    isSpoofed,
    isOffline,
    errorMessage,
    updateLocation,
    refreshLocation,
  } = useCurrentLocation();
  
  const { map, setMap } = useMapInstance();
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(5000); // 5km
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Fallback coords: Bangalore Center (Never show 0,0)
  const defaultCoords = { lat: 12.9716, lng: 77.5946 };
  const activeLat = latitude ?? defaultCoords.lat;
  const activeLng = longitude ?? defaultCoords.lng;

  // Search state for permission denied overlay
  const [deniedSearchQuery, setDeniedSearchQuery] = useState("");
  const [deniedSearchLoading, setDeniedSearchLoading] = useState(false);

  // Fetching spatial datasets
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

  // Track map marker portal anchors
  const [portals, setPortals] = useState<React.ReactPortal[]>([]);
  const markerContainersRef = useRef<HTMLDivElement[]>([]);

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

    // Add Compass Control (Built-in NavigationControl showing only compass)
    const compassControl = new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: false,
    });
    mapInstance.addControl(compassControl, "top-right");

    // Add Scale Control
    const scaleControl = new maplibregl.ScaleControl({
      maxWidth: 80,
      unit: "metric",
    });
    mapInstance.addControl(scaleControl, "bottom-left");

    mapInstance.on("load", () => {
      setStyleLoaded(true);
      setMap(mapInstance);
      logger.info("[MapView] MapLibre instance initialized successfully.");
    });

    return () => {
      mapInstance.remove();
      setMap(null);
      setStyleLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMap]);

  // Smooth camera transitions when active coordinates update
  useEffect(() => {
    if (map && styleLoaded) {
      map.flyTo({
        center: [activeLng, activeLat],
        zoom: map.getZoom(),
        duration: 1200,
        essential: true,
      });
    }
  }, [map, styleLoaded, activeLat, activeLng]);

  // Handle manual city search on permission denied screen
  const handleDeniedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deniedSearchQuery.trim()) return;

    setDeniedSearchLoading(true);
    try {
      const res = await geocodeAddressAction({ address: deniedSearchQuery });
      if (res.success && res.data) {
        const { latitude: lat, longitude: lng } = res.data;
        if (lat !== 0 || lng !== 0) {
          updateLocation(lat, lng, "manual");
          logger.info(`[MapView] Manual city search succeeded. Setting location to: ${lat}, ${lng}`);
        }
      }
    } catch (err) {
      logger.warn("[MapView] Denied city search geocode failed", err as Record<string, unknown>);
    } finally {
      setDeniedSearchLoading(false);
    }
  };

  // Render Portal Markers in MapLibre
  useEffect(() => {
    if (!map || !styleLoaded) return;

    // Clear old portals and DOM markers
    markerContainersRef.current.forEach((el) => el.remove());
    markerContainersRef.current = [];
    setPortals([]);

    const newPortals: React.ReactPortal[] = [];

    // 1. Render Current User Location Marker with Pulse animation in all modes
    if (activeLat !== null && activeLng !== null) {
      const elCurrent = document.createElement("div");
      map.getContainer().appendChild(elCurrent);
      markerContainersRef.current.push(elCurrent);

      new maplibregl.Marker({ element: elCurrent })
        .setLngLat([activeLng, activeLat])
        .addTo(map);

      if (mode === "tracking") {
        newPortals.push(
          createPortal(
            <div className="relative flex items-center justify-center w-8 h-8 group pointer-events-none">
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75 w-8 h-8" />
              <div className="relative w-8 h-8 rounded-full border-2 border-white bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md">
                ME
              </div>
            </div>,
            elCurrent
          )
        );
      } else {
        newPortals.push(
          createPortal(
            <div className="relative flex items-center justify-center w-8 h-8 group pointer-events-none">
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75 w-8 h-8" />
              <div className="relative w-4 h-4 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>,
            elCurrent
          )
        );
      }
    }

    // 2. Render Opportunity Markers
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

    // 3. Render Worker Markers
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

    // 4. Render active target tracking marker
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
    }

    setPortals(newPortals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div className="flex flex-col gap-4 text-foreground">
            {/* Header info with Photo, Name, Rating */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold text-lg shadow-inner">
                {job.title.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <Typography variant="h3" className="text-base font-bold text-foreground leading-tight">
                  {job.title}
                </Typography>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-amber-500">4.8 ★</span>
                  <span>•</span>
                  <span>{job.district || "Local Area"}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-mono">Distance</span>
                <span className="text-xs font-bold font-mono text-primary">{(job.distanceMeters / 1000).toFixed(1)} km</span>
              </div>
            </div>

            {/* Description */}
            <Typography variant="p" className="text-xs leading-relaxed text-muted-foreground">
              {job.description || "Hyperlocal gig opportunity open for immediate application. Requires standard verification."}
            </Typography>

            {/* Stats row: Trust Score & Price */}
            <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border/40 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Security Rating</span>
                <span className="font-bold text-foreground">96% Trust Score</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Expected Pay</span>
                <span className="font-bold text-emerald-400">₹{job.salaryMin} - ₹{job.salaryMax} / day</span>
              </div>
            </div>

            {/* CTA Action */}
            <Button size="sm" className="w-full rounded-xl font-bold text-xs py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-md">
              Apply for Gig Opportunity
            </Button>
          </div>
        );
      }
    }

    if (mode === "employer" || mode === "resident") {
      const worker = workers.find((w) => w.userId === selectedItemId);
      if (worker) {
        // Resolve a friendly display name based on userId or fallback
        const nameMap: Record<string, string> = {
          "worker-1": "Arun Kumar",
          "worker-2": "Suresh Prasad",
          "worker-3": "Kiran Rao",
        };
        const displayName = nameMap[worker.userId] || "Local Professional";

        return (
          <div className="flex flex-col gap-4 text-foreground">
            {/* Header info with Photo, Name, Rating */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/30 to-amber-600/30 flex items-center justify-center text-primary font-bold text-base border border-primary/20 shadow-sm">
                {displayName.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <Typography variant="h3" className="text-base font-bold text-foreground leading-tight">
                  {displayName}
                </Typography>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-amber-500">4.9 ★</span>
                  <span>•</span>
                  <span>{worker.jobTitle} ({worker.experienceYears} Yrs Exp)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-mono">Distance</span>
                <span className="text-xs font-bold font-mono text-primary">{(worker.distanceMeters / 1000).toFixed(1)} km</span>
              </div>
            </div>

            {/* Description */}
            <Typography variant="p" className="text-xs leading-relaxed text-muted-foreground">
              {worker.bio || "Available for immediate booking in your municipality. All paperwork verified by trust ledger."}
            </Typography>

            {/* Stats row: Trust Score & Price */}
            <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border/40 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Trust Score</span>
                <span className="font-bold text-foreground">{worker.trustScore || 95}% Verifiable</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Expected Pay</span>
                <span className="font-bold text-emerald-400">₹400 - ₹800 / day</span>
              </div>
            </div>

            {/* CTA Action */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="w-full text-xs rounded-xl py-2.5">
                View Profile
              </Button>
              <Button size="sm" className="w-full text-xs rounded-xl py-2.5 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md">
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

      {/* 1. Loading State Overlay */}
      {permissionStatus === "loading" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <Typography variant="muted" className="text-xs font-semibold">
            Acquiring secure GPS satellite lock...
          </Typography>
        </div>
      )}

      {/* 2. Security Spoof Violation State Overlay */}
      {isSpoofed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-md p-6">
          <div className="max-w-md w-full p-6 rounded-2xl border border-destructive/20 bg-card shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-destructive/10 text-destructive animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <Typography variant="h3" className="text-lg font-bold text-destructive">
                Security Policy Violation
              </Typography>
              <Typography variant="p" className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Impossible location jump or telemetry spoofing detected. Secure GPS verification failed. Access restricted.
              </Typography>
            </div>
          </div>
        </div>
      )}

      {/* 3. General Error State Overlay */}
      {errorMessage && permissionStatus !== "denied" && !isSpoofed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/20 bg-card/95 backdrop-blur-md text-destructive shadow-lg">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-[11px] font-semibold leading-tight">
              {errorMessage}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLocation}
              className="h-7 px-2 text-[10px] rounded-lg border-destructive/20 text-destructive hover:bg-destructive/5"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* 4. Offline State Indicator */}
      {isOffline && (
        <div className="absolute top-4 left-4 z-20 bg-amber-500/90 text-black font-bold text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
          <CloudOff className="w-3.5 h-3.5" />
          <span>Offline Mode — Cached Map & Opportunities</span>
        </div>
      )}

      {/* 5. Permission Denied Friendly Card Overlay */}
      {permissionStatus === "denied" && !isSpoofed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-xs p-6">
          <div className="max-w-md w-full p-6 rounded-2xl border border-primary/20 bg-card shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <Typography variant="h3" className="text-lg font-bold text-foreground">
                Location Permission Required
              </Typography>
              <Typography variant="p" className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Browser location access is currently disabled. We&apos;ve set your default location to Bengaluru.
                To find jobs near you, search for your city or click retry.
              </Typography>
            </div>

            {/* City search input inside the denied card */}
            <form onSubmit={handleDeniedSearch} className="w-full flex gap-2">
              <input
                type="text"
                value={deniedSearchQuery}
                onChange={(e) => setDeniedSearchQuery(e.target.value)}
                placeholder="Enter city (e.g. 'Mumbai', 'Chennai')..."
                className="flex-1 bg-muted border border-border text-foreground text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="sm"
                className="font-bold text-xs py-2 px-4 rounded-xl"
                isLoading={deniedSearchLoading}
              >
                Search
              </Button>
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshLocation}
              className="w-full text-xs py-2 rounded-xl mt-1"
            >
              Retry GPS Connection
            </Button>
          </div>
        </div>
      )}

      {/* Floating Status / Security Indicators */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <LiveStatusIndicator />
      </div>

      {/* Floating Search Bar */}
      {(mode === "landing" || mode === "search") && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm px-4 pointer-events-auto">
          <MapSearch
            onSearch={handleSearch}
            onSelectCoordinates={(lat, lng) => updateLocation(lat, lng, "manual")}
          />
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
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg bg-red-950/80 text-red-300 border-red-800 flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg bg-background/90 text-primary border-primary/20 flex items-center gap-1"
            >
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
