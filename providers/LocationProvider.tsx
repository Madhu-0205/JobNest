"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/services/logger";
import { calculateDistance } from "@/utils/geospatial";

export type LocationPermissionStatus = "prompt" | "granted" | "denied" | "loading";
export type LocationSource = "gps" | "manual" | "cached";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AddressDetails {
  country: string;
  state: string;
  district: string;
  city: string;
  municipality: string;
  village: string;
  postalCode: string;
  street: string;
  neighbourhood: string;
  landmark: string;
}

export interface LocationContextType {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permissionStatus: LocationPermissionStatus;
  isSpoofed: boolean;
  isOffline: boolean;
  isApproximate: boolean;
  errorMessage: string | null;
  locationSource: LocationSource;
  address: AddressDetails | null;
  reverseGeocodingStatus: "idle" | "loading" | "success" | "error";
  requestPermission: () => Promise<boolean>;
  updateLocation: (lat: number, lng: number, source: LocationSource) => void;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>("loading");
  const [isSpoofed, setIsSpoofed] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isApproximate, setIsApproximate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>("cached");
  
  const [address, setAddress] = useState<AddressDetails | null>(null);
  const [reverseGeocodingStatus, setReverseGeocodingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const lastSyncRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const lastGeocodeRef = useRef<{ lat: number; lng: number } | null>(null);
  const latitudeRef = useRef<number | null>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        // Only load cached if GPS is not yet acquired or denied
        if (latitudeRef.current === null) {
          setLatitude(parsed.lat);
          latitudeRef.current = parsed.lat;
          setLongitude(parsed.lng);
          setAccuracy(parsed.accuracy);
          setLocationSource(parsed.source || "cached");
          setIsApproximate(true); // Cached is always approximate
          if (parsed.address) setAddress(parsed.address);
          logger.info(`[LocationProvider] Loaded cached offline location: ${parsed.lat}, ${parsed.lng}`);
        }
      }
    } catch (err) {
      logger.warn("[LocationProvider] Failed to load cached offline location", err as Record<string, unknown>);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerReverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    
    // Throttle geocoding to not hit API too often. Wait for 2s of stationary time.
    geocodeTimeoutRef.current = setTimeout(async () => {
      if (lastGeocodeRef.current) {
        const dist = calculateDistance(
          { latitude: lat, longitude: lng },
          { latitude: lastGeocodeRef.current.lat, longitude: lastGeocodeRef.current.lng }
        );
        // If moved less than 100m, don't re-geocode
        if (dist < 100) return;
      }

      try {
        setReverseGeocodingStatus("loading");
        const res = await fetch(`/api/geospatial/reverse?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setAddress(data.data);
          setReverseGeocodingStatus("success");
          lastGeocodeRef.current = { lat, lng };
          
          // Update local storage with address
          const cached = localStorage.getItem("jobnest_cached_location");
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.address = data.data;
            localStorage.setItem("jobnest_cached_location", JSON.stringify(parsed));
          }
        } else {
          setReverseGeocodingStatus("error");
        }
      } catch (err) {
        logger.error("[LocationProvider] Reverse Geocoding fetch failed", err as Record<string, unknown>);
        setReverseGeocodingStatus("error");
      }
    }, 2000);
  }, []);

  const syncToDatabase = useCallback(async (lat: number, lng: number, acc: number) => {
    const now = Date.now();
    if (lastSyncRef.current) {
      const dist = calculateDistance(
        { latitude: lat, longitude: lng },
        { latitude: lastSyncRef.current.lat, longitude: lastSyncRef.current.lng }
      );
      const timeElapsed = now - lastSyncRef.current.timestamp;
      
      // Throttle DB sync: >50m movement OR >60s elapsed
      if (dist < 50 && timeElapsed < 60000) {
        return;
      }
    }

    lastSyncRef.current = { lat, lng, timestamp: now };
    
    try {
      fetch("/api/geospatial/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng, accuracy: acc })
      }).catch(() => {});
    } catch {
      // Ignore background sync errors
    }
  }, []);

  const updateLocationState = useCallback((lat: number, lng: number, acc: number | null, src: LocationSource) => {
    setLatitude(lat);
    latitudeRef.current = lat;
    setLongitude(lng);
    setAccuracy(acc);
    setLocationSource(src);
    setErrorMessage(null);
    setIsApproximate(src !== "gps");

    // Cache to localStorage for offline preservation
    try {
      const currentCache = localStorage.getItem("jobnest_cached_location");
      const existingAddress = currentCache ? JSON.parse(currentCache).address : null;
      localStorage.setItem(
        "jobnest_cached_location",
        JSON.stringify({ lat, lng, accuracy: acc, source: src, timestamp: Date.now(), address: existingAddress })
      );
    } catch (err) {
      logger.warn("[LocationProvider] Cache write error", err as Record<string, unknown>);
    }

    triggerReverseGeocode(lat, lng);
    syncToDatabase(lat, lng, acc || 0);
  }, [triggerReverseGeocode, syncToDatabase]);

  // Spoofing detection client-side: simple speed check between updates
  const detectSpoofing = useCallback((lat: number, lng: number, acc: number, timestamp: number): boolean => {
    if (acc > 150) {
      return false; // Just bad signal
    }

    const prev = lastLocationRef.current;
    if (!prev) {
      lastLocationRef.current = { lat, lng, timestamp };
      return false;
    }

    const distanceMeters = calculateDistance({ latitude: lat, longitude: lng }, { latitude: prev.lat, longitude: prev.lng });
    const timeSeconds = (timestamp - prev.timestamp) / 1000;

    if (timeSeconds > 0.5) {
      const speedMps = distanceMeters / timeSeconds;
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

    // STRICT LIVE GPS ENFORCEMENT
    const options: PositionOptions = {
      enableHighAccuracy: true, // MUST be true per requirements
      timeout: 10000,
      maximumAge: 0, // MUST be 0 per requirements
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
          setIsApproximate(true); // Remains approximate if using cached
        } else {
          setErrorMessage(`GPS connection failure: ${error.message}`);
        }
      },
      options
    );
  }, [detectSpoofing, updateLocationState]);

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
          setIsApproximate(true); // Fallback to cached leaves isApproximate true
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }, [startTracking, updateLocationState]);

  const updateLocation = useCallback((lat: number, lng: number, source: LocationSource) => {
    updateLocationState(lat, lng, 10, source);
  }, [updateLocationState]);

  const refreshLocation = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  // Track on mount if permission status was previously granted
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions) {
      setPermissionStatus("prompt");
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        setPermissionStatus(result.state as LocationPermissionStatus);
        if (result.state === "granted") {
          startTracking();
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
            setIsApproximate(true); // Marked approximate on revoke
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
  }, [startTracking]);

  return (
    <LocationContext.Provider
      value={{
        latitude,
        longitude,
        accuracy,
        permissionStatus,
        isSpoofed,
        isOffline,
        isApproximate,
        errorMessage,
        locationSource,
        address,
        reverseGeocodingStatus,
        requestPermission,
        updateLocation,
        refreshLocation,
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
