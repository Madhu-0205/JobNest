"use client";

import { useState, useEffect, useRef } from "react";

export interface GeolocationState {
  loading: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isAccuracyLow: boolean;
}

export interface GeolocationControls extends GeolocationState {
  simulatePath: (path: { latitude: number; longitude: number }[]) => void;
  stopSimulation: () => void;
  isSimulating: boolean;
}

/**
 * Custom React Hook: Browser Geolocation tracker.
 * - Safely integrates with window.navigator.geolocation
 * - Filters low-accuracy coordinates (>50 meters error)
 * - Simulates coordinate tracks traversal for QA anti-spoof checks
 */
export function useGeolocation(watch = false): GeolocationControls {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isAccuracyLow: false,
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const simulatePath = (path: { latitude: number; longitude: number }[]) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsSimulating(true);
    setState((prev) => ({ ...prev, loading: false }));

    let index = 0;
    const runStep = () => {
      if (index >= path.length) {
        setIsSimulating(false);
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        return;
      }
      const coords = path[index];
      setState({
        loading: false,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: 10.0, // perfect simulated GPS
        error: null,
        isAccuracyLow: false,
      });
      index++;
    };

    runStep();
    simIntervalRef.current = setInterval(runStep, 3000); // 3-second ticks
  };

  const stopSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  useEffect(() => {
    if (isSimulating) return;

    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by this device.",
      }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const accuracy = position.coords.accuracy;
      const isAccuracyLow = accuracy > 50.0;

      setState({
        loading: false,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy,
        error: null,
        isAccuracyLow,
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
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [watch, isSimulating]);

  return {
    ...state,
    simulatePath,
    stopSimulation,
    isSimulating,
  };
}

export default useGeolocation;
