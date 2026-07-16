"use client";

import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { FeatureFlagProvider } from "@/lib/feature-flags/provider";
import { I18nProvider } from "@/lib/i18n/context";

import { LocationProvider } from "./LocationProvider";
import { MapProvider } from "./MapProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers aggregator component.
 * Integrates ThemeProvider, FeatureFlagProvider, I18nProvider, LocationProvider, and MapProvider contexts.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <FeatureFlagProvider>
        <I18nProvider>
          <LocationProvider>
            <MapProvider>
              {children}
            </MapProvider>
          </LocationProvider>
        </I18nProvider>
      </FeatureFlagProvider>
    </ThemeProvider>
  );
}
