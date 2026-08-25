// Extension UI translations (popup, hub page, floating bar) — the same
// ten locales as the website. chrome.i18n cannot switch language at
// runtime, so the packs are bundled and resolved here: explicit user
// choice first (settings.uiLang), then the browser language, then
// English. Keys missing from a pack fall back to English.
import { UI_LANGS } from "@voxylio/core";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import es from "./messages/es.json";
import de from "./messages/de.json";
import it from "./messages/it.json";
import ja from "./messages/ja.json";
import ko from "./messages/ko.json";
import zhCN from "./messages/zh-CN.json";
import zhTW from "./messages/zh-TW.json";
import ptBR from "./messages/pt-BR.json";

const PACKS = {
  en,
  fr,
  es,
  de,
  it,
  ja,
  ko,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "pt-BR": ptBR,
};

export { UI_LANGS };

/** Resolves the UI language: user preference > browser language > en. */
export function resolveUiLang(pref, navLang) {
  if (pref && pref !== "auto" && PACKS[pref]) return pref;
  const raw = String(navLang || "en");
  if (PACKS[raw]) return raw;
  const low = raw.toLowerCase();
  const base = low.split("-")[0];
  if (base === "zh") {
    return /tw|hk|mo|hant/.test(low) ? "zh-TW" : "zh-CN";
  }
  if (base === "pt") return "pt-BR";
  const hit = Object.keys(PACKS).find((k) => k.toLowerCase().split("-")[0] === base);
  return hit || "en";
}

/**
 * Translator for a resolved language. Substitutions replace chrome-style
 * `$NAME$` tokens in order of appearance.
 */
export function makeT(lang) {
  const pack = PACKS[lang] || PACKS.en;
  return (key, subs) => {
    let msg = pack[key] ?? PACKS.en[key] ?? "";
    if (msg && subs && subs.length) {
      let i = 0;
      msg = msg.replace(/\$[A-Z_]+\$/g, () =>
        i < subs.length ? String(subs[i++]) : "",
      );
    }
    return msg;
  };
}

/** Native name of each UI language for the settings selector. */
export const UI_LANG_LABELS = {
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
