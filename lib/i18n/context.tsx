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
    const dict = TRANSLATIONS[locale];
    if (!dict) return key;

    // Direct lookup first
    if (dict[key]) {
      return dict[key];
    }

    // Dot path lookup fallback
    const parts = key.split(".");
    let current: Record<string, unknown> | string | undefined = dict as unknown as Record<string, unknown>;
    for (const part of parts) {
      if (current && typeof current === "object" && (current as Record<string, unknown>)[part] !== undefined) {
        current = (current as Record<string, unknown>)[part] as Record<string, unknown> | string;
      } else {
        return key;
      }
    }

    return typeof current === "string" ? current : key;
  };

  const dir = (locale as string) === "ar" || (locale as string) === "he" || (locale as string) === "fa" ? "rtl" : "ltr";

  // Reactive DOM-Translation Engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    const dict = TRANSLATIONS[locale];
    if (!dict) return;

    const translateNode = (node: Text) => {
      const text = node.textContent?.trim();
      if (!text || text.length < 2) return;

      const parent = node.parentElement;
      if (!parent) return;

      // Skip elements that should not be localized
      if (
        parent.tagName === "SCRIPT" ||
        parent.tagName === "STYLE" ||
        parent.tagName === "CODE" ||
        parent.tagName === "TEXTAREA" ||
        parent.closest(".mapboxgl-map") ||
        parent.closest(".leaflet-container")
      ) {
        return;
      }

      let orig = parent.getAttribute("data-i18n-orig");
      if (!orig) {
        orig = text;
        parent.setAttribute("data-i18n-orig", orig);
      }

      if (locale === "en") {
        if (node.textContent !== orig) {
          node.textContent = orig;
        }
      } else {
        const translation = dict[orig];
        if (translation && node.textContent !== translation) {
          node.textContent = translation;
        }
      }
    };

    const translateInputPlaceholders = (root: ParentNode) => {
      const inputs = root.querySelectorAll("input, textarea");
      inputs.forEach((inputEl) => {
        const input = inputEl as HTMLInputElement | HTMLTextAreaElement;
        const placeholder = input.placeholder;
        if (!placeholder) return;

        let orig = input.getAttribute("data-i18n-orig-placeholder");
        if (!orig) {
          orig = placeholder;
          input.setAttribute("data-i18n-orig-placeholder", orig);
        }

        if (locale === "en") {
          input.placeholder = orig;
        } else {
          const translation = dict[orig];
          if (translation) {
            input.placeholder = translation;
          }
        }
      });
    };

    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateNode(root as Text);
      } else if (root.nodeType === Node.ELEMENT_NODE) {
        const el = root as HTMLElement;
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
        el.childNodes.forEach(translateTree);
      }
    };

    translateTree(document.body);
    translateInputPlaceholders(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          translateTree(node);
          if (node.nodeType === Node.ELEMENT_NODE) {
            translateInputPlaceholders(node as HTMLElement);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale]);

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
