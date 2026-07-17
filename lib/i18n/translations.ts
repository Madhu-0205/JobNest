import enDict from "../../locales/en.json";
import hiDict from "../../locales/hi.json";
import teDict from "../../locales/te.json";
import taDict from "../../locales/ta.json";
import knDict from "../../locales/kn.json";
import mlDict from "../../locales/ml.json";
import mrDict from "../../locales/mr.json";
import guDict from "../../locales/gu.json";
import bnDict from "../../locales/bn.json";
import paDict from "../../locales/pa.json";
import orDict from "../../locales/or.json";

export type LocaleCode =
  | "en"
  | "hi"
  | "te"
  | "ta"
  | "kn"
  | "ml"
  | "mr"
  | "gu"
  | "bn"
  | "pa"
  | "or";

export const TRANSLATIONS: Record<LocaleCode, Record<string, string>> = {
  en: enDict as Record<string, string>,
  hi: hiDict as Record<string, string>,
  te: teDict as Record<string, string>,
  ta: taDict as Record<string, string>,
  kn: knDict as Record<string, string>,
  ml: mlDict as Record<string, string>,
  mr: mrDict as Record<string, string>,
  gu: guDict as Record<string, string>,
  bn: bnDict as Record<string, string>,
  pa: paDict as Record<string, string>,
  or: orDict as Record<string, string>,
};

export const LANGUAGE_NAMES: Record<LocaleCode, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  te: "తెలుగు (Telugu)",
  ta: "தமிழ் (Tamil)",
  kn: "ಕನ್ನಡ (Kannada)",
  ml: "മലയാളം (Malayalam)",
  mr: "मराठी (Marathi)",
  gu: "ગુજરાતી (Gujarati)",
  bn: "বাংলা (Bengali)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
  or: "ଓଡ଼ିଆ (Odia)",
};
