import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "es", "de", "it", "pt"],
  defaultLocale: "en",
});

/** Native label per locale, for the language Select. */
export const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};
