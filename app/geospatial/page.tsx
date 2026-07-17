"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ProductShell } from "@/components/ProductShell";
import { MaplibreMap, MapMarker, MapGeofence } from "@/components/MaplibreMap";
import { OfflineMapIndicator } from "@/components/OfflineMapIndicator";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useGeofencing } from "@/hooks/useGeofencing";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { NormalizedAddress, RouteResult, SpoofCheckResult } from "@/utils/geospatial";

export default function GeospatialDashboard() {
  // Locale State
  const { locale } = useI18n();

  // Map Coordinates Center
  const [centerLat, setCenterLat] = useState(12.9716); // Bangalore standard default coordinates
  const [centerLon, setCenterLon] = useState(77.5946);

  // Address Inputs
  const [addressQuery, setAddressQuery] = useState("MG Road, Bangalore");
  const [normalizedAddress, setNormalizedAddress] = useState<NormalizedAddress | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Routing State
  const [destinationLat, setDestinationLat] = useState(12.9850);
  const [destinationLon, setDestinationLon] = useState(77.6050);
  const [travelMode, setTravelMode] = useState<"driving-car" | "foot-walking" | "cycling-regular">("driving-car");
  const [routeCriteria, setRouteCriteria] = useState<"fastest" | "shortest" | "alternative">("fastest");
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Geofencing Definitions
  const demoGeofences: MapGeofence[] = [
    {
      id: "work-zone-1",
      name: "Bangalore MG Road Central Work Zone",
      type: "work_zone",
      latitude: 12.9716,
      longitude: 77.5946,
      radius: 600, // 600 meters circular work area
    },
    {
      id: "restricted-zone-1",
      name: "High Tension Line Safety Restriction Zone",
      type: "restricted_zone",
      boundary: [
        [77.5850, 12.9780],
        [77.5900, 12.9800],
        [77.5920, 12.9750],
        [77.5850, 12.9780], // Closed polygon
      ],
    },
  ];

  // Saved location presets state
  const [savedPresets, setSavedPresets] = useState<{ label: string; latitude: number; longitude: number; displayName: string }[]>([]);
  const [newPresetLabel, setNewPresetLabel] = useState("My Work Farm");

  // Geolocation Hook & Controls
  const geoControls = useCurrentLocation();
  
  // Geofencing state tracker
  const { activeFences } = useGeofencing({
    latitude: geoControls.latitude || centerLat,
    longitude: geoControls.longitude || centerLon,
    geofences: demoGeofences,
  });

  // Voice Navigation Hook
  const [isNavMuted, setIsNavMuted] = useState(false);
  const voiceNav = useVoiceNavigation({
    route: routeData,
    latitude: geoControls.latitude || centerLat,
    longitude: geoControls.longitude || centerLon,
    locale,
    isMuted: isNavMuted,
  });

  // Offline Simulation State
  const [isSimOffline, setIsSimOffline] = useState(false);

  // GPS Spoof Sandbox
  const [spoofCheckResult, setSpoofCheckResult] = useState<SpoofCheckResult | null>(null);
  const [spoofLogs, setSpoofLogs] = useState<string[]>([]);

  async function fetchSavedPresets() {
    try {
      const res = await fetch("/api/geospatial/search?searchType=saved_locations&latitude=12.9716&longitude=77.5946");
      const data = await res.json();
      if (data.success) {
        setSavedPresets(data.data || []);
      }
    } catch {
      // Fallback fallback presets
      setSavedPresets([
        { label: "Home Base", latitude: 12.9716, longitude: 77.5946, displayName: "Bangalore HQ" },
        { label: "Village Fields", latitude: 12.9850, longitude: 77.6050, displayName: "Hosur Fields" },
      ]);
    }
  }

  // Fetch initial Saved Location presets
  useEffect(() => {
    fetchSavedPresets();
  }, []);

  // Run geocoding lookup
  const handleGeocode = async () => {
    setGeocodeLoading(true);
    setGeocodeError(null);
    try {
      const res = await fetch(`/api/geospatial/geocode?address=${encodeURIComponent(addressQuery)}&locale=${locale}`);
      const data = await res.json();
      if (data.success) {
        setNormalizedAddress(data.data);
        setCenterLat(data.data.latitude);
        setCenterLon(data.data.longitude);
      } else {
        setGeocodeError(data.error?.message || "Address geocoding failed.");
      }
    } catch {
      setGeocodeError("Connection error while calling geocoder.");
    } finally {
      setGeocodeLoading(false);
    }
  };

  // Run routing lookup
  const handleCalculateRoute = async () => {
    setRouteLoading(true);
    try {
      const res = await fetch("/api/geospatial/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLatitude: centerLat,
          startLongitude: centerLon,
          endLatitude: destinationLat,
          endLongitude: destinationLon,
          mode: travelMode,
          criteria: routeCriteria,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRouteData(data.data);
      }
    } catch {
      // Offline fallback routing calculations
      const speedRates = { "foot-walking": 1.4, "cycling-regular": 4.2, "driving-car": 12.0 };
      const speed = speedRates[travelMode] || 12.0;
      
      const R = 6371000;
      const rad = Math.PI / 180;
      const dLat = (destinationLat - centerLat) * rad;
      const dLon = (destinationLon - centerLon) * rad;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(centerLat*rad)*Math.cos(destinationLat*rad)*Math.sin(dLon/2)*Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      const duration = Math.round(distance / speed);
      
      setRouteData({
        distanceMeters: Math.round(distance),
        durationSeconds: duration,
        coordinates: [
          [centerLon, centerLat],
          [destinationLon, destinationLat]
        ],
        mode: travelMode,
        criteria: routeCriteria,
      });
    } finally {
      setRouteLoading(false);
    }
  };

  // Preset Location Saver
  const handleSavePreset = async () => {
    if (!normalizedAddress) return;
    try {
      const res = await fetch("/api/geospatial/geofence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newPresetLabel,
          latitude: normalizedAddress.latitude,
          longitude: normalizedAddress.longitude,
          district: normalizedAddress.district,
          state: normalizedAddress.state,
          pincode: normalizedAddress.pincode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedPresets((prev) => [
          ...prev,
          {
            label: newPresetLabel,
            latitude: normalizedAddress.latitude,
            longitude: normalizedAddress.longitude,
            displayName: normalizedAddress.displayName,
          },
        ]);
      }
    } catch {
      // Mock local update if DB unavailable
      setSavedPresets((prev) => [
        ...prev,
        {
          label: newPresetLabel,
          latitude: normalizedAddress.latitude,
          longitude: normalizedAddress.longitude,
          displayName: normalizedAddress.displayName,
        },
      ]);
    }
  };

  // Run coordinate tracking spoof test
  const simulateGpsPing = async (type: "normal" | "spoof") => {
    // Normal is a small local step, Spoof is a massive teleport jump
    const nextLat = type === "normal" ? centerLat + 0.0002 : centerLat + 0.95;
    const nextLon = type === "normal" ? centerLon + 0.0002 : centerLon + 0.95;

    const payload = {
      latitude: nextLat,
      longitude: nextLon,
      accuracy: 8.5,
      signalQuality: "good",
      timestamp: Date.now(),
    };

    try {
      const res = await fetch("/api/geospatial/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSpoofCheckResult(data.data);
        setSpoofLogs((prev) => [
          `[Ping: ${new Date().toLocaleTimeString()}] Type: ${type.toUpperCase()} | Speed: ${data.data.speedMps?.toFixed(1) || 0} m/s | Spoofed: ${data.data.isSpoofed ? "❌ YES" : "✅ NO"}`,
          ...prev,
        ]);
        if (!data.data.isSpoofed) {
          setCenterLat(nextLat);
          setCenterLon(nextLon);
        }
      }
    } catch {
      // simulated check
      const speed = type === "normal" ? 1.5 : 350.0;
      const isSpoofed = type === "spoof";
      setSpoofCheckResult({ isSpoofed, speedMps: speed, reason: isSpoofed ? "Velocity exceeds limits (>50 m/s)" : undefined });
      setSpoofLogs((prev) => [
        `[Ping: ${new Date().toLocaleTimeString()}] Type: ${type.toUpperCase()} | Speed: ${speed} m/s | Spoofed: ${isSpoofed ? "❌ YES" : "✅ NO"}`,
        ...prev,
      ]);
      if (!isSpoofed) {
        setCenterLat(nextLat);
        setCenterLon(nextLon);
      }
    }
  };

  // Setup markers colored by role
  const mapMarkers: MapMarker[] = [
    { latitude: centerLat, longitude: centerLon, label: "Current Center Location", color: "#c5a880" },
    { latitude: destinationLat, longitude: destinationLon, label: "Route Destination", color: "#f59e0b" },
  ];

  savedPresets.forEach((p) => {
    mapMarkers.push({
      latitude: p.latitude,
      longitude: p.longitude,
      label: `Preset: ${p.label}`,
      color: "#10b981", // Green preset markers
    });
  });

  return (
    <ProductShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Configuration Panels */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Geocoding & Addresses */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg gold-gradient-text">Address Geocoding</CardTitle>
              <CardDescription>
                Search coordinates, translate formats, and normalize Indian administrative levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-end gap-2">
                <Input
                  label="Search Address"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  placeholder="Enter street, village, pincode..."
                  id="search-address-input"
                />
                <Button
                  variant="primary"
                  onClick={handleGeocode}
                  isLoading={geocodeLoading}
                  className="whitespace-nowrap"
                >
                  Search
                </Button>
              </div>

              {geocodeError && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg border border-destructive/20">
                  {geocodeError}
                </div>
              )}

              {normalizedAddress && (
                <div className="flex flex-col gap-2 text-xs bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono font-bold text-foreground">
                      {normalizedAddress.latitude.toFixed(5)}, {normalizedAddress.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">GeoHash:</span>
                    <span className="font-mono text-primary">{normalizedAddress.geohash}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">Plus Code:</span>
                    <span className="font-mono text-foreground">{normalizedAddress.plusCode}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">Mandal/Taluk:</span>
                    <span className="text-foreground">{normalizedAddress.mandalTaluk || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">District:</span>
                    <span className="text-foreground">{normalizedAddress.district}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">Pincode:</span>
                    <span className="font-mono text-foreground">{normalizedAddress.pincode}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="text-foreground">{normalizedAddress.country}</span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border mt-1">
                    <Input
                      label="Bookmark Preset Label"
                      value={newPresetLabel}
                      onChange={(e) => setNewPresetLabel(e.target.value)}
                      placeholder="e.g. My Farm"
                      id="bookmark-label-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSavePreset}
                      className="self-end whitespace-nowrap"
                    >
                      Save Preset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Routing Options */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg gold-gradient-text">Routing & ETA Engine</CardTitle>
              <CardDescription>
                Calculate short vs fast paths, dynamic congestion ETAs, and maneuvers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1 text-muted-foreground">Latitude</label>
                  <input
                    type="number"
                    value={destinationLat}
                    onChange={(e) => setDestinationLat(parseFloat(e.target.value))}
                    step="0.001"
                    className="w-full bg-muted border border-border text-foreground px-3 py-1.5 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1 text-muted-foreground">Longitude</label>
                  <input
                    type="number"
                    value={destinationLon}
                    onChange={(e) => setDestinationLon(parseFloat(e.target.value))}
                    step="0.001"
                    className="w-full bg-muted border border-border text-foreground px-3 py-1.5 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-muted-foreground">Criteria / Travel Mode</label>
                <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg border border-border text-xs mb-2">
                  <button
                    onClick={() => setTravelMode("driving-car")}
                    className={`py-1 rounded font-semibold transition-all ${
                      travelMode === "driving-car" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    🚗 Drive
                  </button>
                  <button
                    onClick={() => setTravelMode("foot-walking")}
                    className={`py-1 rounded font-semibold transition-all ${
                      travelMode === "foot-walking" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    🚶 Walk
                  </button>
                  <button
                    onClick={() => setTravelMode("cycling-regular")}
                    className={`py-1 rounded font-semibold transition-all ${
                      travelMode === "cycling-regular" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    🚲 Cycle
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg border border-border text-xs">
                  <button
                    onClick={() => setRouteCriteria("fastest")}
                    className={`py-1 rounded font-semibold transition-all ${
                      routeCriteria === "fastest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Fastest
                  </button>
                  <button
                    onClick={() => setRouteCriteria("shortest")}
                    className={`py-1 rounded font-semibold transition-all ${
                      routeCriteria === "shortest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Shortest
                  </button>
                  <button
                    onClick={() => setRouteCriteria("alternative")}
                    className={`py-1 rounded font-semibold transition-all ${
                      routeCriteria === "alternative" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Alternative
                  </button>
                </div>
              </div>

              <Button variant="primary" onClick={handleCalculateRoute} isLoading={routeLoading}>
                Calculate Routing Directions
              </Button>

              {routeData && (
                <div className="flex flex-col gap-2 text-xs bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-semibold text-foreground">
                      {(routeData.distanceMeters / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1">
                    <span className="text-muted-foreground">Estimated Duration:</span>
                    <span className="font-semibold text-foreground">
                      {Math.round(routeData.durationSeconds / 60)} minutes
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Traffic factor:</span>
                    <span className="font-semibold text-primary">
                      {travelMode === "driving-car" ? "1.45x peak congestion" : "1.00x constant"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center / Right Columns - Map and Simulation outputs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Map display */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Typography variant="h4" className="text-base font-bold">
                Map Viewport Visualization
              </Typography>
              <div className="flex gap-2">
                {activeFences.length > 0 && (
                  <Badge variant="success">📍 Inside Geofence Area</Badge>
                )}
                {spoofCheckResult?.isSpoofed && (
                  <Badge variant="danger">⚠️ Speed Spoof Warning</Badge>
                )}
              </div>
            </div>
            
            <MaplibreMap
              latitude={centerLat}
              longitude={centerLon}
              markers={mapMarkers}
              routeCoordinates={routeData?.coordinates || []}
              geofences={demoGeofences}
              isOffline={isSimOffline}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* GPS Spoofing Sandbox */}
            <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg gold-gradient-text">GPS Spoofing Validator</CardTitle>
                <CardDescription>
                  Evaluates coordinate velocity to prevent impossible speed location jumps.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => simulateGpsPing("normal")}>
                    Simulate Normal Step
                  </Button>
                  <Button variant="primary" className="bg-rose-500 hover:bg-rose-600 text-white border-none" size="sm" onClick={() => simulateGpsPing("spoof")}>
                    Simulate Spoof Jump
                  </Button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Typography variant="muted" className="text-xs font-semibold">
                    Anti-Spoof logs activity:
                  </Typography>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-border font-mono text-[10px] h-[110px] overflow-y-auto flex flex-col gap-1 text-muted-foreground">
                    {spoofLogs.length === 0 ? (
                      <span className="italic text-muted-foreground/55">No logs recorded yet. Run simulations.</span>
                    ) : (
                      spoofLogs.map((log, i) => (
                        <div key={i} className="border-b border-border/10 pb-0.5">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Offline and Voice directions */}
            <div className="flex flex-col gap-6">
              {/* Offline tiles state */}
              <OfflineMapIndicator
                isSimulatedOffline={isSimOffline}
                onToggleSimulate={() => setIsSimOffline(!isSimOffline)}
              />

              {/* Regional voice directions */}
              <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
                <CardContent className="pt-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <Typography variant="h4" className="text-base font-bold">
                      Regional Navigation Voice
                    </Typography>
                    <button
                      onClick={() => setIsNavMuted(!isNavMuted)}
                      className="text-xs hover:underline text-primary"
                    >
                      {isNavMuted ? "🔇 Unmute Voice" : "🔊 Muted Audio"}
                    </button>
                  </div>

                  {routeData ? (
                    <div className="flex flex-col gap-2">
                      <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Current maneuver prompt ({locale.toUpperCase()}):
                          </span>
                          <span className="text-xs font-semibold text-foreground mt-0.5">
                            {voiceNav.currentPrompt}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={voiceNav.announceCurrent}
                          className="h-8 w-8 hover:bg-muted"
                          aria-label="Speak current directions prompt"
                        >
                          🔊
                        </Button>
                      </div>

                      <div className="flex justify-between items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={voiceNav.prevStep}
                          disabled={voiceNav.isFirstStep}
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-muted-foreground font-semibold">
                          Step {voiceNav.currentStepIndex + 1} of {voiceNav.directions.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={voiceNav.nextStep}
                          disabled={voiceNav.isLastStep}
                        >
                          Next step
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs italic text-muted-foreground/70 text-center py-4 bg-muted/10 rounded-lg border border-dashed border-border">
                      Calculate directions first to activate voice navigation prompts.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

        </div>

      </div>
    </ProductShell>
  );
}
