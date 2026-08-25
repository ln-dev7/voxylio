// Settings schema shared by popup, options page and content script.
// Values live in chrome.storage.sync (small, mergeable); provider API
// keys NEVER live here — they stay in storage.local (see options.js).

import { LANGUAGE_CODES } from "./languages.js";

export const SETTINGS_VERSION = 3;

export const TARGET_LANGS = LANGUAGE_CODES;
export const SOURCE_LANGS = ["auto", ...LANGUAGE_CODES];
export const PROVIDERS = ["auto", "deepl", "googlev2"];
// Extension UI languages (mirrors the website's locales).
export const UI_LANGS = [
  "auto", "en", "zh-CN", "zh-TW", "ja", "ko", "fr", "de", "es", "it", "pt-BR",
];

export const DEFAULTS = Object.freeze({
  v: SETTINGS_VERSION,
  enabled: false,
  rate: 1.1,
  duck: 12,
  // Synthesized voice volume (0–100) and on-screen caption size (px).
  voiceVolume: 100,
  captionSize: 19,
  voiceName: "",
  // Preferred voice per target language ({ fr: "Amélie", … }); falls
  // back to voiceName, then to the automatic scoring.
  voiceByLang: {},
  sourceLang: "auto",
  targetLang: "fr",
  subtitles: false,
  overlay: true,
  cloudFallback: true,
  autoPause: false,
  keepTerms: true,
  // Preferred paid provider when a key is configured ("auto" = none:
  // builtin then best-effort fallback).
  provider: "auto",
  // Extension UI language ("auto" = follow the browser, English fallback).
  uiLang: "auto",
  // Hostnames where Voxylio must stay completely inactive.
  disabledSites: [],
});

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Normalizes a hostname-ish string; returns "" when unusable. */
export function normalizeHost(input) {
  let s = String(input || "").trim().toLowerCase();
  if (!s) return "";
  try {
    if (s.includes("/") || s.includes(":")) s = new URL(s.includes("://") ? s : "https://" + s).hostname;
  } catch {
    /* keep as-is */
  }
  s = s.replace(/^www\./, "");
  return /^[a-z0-9.-]+$/.test(s) ? s : "";
}

/**
 * Sanitizes a partial settings patch: unknown keys are dropped, known
 * keys are coerced/clamped to valid values. Never throws.
 */
export function validateSettings(patch) {
  const out = {};
  if (!patch || typeof patch !== "object") return out;
  for (const [k, v] of Object.entries(patch)) {
    switch (k) {
      case "v":
        out.v = Number(v) || SETTINGS_VERSION;
        break;
      case "enabled":
      case "subtitles":
      case "overlay":
      case "cloudFallback":
      case "autoPause":
      case "keepTerms":
        out[k] = Boolean(v);
        break;
      case "rate":
        out.rate = clamp(Number(v) || DEFAULTS.rate, 0.8, 1.6);
        break;
      case "duck":
        out.duck = clamp(Math.round(Number(v) || 0), 0, 60);
        break;
      case "voiceVolume": {
        const n = Number(v);
        out.voiceVolume = clamp(
          Number.isFinite(n) ? Math.round(n) : DEFAULTS.voiceVolume,
          0,
          100,
        );
        break;
      }
      case "captionSize":
        out.captionSize = clamp(Math.round(Number(v) || DEFAULTS.captionSize), 14, 34);
        break;
      case "voiceName":
        out.voiceName = typeof v === "string" ? v.slice(0, 200) : "";
        break;
      case "voiceByLang": {
        const map = {};
        if (v && typeof v === "object" && !Array.isArray(v)) {
          for (const [lang, name] of Object.entries(v)) {
            if (TARGET_LANGS.includes(lang) && typeof name === "string" && name)
              map[lang] = name.slice(0, 200);
          }
        }
        out.voiceByLang = map;
        break;
      }
      case "sourceLang":
        out.sourceLang = SOURCE_LANGS.includes(v) ? v : DEFAULTS.sourceLang;
        break;
      case "targetLang":
        out.targetLang = TARGET_LANGS.includes(v) ? v : DEFAULTS.targetLang;
        break;
      case "provider":
        out.provider = PROVIDERS.includes(v) ? v : "auto";
        break;
      case "uiLang":
        out.uiLang = UI_LANGS.includes(v) ? v : "auto";
        break;
      case "disabledSites": {
        const list = Array.isArray(v) ? v : [];
        out.disabledSites = [...new Set(list.map(normalizeHost).filter(Boolean))].slice(0, 200);
        break;
      }
      default:
        break; // unknown key: dropped
    }
  }
  return out;
}

/**
 * Migrates raw stored settings (any version, possibly partial) to the
 * current schema. Returns { settings, changed } — `changed` true when a
 * write-back is warranted.
 */
export function migrateSettings(raw) {
  const base = { ...DEFAULTS };
  const clean = validateSettings(raw);
  const settings = { ...base, ...clean, v: SETTINGS_VERSION };
  const hadAllKeys =
    raw &&
    typeof raw === "object" &&
    Number(raw.v) === SETTINGS_VERSION &&
    Object.keys(DEFAULTS).every((k) => k in raw);
  return { settings, changed: !hadAllKeys };
}
