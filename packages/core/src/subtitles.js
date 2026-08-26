// Subtitle text utilities — the ingestion-side cleaning pipeline.
//
// Two stages, two jobs:
//  - stripTags — MARKUP removal (HTML/VTT tags, ASS overrides, HTML
//    entities). Applied at cue ingest, before dedup/merge keys exist.
//  - cleanCaption — SPEECH filtering (SDH annotations, speaker labels,
//    lyrics, dialogue dashes). Applied at grouping time: the dub must
//    only ever speak words someone actually says. "[MUSIC]", "JOHN:",
//    "♪ lyrics ♪" are display information, not speech.

const NAMED_ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
  shy: "", lrm: "", rlm: "", zwj: "", zwnj: "",
};

function fromCode(n) {
  try {
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : " ";
  } catch (e) {
    return " ";
  }
}

/** Decodes numeric and common named HTML entities ("&#39;" → "'").
 *  Google Translate v2 re-escapes apostrophes even with format:"text",
 *  and WebVTT mandates &lt;/&gt; — without this the voice would read
 *  "ampersand hash three nine semicolon" out loud. */
export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => fromCode(parseInt(h, 16)))
    .replace(/&#(\d{1,7});/g, (_, d) => fromCode(parseInt(d, 10)))
    .replace(/&([a-z]{2,8});/gi, (m, name) => {
      const key = name.toLowerCase();
      return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : m;
    });
}

export function stripTags(s) {
  return decodeEntities(
    String(s)
      .replace(/<[^>]*>/g, " ") // HTML/VTT tags (<i>, <c.color>, <v Bob>)
      .replace(/\{\\[^}]*\}/g, " ") // ASS/SSA overrides ({\an8}, {\i1})
  )
    .replace(/\s+/g, " ")
    .trim();
}

// Dubbing-style cleanup: strip sound annotations ([Music], (applause), ♪)
// and dialogue dashes — but PRESERVE informative parentheses, which are
// part of the actual speech ("the API (introduced in v2) lets you…").
const SOUND_CUE_RE =
  /music|musique|applau|laugh|rire|sigh|soupir|cough|toux|inaudible|silence|bruit|noise|chuckle|cheer|gasp|groan|grunt|scream|whisper|chuchot|sob|sanglot|crying|cries|pleur|singing|chante|humming|fredonn|beep|bip|ringing|sonnerie|\bsonne\b|téléphone|phone rings|footsteps|klaxon|explosion|gunshot|coup de feu|thunder|tonnerre|grésill|static|barking|aboie|growl|speaking|parle en|indistinct|chatter|murmur|narrator|narrateur/i;

export function isSoundCue(inner) {
  const s = String(inner).trim();
  // No letters at all ("...", "???"): nothing speakable.
  if (!/\p{L}/u.test(s)) return true;
  // ALL-CAPS Latin stage direction "(MUSIC PLAYING)". Unicameral scripts
  // (CJK, Arabic, Hebrew…) have no case: they are never caught here —
  // parenthesized Japanese speech must survive.
  if (/\p{Lu}/u.test(s) && !/\p{Ll}/u.test(s)) return true;
  return SOUND_CUE_RE.test(s);
}

const MUSIC_GLYPH = /[♪♫♬♩]/; // ♪ ♫ ♬ ♩

export function cleanCaption(s) {
  const raw = String(s);
  const trimmed = raw.trim();
  // A cue that OPENS with a music note is sung content: the dub stays
  // silent over songs (a robot voice reading translated lyrics over the
  // vocals is worse than nothing). "# … #" is the teletext convention.
  if (MUSIC_GLYPH.test(trimmed.charAt(0)) || /^#\s.*\s#$/.test(trimmed)) return "";
  return (
    raw
      // SDH annotations in brackets — including remnants of a bracket
      // pair split across two cues ("[MUSIC" / "PLAYING]").
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\[[^\]]*$/, " ")
      .replace(/^[^[]*\]/, " ")
      // Parenthetical sound descriptions (speech-y parentheses survive),
      // including an unclosed "(LAUGHING" spilling into the next cue.
      .replace(/\(([^)]*)\)/g, (m, inner) => (isSoundCue(inner) ? " " : m))
      .replace(/\(([^)]*)$/, (m, inner) => (isSoundCue(inner) ? " " : m))
      // ">>" speaker-change markers (broadcast captions).
      .replace(/\s*>>+\s*/g, " ")
      // ALL-CAPS speaker labels ("JOHN:", "MAN 1:") — display info, never
      // spoken. Lowercase "Attention:" stays: that is real speech.
      .replace(/(^|\s)([\p{Lu}][\p{Lu}\p{N} .'’-]{1,28}):\s+/gu, "$1")
      // Stray music glyphs mid-text.
      .replace(/[♪♫♬♩]+/g, " ")
      // Dialogue dashes: leading, and after a sentence boundary.
      .replace(/^\s*[-–—]\s*/, "")
      .replace(/([.!?…])\s+[-–—]\s+/g, "$1 ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Terminal punctuation across scripts: Latin, CJK fullwidth (。！？．),
// Arabic (؟), Urdu (۔), Devanagari danda (।) — with optional closers.
const SENTENCE_END_RE = /[.!?…。！？．؟۔।]["'’»」』）)\]]*$/;
// Title abbreviations that end in a period but never end a sentence.
const ABBREV_RE = /(?:^|[\s(«"'’-])(dr|mr|mrs|ms|prof|st|sgt|capt|lt|col|gen|mme|mlle|m)\.$/i;

export function endsSentence(s) {
  const t = String(s).trim();
  if (!SENTENCE_END_RE.test(t)) return false;
  const bare = t.replace(/["'’»」』）)\]]+$/, "");
  if (/\.$/.test(bare) && !/\.\.$/.test(bare) && ABBREV_RE.test(bare)) return false;
  return true;
}

/** "…continuation" idiom: a trailing ellipsis whose next cue resumes in
 *  lowercase (or with its own leading ellipsis) is ONE sentence — the
 *  grouping must not split it. */
export function continuesEllipsis(curText, nextText) {
  if (!/(\.\.\.|…)$/.test(String(curText).trim())) return false;
  return /^(\.\.\.|…)?\s*\p{Ll}/u.test(String(nextText).trim());
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
