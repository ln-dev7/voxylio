// Udemy static caption track. The learn page can ask, same-origin, for
// every caption file (VTT with full timings) of the current lecture —
// the same upfront-track advantage as YouTube's timedtext, instead of
// harvesting captions one by one as they appear on screen. Endpoint
// shape sourced from yt-dlp's udemy extractor; DOM hooks owner-verified
// (2026-08). Everything degrades to the DOM caption feed on failure.

/** Lecture id from a /course/{slug}/learn/lecture/{id} URL, or 0. */
export function udemyLectureId(href) {
  const m = /\/lecture\/(\d+)/.exec(String(href || ""));
  return m ? Number(m[1]) : 0;
}

/**
 * Course id out of the app loader's `data-module-args` JSON (the
 * long-stable `.ud-app-loader` element). Accepts the raw attribute
 * string or a parsed object; falls back to a loose regex so a partial
 * JSON change cannot break it.
 */
export function udemyCourseId(moduleArgs) {
  if (!moduleArgs) return 0;
  try {
    const d =
      typeof moduleArgs === "string" ? JSON.parse(moduleArgs) : moduleArgs;
    const n = Number(d.courseId || d.course_id || 0);
    if (Number.isFinite(n) && n > 0) return n;
  } catch (e) {}
  const m = /"course_?[iI]d"\s*:\s*(\d+)/.exec(String(moduleArgs));
  return m ? Number(m[1]) : 0;
}

/** Same-origin captions endpoint for a lecture. */
export function udemyCaptionsUrl(courseId, lectureId) {
  return (
    `/api-2.0/users/me/subscribed-courses/${courseId}/lectures/${lectureId}` +
    `?fields[lecture]=asset&fields[asset]=captions`
  );
}

/**
 * Normalize the API payload's caption list to the shape
 * `pickCaptionTrack` scores: {languageCode, kind, url}. Auto-generated
 * captions ("source":"auto") map to kind "asr" so human tracks win.
 */
export function udemyCaptionTracks(payload) {
  const caps = payload && payload.asset && payload.asset.captions;
  if (!Array.isArray(caps)) return [];
  return caps
    .filter((c) => c && typeof c.url === "string" && c.url)
    .map((c) => ({
      languageCode: String(
        (c.locale && c.locale.locale) || c.video_label || "",
      ).replace("_", "-"),
      kind: c.source === "auto" ? "asr" : "",
      url: c.url,
    }));
}
