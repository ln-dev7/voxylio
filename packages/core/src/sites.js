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
  {
    // Udemy renders captions in its own overlay (Shaka-style); the video
    // element exposes no track. `data-purpose` attributes are Udemy's
    // stable hooks — the container class is CSS-module-hashed, so match
    // its stable prefix. No `cc`: their captions button opens a language
    // menu, not a toggle — never click it programmatically.
    id: "udemy",
    host: /(^|\.)udemy\.com$/,
    container: "[class*='captions-display--captions-container']",
    segment: "[data-purpose='captions-cue-text']",
  },
  // The entries below come from the 2026-08 sweep of players that draw
  // captions in the DOM without exposing textTracks (sources: Firefox
  // Picture-in-Picture site wrappers, asbplayer, per-site userscripts).
  // A wrong selector fails safe: no cues, the popup keeps its guidance.
  {
    id: "hulu",
    host: /(^|\.)hulu\.com$/,
    container: ".ClosedCaption",
    segment: ".CaptionBox",
  },
  {
    id: "hbomax",
    host: /(^|\.)hbomax\.com$|(^|\.)max\.com$/,
    container: "[data-testid='CueBoxContainer']",
    segment: "span",
  },
  {
    id: "peacock",
    host: /(^|\.)peacocktv\.com$/,
    container: "[data-t='subtitles'], [data-t-subtitles='true']",
    segment: ".video-player__subtitles__line",
  },
  {
    id: "dailymotion",
    host: /(^|\.)dailymotion\.com$/,
    container: ".subtitles",
    segment: ".subtitles-text",
  },
  {
    // Viki runs video.js in emulated-track mode: the video element's
    // textTracks stay empty and cues render into the vjs display div.
    id: "viki",
    host: /(^|\.)viki\.com$/,
    container: ".vjs-text-track-display",
    segment: ".vjs-text-track-cue",
  },
  {
    // LinkedIn Learning and Skillshare are video.js too. When a vjs
    // player uses NATIVE tracks the display div stays empty (the native
    // pipeline feeds us instead), so this entry can never double-feed.
    id: "linkedin",
    host: /(^|\.)linkedin\.com$/,
    container: ".vjs-text-track-display",
    segment: ".vjs-text-track-cue",
  },
  {
    id: "skillshare",
    host: /(^|\.)skillshare\.com$/,
    container: ".vjs-text-track-display",
    segment: ".vjs-text-track-cue",
  },
  {
    // edX swaps plain text inside .closed-captions with no child
    // segments — the harvester falls back to the container's own text
    // when the segment selector matches nothing.
    id: "edx",
    host: /(^|\.)edx\.org$/,
    container: ".closed-captions",
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
