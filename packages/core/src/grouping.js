// Sentence reconstruction for progressive captions.
//
// Key invariants (see docs/IMPLEMENTATION_PLAN.md and the repetition-bug
// post-mortem in the tests):
//  - a group's `id` NEVER depends on its mutable text — only on its start;
//  - `version` changes whenever the text changes, so consumers can detect
//    growth without re-keying;
//  - the LAST group of a live stream is a `draft` (still growing) — only
//    the caller can finalize it (time-stability heuristics live there);
//  - roll-up AND sliding-window caption feeds are merged into one cue.
import { cleanCaption, endsSentence, continuesEllipsis } from "./subtitles.js";

export const GROUP_MAX_LEN = 280; // max characters per sentence (safety cap)
export const GROUP_MAX_GAP = 1.4; // silence (s) that closes a sentence

// Cheap stable content hash (FNV-1a, 32-bit) for group versions.
// Math.imul keeps the multiply in true 32-bit integer arithmetic — the
// previous float multiply silently rounded low bits above 2^53, which
// no integer-exact port could ever reproduce. Hashes are only compared
// within a session, so changing the algorithm was safe.
export function textHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

function normalizeWords(s) {
  return s
    .toLowerCase()
    .replace(/[.,!?…;:'"«»()\[\]]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Longest overlap (in words) between the END of `a` and the START of `b`.
// Returns the number of overlapping words of `b`, or 0.
export function wordOverlap(a, b, minWords = 2) {
  const aw = normalizeWords(a);
  const bw = normalizeWords(b);
  const max = Math.min(aw.length, bw.length);
  for (let n = max; n >= minWords; n--) {
    let match = true;
    for (let i = 0; i < n; i++) {
      if (aw[aw.length - n + i] !== bw[i]) {
        match = false;
        break;
      }
    }
    if (match) return n;
  }
  return 0;
}

// Merge an incoming caption into the previous cue when the feed is
// progressive. Handles BOTH shapes real players produce:
//  - roll-up:        "Welcome" → "Welcome to the course"      (prefix growth)
//  - sliding window: "Welcome to the course" → "to the course of coding"
//    (the window drops leading words; the overlap must be stitched).
// Returns { text, end, grew } when it merges, or null.
export function mergeRollup(last, start, end, text) {
  if (!last) return null;
  if (start > last.end + 0.6) return null;
  // A cue must not grow forever: an uninterrupted roll-up monologue would
  // otherwise become one giant, permanently-draft group (never spoken as
  // long as it keeps changing, then voiced as a monster utterance). Close
  // it at a sentence boundary once well past the group cap, and refuse
  // outright at a hard ceiling even mid-sentence.
  if (
    (last.text.length > GROUP_MAX_LEN * 3 && endsSentence(last.text)) ||
    last.text.length > 2000
  ) {
    return null;
  }

  // Prefix relation (classic roll-up)
  if (text.startsWith(last.text) || last.text.startsWith(text)) {
    return {
      text: text.length > last.text.length ? text : last.text,
      end: Math.max(last.end, end),
      grew: text.length > last.text.length,
    };
  }

  // Sliding window: longest suffix of last == prefix of incoming
  const overlap = wordOverlap(last.text, text, 2);
  if (overlap > 0) {
    const bw = normalizeWords(text);
    if (overlap >= bw.length) {
      // incoming is entirely contained in the tail of last
      return { text: last.text, end: Math.max(last.end, end), grew: false };
    }
    // Replace last's overlapping tail with the FULL incoming text: the
    // incoming version of the shared words carries the richest
    // punctuation ("…de codage." vs "…de codage").
    // The overlap is counted in NORMALIZED words (apostrophes and
    // ellipses split: "don't" = 2 words) but the cut walks \S+ tokens
    // ("don't" = 1 token) — so consume tokens from the end until they
    // account for `overlap` normalized words, instead of cutting
    // `overlap` tokens (which deleted extra words: "I said don't stop" +
    // "don't stop now" once lost "said").
    const re = /\S+/g;
    const starts = [];
    const tokens = [];
    let m;
    while ((m = re.exec(last.text)) !== null) {
      starts.push(m.index);
      tokens.push(m[0]);
    }
    let cutIdx = 0;
    let consumed = 0;
    for (let i = tokens.length - 1; i >= 0; i--) {
      consumed += normalizeWords(tokens[i]).length;
      if (consumed >= overlap) {
        cutIdx = starts[i];
        break;
      }
    }
    const head = last.text.slice(0, cutIdx).trimEnd();
    const merged = head ? head + " " + text : text;
    return {
      text: merged,
      end: Math.max(last.end, end),
      grew: merged.length > last.text.length,
    };
  }
  return null;
}

// Rebuild sentence groups from cues. The result is deterministic for a
// given cue list; each group carries:
//   id      — stable, start-derived, text-independent
//   version — text hash, changes when the group grows
//   final   — false ONLY for the trailing group (it may still grow);
//             time-based stabilization is the caller's job.
export function buildGroups(cues, opts = {}) {
  const MAX_LEN = opts.maxLen ?? GROUP_MAX_LEN;
  const MAX_GAP = opts.maxGap ?? GROUP_MAX_GAP;
  const groups = [];
  let cur = null;
  for (const c of cues) {
    const txt = cleanCaption(c.text);
    // Letterless leftovers ("...", "???", "1:23") are display junk: they
    // must never reach a translator, a quota meter, or a voice.
    if (!txt || !/\p{L}/u.test(txt)) continue;
    if (
      cur &&
      ((endsSentence(cur.text) && !continuesEllipsis(cur.text, txt)) ||
        c.start - cur.end > MAX_GAP ||
        cur.text.length > MAX_LEN)
    ) {
      groups.push(cur);
      cur = null;
    }
    if (!cur) {
      cur = { start: c.start, end: c.end, text: txt };
    } else if (cur.text.endsWith(txt)) {
      // Duplicated fragment (progressive captions): extend, don't repeat
      cur.end = Math.max(cur.end, c.end);
    } else {
      cur.end = Math.max(cur.end, c.end);
      cur.text += " " + txt;
    }
  }
  if (cur) groups.push(cur);
  // Same-start groups (two speakers on one timestamp, frame-quantised DOM
  // cues) must NOT share an id — a collision silently swallows the second
  // line (marked spoken with the first, translation dropped as stale).
  // The disambiguating counter is deterministic for a given cue list, so
  // ids stay stable across rebuilds.
  const used = new Map();
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    let id = "g" + Math.round(g.start * 100);
    const n = used.get(id) || 0;
    used.set(id, n + 1);
    if (n > 0) id += "_" + n;
    g.id = id;
    g.version = textHash(g.text);
    // The trailing group may still be growing (live/progressive feeds).
    g.final = i < groups.length - 1;
    // Kept for display/debug only — NEVER use as identity.
    g.key = g.id + ":" + g.version;
  }
  return groups;
}
