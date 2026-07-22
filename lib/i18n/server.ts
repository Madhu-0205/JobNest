import { cookies } from "next/headers";
import { LocaleCode, TRANSLATIONS } from "./translations";

/**
 * Server-side internationalization helper for Next.js Server Components.
 * Reads 'jobnest_lang' cookie from incoming request headers and resolves translation keys.
 */
export async function getTranslations(namespace?: string) {
  let locale: LocaleCode = "en";
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("jobnest_lang")?.value as LocaleCode;
    if (langCookie && TRANSLATIONS[langCookie]) {
      locale = langCookie;
    }
  } catch {
    // Fallback to default 'en' when invoked outside request context
  }

  const dict = TRANSLATIONS[locale] || TRANSLATIONS["en"];

  const t = (key: string, params?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    let template = dict[fullKey] || dict[key];

    if (!template) {
      const parts = fullKey.split(".");
      let current: Record<string, unknown> | string | undefined = dict as unknown as Record<string, unknown>;
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
      template = key;
    }

    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        template = template.replace(new RegExp(`{\\s*${pKey}\\s*}`, "g"), String(pVal));
      });
    }

    return template;
  };

  return { t, locale };
}
