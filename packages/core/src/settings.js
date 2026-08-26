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
  // Pro contextual translation (opt-in; only effective for Pro accounts —
  // the background and the backend both enforce it).
  proTranslation: false,
  // Pro neural voice (opt-in, Aura-2 languages; local voice otherwise).
  proVoice: false,
  // Pro no-subtitle dubbing (opt-in, beta): when a video exposes no
  // subtitles at all, capture its audio and transcribe it live
  // (Deepgram Nova-3) — the transcript feeds the normal pipeline.
  // Metered in minutes server-side; NO local fallback exists for this.
  proAudio: false,
  autoPause: false,
  keepTerms: true,
  // User glossary: [{ from, to }] — `to` empty keeps the source form
  // verbatim, `to` set forces that exact target form. Applied through
  // the placeholder mechanism, so it works with every provider.
  glossary: [],
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
      case "proTranslation":
      case "proVoice":
      case "proAudio":
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
      case "glossary": {
        const list = Array.isArray(v) ? v : [];
        const entries = [];
        const seen = new Set();
        for (const e of list) {
          if (entries.length >= 50) break;
          if (!e || typeof e !== "object") continue;
          const from =
            typeof e.from === "string" ? e.from.trim().slice(0, 40) : "";
          const to = typeof e.to === "string" ? e.to.trim().slice(0, 60) : "";
          const dedup = from.toLowerCase();
          if (!from || seen.has(dedup)) continue;
          seen.add(dedup);
          entries.push({ from, to });
        }
        out.glossary = entries;
        break;
      }
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
