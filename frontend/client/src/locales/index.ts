/* KisanSetu i18n — barrel export */
import en from "./en";
import hi from "./hi";
import bn from "./bn";
export type { LocaleKeys } from "./en";

export type LangCode = "en" | "hi" | "bn";

export const LANGUAGES: { code: LangCode; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English",  nativeLabel: "English" },
  { code: "hi", label: "Hindi",    nativeLabel: "हिन्दी" },
  { code: "bn", label: "Bengali",  nativeLabel: "বাংলা" },
];

export const locales: Record<LangCode, typeof en> = { en, hi, bn };

export default locales;
