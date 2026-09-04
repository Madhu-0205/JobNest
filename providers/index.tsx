"use client";

import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { FeatureFlagProvider } from "@/lib/feature-flags/provider";
import { I18nProvider } from "@/lib/i18n/context";
import { LocationProvider } from "./LocationProvider";
import { MapProvider } from "./MapProvider";
import { AuthProvider } from "./AuthProvider";
import { PostHogProvider } from "@/lib/analytics/posthog-client";
import { ModeProvider, AppMode } from "@/features/mode/ModeProvider";
import { ToastProvider } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/ToastContainer";

interface AppProvidersProps {
  children: React.ReactNode;
  initialMode?: AppMode;
}

/**
 * Root providers aggregator component.
 * Integrates AuthProvider, ThemeProvider, FeatureFlagProvider, I18nProvider, LocationProvider, MapProvider, and ToastProvider.
 */
export function AppProviders({ children, initialMode }: AppProvidersProps) {
  return (
    <PostHogProvider>
      <ModeProvider initialMode={initialMode}>
        <AuthProvider>
          <ThemeProvider>
            <FeatureFlagProvider>
              <I18nProvider>
                <LocationProvider>
                  <MapProvider>
                    <ToastProvider>
                      {children}
                      <ToastContainer />
                    </ToastProvider>
                  </MapProvider>
                </LocationProvider>
              </I18nProvider>
            </FeatureFlagProvider>
          </ThemeProvider>
        </AuthProvider>
      </ModeProvider>
    </PostHogProvider>
  );
}
