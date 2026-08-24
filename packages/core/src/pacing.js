// Speech pacing — extracted verbatim from the Chrome POC.
// Gentle catch-up: when the translated sentence is clearly longer than its
// segment, speed up only A LITTLE — never more than +25% over the setting,
// nor ×1.45 absolute — then follow the player's own speed.

export const WORDS_PER_SECOND = 2.6; // at rate 1

export function computeUtteranceRate({
  text,
  cueDur,
  baseRate,
  playbackRate = 1,
}) {
  const words = text.split(/\s+/).length;
  const estimated = words / WORDS_PER_SECOND;
  let rate = baseRate;
  if (cueDur > 0.5) {
    const ratio = estimated / baseRate / cueDur;
    if (ratio > 1.15) {
      rate = Math.min(baseRate * ratio, baseRate * 1.25, 1.45);
    }
  }
  return Math.min(rate * (playbackRate || 1), 3);
}
