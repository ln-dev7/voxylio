// Sentence reconstruction — extracted verbatim from the Chrome POC.
import { cleanCaption, endsSentence } from "./subtitles.js";

export const GROUP_MAX_LEN = 280; // max characters per sentence (safety cap)
export const GROUP_MAX_GAP = 1.4; // silence (s) that closes a sentence

// Roll-up captions (YouTube-style): the same sentence is re-sent, each time
// a little longer. Decide whether an incoming cue continues the last one.
// Returns the updated cue when it merges, or null when it does not.
export function mergeRollup(last, start, end, text) {
  if (!last) return null;
  if (start > last.end + 0.6) return null;
  if (!(text.startsWith(last.text) || last.text.startsWith(text))) return null;
  return {
    text: text.length > last.text.length ? text : last.text,
    end: Math.max(last.end, end),
    grew: text.length > last.text.length,
  };
}

// Captions arrive as fragments: rebuild full sentences before translating
// and speaking, like YouTube dubbing does.
export function buildGroups(cues, opts = {}) {
  const MAX_LEN = opts.maxLen ?? GROUP_MAX_LEN;
  const MAX_GAP = opts.maxGap ?? GROUP_MAX_GAP;
  const groups = [];
  let cur = null;
  for (const c of cues) {
    const txt = cleanCaption(c.text);
    if (!txt) continue;
    if (
      cur &&
      (endsSentence(cur.text) ||
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
  for (const g of groups) {
    g.key = Math.round(g.start * 100) + "|" + g.text.slice(0, 48);
  }
  return groups;
}
