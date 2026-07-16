"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/services/logger";

export type LocationPermissionStatus = "prompt" | "granted" | "denied" | "loading";
export type LocationSource = "gps" | "ip" | "manual" | "preset";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationContextType {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permissionStatus: LocationPermissionStatus;
  isSpoofed: boolean;
  isOffline: boolean;
  batteryOptimized: boolean;
  errorMessage: string | null;
  locationSource: LocationSource;
  requestPermission: () => Promise<boolean>;
  updateLocation: (lat: number, lng: number, source: LocationSource) => void;
  refreshLocation: () => Promise<void>;
  toggleBatteryOptimization: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const DEFAULT_COORDS: LatLng = { lat: 12.9716, lng: 77.5946 }; // Bangalore Center

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>("loading");
  const [isSpoofed, setIsSpoofed] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [batteryOptimized, setBatteryOptimized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>("preset");

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  // Sync offline status
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Retrieve offline cached coordinates if available
    try {
      const cached = localStorage.getItem("jobnest_cached_location");
      if (cached) {
        const parsed = JSON.parse(cached);
        setLatitude(parsed.lat);
        setLongitude(parsed.lng);
        setAccuracy(parsed.accuracy);
        setLocationSource(parsed.source || "preset");
        logger.info(`[LocationProvider] Loaded cached offline location: ${parsed.lat}, ${parsed.lng}`);
      }
    } catch (err) {
      logger.warn("[LocationProvider] Failed to load cached offline location", err as Record<string, unknown>);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateLocationState = useCallback((lat: number, lng: number, acc: number | null, src: LocationSource) => {
    setLatitude(lat);
    setLongitude(lng);
    setAccuracy(acc);
    setLocationSource(src);
    setErrorMessage(null);

    // Cache to localStorage for offline preservation
    try {
      localStorage.setItem(
        "jobnest_cached_location",
        JSON.stringify({ lat, lng, accuracy: acc, source: src, timestamp: Date.now() })
      );
    } catch (err) {
      logger.warn("[LocationProvider] Cache write error", err as Record<string, unknown>);
    }
  }, []);

  // Spoofing detection client-side: simple speed check between updates
  const detectSpoofing = useCallback((lat: number, lng: number, acc: number, timestamp: number): boolean => {
    if (acc > 150) {
      logger.warn(`[LocationProvider] High GPS inaccuracy: ${acc}m. Potentially poor signal.`);
      return false;
    }

    const prev = lastLocationRef.current;
    if (!prev) {
      lastLocationRef.current = { lat, lng, timestamp };
      return false;
    }

    // Distance calculation
    const R = 6371e3; // Earth radius in meters
    const phi1 = (prev.lat * Math.PI) / 180;
    const phi2 = (lat * Math.PI) / 180;
    const deltaPhi = ((lat - prev.lat) * Math.PI) / 180;
    const deltaLambda = ((lng - prev.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = R * c;

    const timeSeconds = (timestamp - prev.timestamp) / 1000;

    if (timeSeconds > 0.5) {
      const speedMps = distanceMeters / timeSeconds;
      // If speed exceeds 150 m/s (~540 km/h) on a local marketplace context, flag as spoofed jump
      if (speedMps > 150) {
        logger.error(`[LocationProvider] Speed anomaly detected: ${speedMps.toFixed(2)} m/s. Location update flagged.`);
        return true;
      }
    }

    lastLocationRef.current = { lat, lng, timestamp };
    return false;
  }, []);

  const startTracking = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      setPermissionStatus("denied");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options: PositionOptions = {
      enableHighAccuracy: !batteryOptimized,
      timeout: 10000,
      maximumAge: batteryOptimized ? 30000 : 5000,
    };

    watchIdRef.current = window.navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        const timestamp = position.timestamp;

        setPermissionStatus("granted");

        const spoofed = detectSpoofing(lat, lng, acc, timestamp);
        if (spoofed) {
          setIsSpoofed(true);
          setErrorMessage("GPS Security Verification Failed: Telemetry Spoofing Detected.");
        } else {
          setIsSpoofed(false);
          updateLocationState(lat, lng, acc, "gps");
        }
      },
      (error) => {
        logger.warn(`[LocationProvider] Geolocation watch error: ${error.message}`);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus("denied");
          setErrorMessage("Location permission was denied.");
          // Fall back to Bangalore default if no cached location is present
          if (latitude === null) {
            updateLocationState(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, null, "preset");
          }
        } else {
          setErrorMessage(`GPS connection failure: ${error.message}`);
        }
      },
      options
    );
  }, [batteryOptimized, detectSpoofing, updateLocationState, latitude]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setPermissionStatus("loading");
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        setPermissionStatus("denied");
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissionStatus("granted");
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = position.coords.accuracy;
          updateLocationState(lat, lng, acc, "gps");
          startTracking();
          resolve(true);
        },
        (error) => {
          logger.warn(`[LocationProvider] Geolocation request denied or failed: ${error.message}`);
          setPermissionStatus("denied");
          if (latitude === null) {
            updateLocationState(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, null, "preset");
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }, [startTracking, updateLocationState, latitude]);

  const updateLocation = useCallback((lat: number, lng: number, source: LocationSource) => {
    updateLocationState(lat, lng, 10, source);
  }, [updateLocationState]);

  const refreshLocation = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  const toggleBatteryOptimization = useCallback(() => {
    setBatteryOptimized((prev) => !prev);
  }, []);

  // Track on mount if permission status was previously granted
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions) {
      // Fallback request
      setPermissionStatus("prompt");
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        setPermissionStatus(result.state as LocationPermissionStatus);
        if (result.state === "granted") {
          startTracking();
        } else if (result.state === "prompt" && latitude === null) {
          // Default center preset initially
          updateLocationState(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, null, "preset");
        }

        result.onchange = () => {
          setPermissionStatus(result.state as LocationPermissionStatus);
          if (result.state === "granted") {
            startTracking();
          } else {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
          }
        };
      })
      .catch(() => {
        setPermissionStatus("prompt");
      });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startTracking, updateLocationState, latitude]);

  return (
    <LocationContext.Provider
      value={{
        latitude,
        longitude,
        accuracy,
        permissionStatus,
        isSpoofed,
        isOffline,
        batteryOptimized,
        errorMessage,
        locationSource,
        requestPermission,
        updateLocation,
        refreshLocation,
        toggleBatteryOptimization,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useCurrentLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useCurrentLocation must be used within a LocationProvider");
  }
  return context;
}
