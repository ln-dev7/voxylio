// Voice selection — extended from the Chrome POC to the full language
// catalog. Preference: "premium/enhanced" voices > Google > local > the
// rest, with a bonus for the language's primary locale.

import { PRIMARY_LOCALE, VOICE_PREFIX_ALIASES } from "./languages.js";

export function pickVoice(voices, { targetLang, voiceName = "" }) {
  if (voiceName) {
    const v = voices.find((v) => v.name === voiceName);
    if (v) return v;
  }
  const lang = targetLang;
  // Some platforms tag voices under sibling codes (no → nb-NO,
  // tl → fil-PH, he → iw): accept every known prefix for the language.
  const prefixes = [lang, ...(VOICE_PREFIX_ALIASES[lang] || [])];
  const candidates = voices.filter((v) => {
    const vl = (v.lang || "").toLowerCase();
    return prefixes.some((p) => vl.startsWith(p));
  });
  if (!candidates.length) return null;
  const primary = (PRIMARY_LOCALE[lang] || "").toLowerCase();
  const score = (v) => {
    let s = 0;
    const n = (v.name || "").toLowerCase();
    if (/premium|enhanced|amélior/i.test(n)) s += 4;
    if (n.includes("google")) s += 3;
    if (v.localService) s += 1;
    // bonus for the "main" locale (fr-FR, es-ES, nb-NO…)
    const vl = (v.lang || "").toLowerCase();
    if (vl === lang + "-" + lang || (primary && vl === primary)) s += 2;
    return s;
  };
  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0];
}

/** Kept for callers that need a speakable locale per language. */
export const LOCALES = PRIMARY_LOCALE;
