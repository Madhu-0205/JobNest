"use client";

import React, { createContext, useContext, useState } from "react";
import { FeatureFlags, FeatureFlagKey } from "./types";
import { defaultFeatureFlags } from "./config";

interface FeatureFlagContextType {
  flags: FeatureFlags;
  isEnabled: (key: FeatureFlagKey) => boolean;
  setRuntimeFlag: (key: FeatureFlagKey, value: boolean) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  initialFlags?: FeatureFlags;
}

/**
 * Enterprise Client Feature Flag Provider.
 * Allows client components to query and toggle (for runtime debugging) feature availabilities.
 */
export function FeatureFlagProvider({ children, initialFlags = defaultFeatureFlags }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(initialFlags);

  const isEnabled = (key: FeatureFlagKey): boolean => {
    return !!flags[key];
  };

  const setRuntimeFlag = (key: FeatureFlagKey, value: boolean): void => {
    setFlags((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, setRuntimeFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to retrieve client-side feature flags.
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider");
  }
  return context;
}
