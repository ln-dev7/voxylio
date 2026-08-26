// Speech pacing.
// Gentle catch-up: when the translated sentence is clearly longer than its
// segment, speed up only A LITTLE — never more than +25% over the setting,
// nor ×1.45 absolute — then follow the player's own speed.
//
// Optional inputs let the caller make this ADAPTIVE:
//  - wps: measured words-per-second of the ACTIVE voice at rate 1 (the
//    engine calibrates it from real utterances; voices differ a lot);
//  - prevRate: the previous line's final rate — the new rate eases toward
//    the target instead of jumping, so a dialog keeps one tempo instead
//    of wobbling line by line.

export const WORDS_PER_SECOND = 2.6; // default at rate 1 (uncalibrated)

// Space-less scripts (CJK, Thai): splitting on whitespace sees ONE "word"
// in a whole sentence, so the catch-up branch never fires and long lines
// get dropped downstream. Estimate words from character count instead.
const SPACELESS_RE =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u0e00-\u0e7f]/;

export function estimateWords(text) {
  const s = String(text || "").trim();
  return SPACELESS_RE.test(s)
    ? Math.max(1, Math.round(s.replace(/\s+/g, "").length / 2.5))
    : s.split(/\s+/).filter(Boolean).length;
}

export function computeUtteranceRate({
  text,
  cueDur,
  baseRate,
  playbackRate = 1,
  wps,
  prevRate = 0,
}) {
  const base = Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 1;
  const perSec =
    Number.isFinite(wps) && wps > 0.5 && wps < 8 ? wps : WORDS_PER_SECOND;
  const words = estimateWords(text);
  const estimated = words / perSec;
  let rate = base;
  if (cueDur > 0.5) {
    const ratio = estimated / base / cueDur;
    if (ratio > 1.15) {
      rate = Math.min(base * ratio, base * 1.25, 1.45);
    }
  }
  // The caps above must never make a long line SLOWER than the user's own
  // setting (base 1.6 vs the 1.45 absolute cap used to invert).
  rate = Math.max(rate, base);
  const pr = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
  let out = Math.min(rate * pr, 3);
  // Ease toward the previous line's tempo: rate jumps between adjacent
  // lines of one dialog are audible as wobble.
  if (Number.isFinite(prevRate) && prevRate > 0) {
    out = Math.min(3, prevRate + (out - prevRate) * 0.6);
  }
  return out;
}
