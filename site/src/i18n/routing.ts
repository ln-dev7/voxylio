import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh-CN", "zh-TW", "ja", "ko", "fr", "de", "es", "it", "pt-BR"],
  defaultLocale: "en",
});

/** Native label per locale, for the language Select. */
export const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  "pt-BR": "Português (BR)",
};
