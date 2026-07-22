"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LocaleCode, TRANSLATIONS } from "./translations";

interface I18nContextType {
  locale: LocaleCode;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: LocaleCode) => void;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatDate: (date: Date | string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Enterprise Internationalization Provider.
 * Provides high-performance component translation, currency/date/number formatting,
 * and seamless server/client locale persistence via cookies and localStorage.
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

  const setLocale = useCallback((newLocale: LocaleCode) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferred_locale", newLocale);
    document.cookie = `jobnest_lang=${newLocale}; path=/; SameSite=Lax`;
    
    document.documentElement.lang = newLocale;
    const isRtl = newLocale === ("ar" as string) || newLocale === ("he" as string) || newLocale === ("fa" as string);
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[locale];
    let template = dict?.[key];

    if (!template) {
      // Dot path lookup fallback for namespaced keys
      const parts = key.split(".");
      let current: Record<string, unknown> | string | undefined = (dict || {}) as unknown as Record<string, unknown>;
      for (const part of parts) {
        if (current && typeof current === "object" && (current as Record<string, unknown>)[part] !== undefined) {
          current = (current as Record<string, unknown>)[part] as Record<string, unknown> | string;
        } else {
          break;
        }
      }
      if (typeof current === "string") {
        template = current;
      }
    }

    if (!template) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing translation key: "${key}" for locale: "${locale}"`);
        template = TRANSLATIONS["en"][key] || key; // English fallback in dev
      } else {
        template = key; // Raw key in production
      }
    }

    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        template = template.replace(new RegExp(`{\\s*${pKey}\\s*}`, "g"), String(pVal));
      });
    }

    return template;
  }, [locale]);

  const formatCurrency = useCallback((amount: number): string => {
    try {
      return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `₹${amount.toLocaleString()}`;
    }
  }, [locale]);

  const formatNumber = useCallback((num: number): string => {
    try {
      return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(num);
    } catch {
      return num.toLocaleString();
    }
  }, [locale]);

  const formatDate = useCallback((date: Date | string): string => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
        dateStyle: "medium",
      }).format(d);
    } catch {
      return String(date);
    }
  }, [locale]);

  const dir = locale === ("ar" as string) || locale === ("he" as string) || locale === ("fa" as string) ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, formatCurrency, formatNumber, formatDate, dir }}>
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
