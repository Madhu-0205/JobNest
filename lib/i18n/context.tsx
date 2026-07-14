"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LocaleCode, TRANSLATIONS } from "./translations";

interface I18nContextType {
  locale: LocaleCode;
  t: (key: string) => string;
  setLocale: (locale: LocaleCode) => void;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * i18n Internationalization Provider.
 * Manages locale selection, RTL alignment, and dictionary resolution.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>("en");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_locale") as LocaleCode;
    if (saved && TRANSLATIONS[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (newLocale: LocaleCode) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferred_locale", newLocale);
    
    // Set document lang attribute for screen readers and search crawlers
    document.documentElement.lang = newLocale;
    
    // Configure text layout direction (RTL readiness support)
    const isRtl = (newLocale as string) === "ar" || (newLocale as string) === "he" || (newLocale as string) === "fa";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  };

  const t = (key: string): string => {
    const parts = key.split(".");
    let current: Record<string, unknown> | string | undefined = TRANSLATIONS[locale] as unknown as Record<string, unknown>;

    for (const part of parts) {
      if (current && typeof current === "object" && current[part] !== undefined) {
        current = current[part] as Record<string, unknown> | string;
      } else {
        return key;
      }
    }

    return typeof current === "string" ? current : key;
  };

  const dir = (locale as string) === "ar" || (locale as string) === "he" || (locale as string) === "fa" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
