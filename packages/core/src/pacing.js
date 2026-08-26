// Speech pacing — extracted verbatim from the Chrome POC.
// Gentle catch-up: when the translated sentence is clearly longer than its
// segment, speed up only A LITTLE — never more than +25% over the setting,
// nor ×1.45 absolute — then follow the player's own speed.

export const WORDS_PER_SECOND = 2.6; // at rate 1

// Space-less scripts (CJK, Thai): splitting on whitespace sees ONE "word"
// in a whole sentence, so the catch-up branch never fires and long lines
// get dropped downstream. Estimate words from character count instead.
const SPACELESS_RE =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u0e00-\u0e7f]/;

export function computeUtteranceRate({
  text,
  cueDur,
  baseRate,
  playbackRate = 1,
}) {
  const s = String(text || "").trim();
  const base = Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 1;
  const words = SPACELESS_RE.test(s)
    ? Math.max(1, Math.round(s.replace(/\s+/g, "").length / 2.5))
    : s.split(/\s+/).filter(Boolean).length;
  const estimated = words / WORDS_PER_SECOND;
  let rate = base;
  if (cueDur > 0.5) {
    const ratio = estimated / base / cueDur;
    if (ratio > 1.15) {
      rate = Math.min(base * ratio, base * 1.25, 1.45);
    }
  }
  const pr = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  return Math.min(rate * pr, 3);
}
