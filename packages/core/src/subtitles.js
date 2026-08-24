// Subtitle text utilities — extracted verbatim from the Chrome POC.

export function stripTags(s) {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Dubbing-style cleanup: strip sound annotations ([Music], (applause), ♪)
// and dialogue dashes — but PRESERVE informative parentheses, which are
// part of the actual speech ("the API (introduced in v2) lets you…").
const SOUND_CUE_RE =
  /music|musique|applau|laugh|rire|sigh|soupir|cough|toux|inaudible|silence|bruit|noise|chuckle|cheer/i;

export function isSoundCue(inner) {
  // All-caps stage directions or known sound descriptions
  return SOUND_CUE_RE.test(inner) || /^[^a-zà-ÿ]*$/.test(inner);
}

export function cleanCaption(s) {
  return s
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\(([^)]*)\)/g, (m, inner) => (isSoundCue(inner) ? " " : m))
    .replace(/♪+/g, " ")
    .replace(/^[-–—]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function endsSentence(s) {
  return /[.!?…](["')\]])?$/.test(s.trim());
}

export function parseTimestamp(ts) {
  const m = ts.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/);
  if (!m) return null;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  return (
    h * 3600 +
    parseInt(m[2], 10) * 60 +
    parseInt(m[3], 10) +
    parseInt(m[4].padEnd(3, "0"), 10) / 1000
  );
}

// Accepts both WebVTT and SRT (comma decimals, numeric counters).
export function parseVTT(text) {
  const cues = [];
  const blocks = text.replace(/\r/g, "").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (!lines.length) continue;
    let i = 0;
    if (!lines[i].includes("-->")) i++; // optional cue identifier
    if (i >= lines.length || !lines[i].includes("-->")) continue;
    const [startRaw, endRaw] = lines[i].split("-->");
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw.trim().split(/\s+/)[0]);
    if (start == null || end == null) continue;
    const textLines = lines.slice(i + 1).map(stripTags).filter(Boolean);
    if (!textLines.length) continue;
    cues.push({ start, end, text: textLines.join(" ") });
  }
  return cues;
}
