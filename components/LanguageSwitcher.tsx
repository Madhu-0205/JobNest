"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LANGUAGE_NAMES, LocaleCode } from "@/lib/i18n/translations";
import { Globe, Check } from "lucide-react";

/**
 * Luxury Accessible Language Switcher Dropdown.
 * Uses glassmorphism styling, luxury easing transitions, and supports RTL alignment.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, dir } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (code: LocaleCode) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" dir={dir}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary/80 hover:bg-secondary border border-border rounded-lg shadow-sm backdrop-blur-md transition-all duration-300 ease-[var(--ease-luxury)] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        id="language-menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-4 h-4 text-primary" />
        <span>{LANGUAGE_NAMES[locale]}</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay to close on outside click */}
          <div
            className="fixed inset-0 z-[var(--z-overlay)]"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card/90 shadow-[var(--shadow-luxury)] backdrop-blur-lg z-[var(--z-modal)] focus:outline-none animate-fade-in origin-top-right"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu-button"
          >
            <div className="py-1 px-1" role="none">
              {(Object.keys(LANGUAGE_NAMES) as LocaleCode[]).map((code) => {
                const isActive = locale === code;
                return (
                  <button
                    key={code}
                    onClick={() => handleSelect(code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground hover:bg-secondary/60"
                    }`}
                    role="menuitem"
                  >
                    <span>{LANGUAGE_NAMES[code]}</span>
                    {isActive && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default LanguageSwitcher;
