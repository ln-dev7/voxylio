// YouTube static subtitle track: the watch page embeds the caption
// track list (ytInitialPlayerResponse.captions…captionTracks), and each
// track's baseUrl serves the FULL cue list as JSON ("fmt=json3").
//
// Loading that file upfront is what makes YouTube dubbing flow: every
// sentence and its exact window are known in advance, so translations
// prefetch, the Pro batch sees whole scenes, and speech starts ON the
// cue instead of one sentence late. The DOM caption feed (roll-up
// harvesting) remains the fallback whenever any of this fails — the
// endpoint is same-origin from a watch page and needs no extra
// permission, but YouTube can and does change it.

/**
 * Pull `"captionTracks":[…]` out of raw watch-page HTML with a balanced
 * scanner (the array nests objects and arrays, so a lazy regex cuts it
 * short). Returns [] when the video has no captions or markup changed.
 */
export function extractCaptionTracks(html) {
  const h = String(html || "");
  const at = h.indexOf('"captionTracks":');
  if (at < 0) return [];
  const open = h.indexOf("[", at);
  if (open < 0) return [];
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = open; i < h.length; i++) {
    const c = h[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) {
        try {
          const arr = JSON.parse(h.slice(open, i + 1));
          return Array.isArray(arr)
            ? arr.filter((t) => t && typeof t.baseUrl === "string")
            : [];
        } catch (e) {
          return [];
        }
      }
    }
  }
  return [];
}

/**
 * Choose the track to dub from. Manual captions beat auto-generated
 * ("asr"); an explicit source language beats everything; with no
 * preference, English gets a slight bias (matches the harvesters) and
 * a track already in the DUB language is avoided when any alternative
 * exists — dubbing target→target is a no-op, while another language's
 * track is exactly what the user wants dubbed. Null only when empty.
 */
export function pickCaptionTrack(tracks, wanted, avoid) {
  const list = Array.isArray(tracks) ? tracks.filter(Boolean) : [];
  if (!list.length) return null;
  const want = wanted && wanted !== "auto" ? String(wanted).toLowerCase() : "";
  const dodge = !want && avoid ? String(avoid).toLowerCase().split("-")[0] : "";
  const score = (t) => {
    const base = String(t.languageCode || "")
      .toLowerCase()
      .split("-")[0];
    let s = 0;
    if (want && base === want) s += 8;
    if (t.kind !== "asr") s += 2;
    if (!want && base === "en") s += 1;
    if (dodge && base === dodge) s -= 4;
    return s;
  };
  return list.slice().sort((a, b) => score(b) - score(a))[0];
}

/** The track's cue-list URL: unescape the embedded & and force json3. */
export function timedtextUrl(baseUrl) {
  const url = String(baseUrl || "").replace(/\\u0026/g, "&");
  if (!url) return "";
  return url + (url.includes("?") ? "&" : "?") + "fmt=json3";
}

/**
 * json3 events → engine cues [{start, end, text}] in seconds.
 * `aAppend` events are roll-up continuations of the PREVIOUS event
 * (their text is already carried there) and newline-only segments are
 * layout, not speech — both are dropped.
 */
export function parseJson3(data) {
  const events = data && Array.isArray(data.events) ? data.events : [];
  const cues = [];
  for (const ev of events) {
    if (!ev || ev.aAppend || !Array.isArray(ev.segs)) continue;
    const text = ev.segs
      .map((s) => (s && typeof s.utf8 === "string" ? s.utf8 : ""))
      .join("")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const start = (Number(ev.tStartMs) || 0) / 1000;
    const durMs = Number(ev.dDurationMs);
    const end = start + (Number.isFinite(durMs) && durMs > 0 ? durMs : 3000) / 1000;
    cues.push({ start, end, text });
  }
  return cues;
}
