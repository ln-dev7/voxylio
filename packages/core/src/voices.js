// Voice selection — extracted verbatim from the Chrome POC.
// Preference: "premium/enhanced" voices > Google > local > the rest.

export function pickVoice(voices, { targetLang, voiceName = "" }) {
  if (voiceName) {
    const v = voices.find((v) => v.name === voiceName);
    if (v) return v;
  }
  const lang = targetLang;
  const candidates = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith(lang)
  );
  if (!candidates.length) return null;
  const score = (v) => {
    let s = 0;
    const n = (v.name || "").toLowerCase();
    if (/premium|enhanced|amélior/i.test(n)) s += 4;
    if (n.includes("google")) s += 3;
    if (v.localService) s += 1;
    // bonus for the "main" locale (fr-FR, es-ES, it-IT, de-DE…)
    if ((v.lang || "").toLowerCase() === lang + "-" + lang) s += 2;
    return s;
  };
  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0];
}

export const LOCALES = {
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  de: "de-DE",
  pt: "pt-PT",
  en: "en-US",
};
