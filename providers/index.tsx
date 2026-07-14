"use client";

import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { FeatureFlagProvider } from "@/lib/feature-flags/provider";
import { I18nProvider } from "@/lib/i18n/context";

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers aggregator component.
 * Integrates ThemeProvider, FeatureFlagProvider, and I18nProvider contexts.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <FeatureFlagProvider>
        <I18nProvider>
          {children}
        </I18nProvider>
      </FeatureFlagProvider>
    </ThemeProvider>
  );
}
