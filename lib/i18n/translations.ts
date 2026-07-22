import enDict from "../../locales/en.json";
import hiDict from "../../locales/hi.json";
import teDict from "../../locales/te.json";
import taDict from "../../locales/ta.json";

export type LocaleCode =
  | "en"
  | "hi"
  | "te"
  | "ta";

export const TRANSLATIONS: Record<LocaleCode, Record<string, string>> = {
  en: enDict as Record<string, string>,
  hi: hiDict as Record<string, string>,
  te: teDict as Record<string, string>,
  ta: taDict as Record<string, string>,
};

export const LANGUAGE_NAMES: Record<LocaleCode, string> = {
  en: "🇬🇧 English",
  hi: "🇮🇳 हिन्दी",
  te: "🇮🇳 తెలుగు",
  ta: "🇮🇳 தமிழ்",
};
