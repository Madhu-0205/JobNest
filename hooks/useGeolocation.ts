"use client";

import { useState, useEffect } from "react";

export interface GeolocationState {
  loading: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
}

/**
 * Custom React Hook: browser Geolocation tracker.
 * - Safely integrates with window.navigator.geolocation
 * - Supports one-shot current position fetching or real-time continuous watching
 * - Emits signals accuracy and validation errors
 */
export function useGeolocation(watch = false): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by this device.",
      }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    let watchId: number;

    if (watch) {
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    }

    return () => {
      if (watch && watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch]);

  return state;
}
export default useGeolocation;
