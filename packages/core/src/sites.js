// Players that never expose their subtitles through textTracks but DO
// render them in the page DOM. For these, the content script watches the
// caption container and feeds what appears as synthetic cues — the rest
// of the pipeline (roll-up merge, sentence grouping, stability clock)
// is unchanged. Selectors are the long-stable ones for each player.

export const DOM_CAPTION_SITES = [
  {
    id: "youtube",
    host: /(^|\.)youtube(-nocookie)?\.com$|(^|\.)youtu\.be$/,
    container: ".ytp-caption-window-container",
    segment: ".ytp-caption-segment",
    // Simple on/off toggle: safe to click programmatically.
    cc: ".ytp-subtitles-button",
  },
  {
    id: "netflix",
    host: /(^|\.)netflix\.com$/,
    container: ".player-timedtext",
    segment: ".player-timedtext-text-container",
  },
  {
    id: "primevideo",
    host: /(^|\.)primevideo\.com$|(^|\.)amazon\.[a-z.]+$/,
    container: ".atvwebplayersdk-captions-overlay",
    segment: "span",
  },
  {
    id: "disneyplus",
    host: /(^|\.)disneyplus\.com$/,
    container: ".dss-subtitle-renderer-cue-window",
    segment: "span",
  },
  {
    id: "twitch",
    host: /(^|\.)twitch\.tv$/,
    container: "[data-a-target='player-captions-container']",
    segment: "span",
  },
];

/** The DOM-caption adapter for a hostname, or null. */
export function domCaptionSiteFor(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return DOM_CAPTION_SITES.find((s) => s.host.test(h)) || null;
}

/**
 * Synthetic end time for a DOM-harvested caption: readable-duration
 * estimate from the word count, clamped — the real end is applied when
 * the next caption replaces it.
 */
export function domCueEnd(start, text) {
  const words = String(text || "").split(/\s+/).filter(Boolean).length;
  return start + Math.min(7, Math.max(1.5, words / 2.5));
}
