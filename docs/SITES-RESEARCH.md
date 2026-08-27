# Player research — 2026-08 sweep

Agent-run survey of players that draw captions in the page DOM without
exposing `video.textTracks`. Primary sources: Firefox Picture-in-Picture
site wrappers (actively maintained against current player DOMs),
asbplayer, yt-dlp extractors, per-site userscripts.

## Shipped in 1.8.1 (DOM_CAPTION_SITES)

| Site | Container | Segment | Notes |
| --- | --- | --- | --- |
| Udemy | `[class*='--captions-container--']` | `[data-purpose='captions-cue-text']` | owner-verified DOM 2026-08: module prefix is `captions-display-module--`; match the stable middle |
| Hulu | `.ClosedCaption` | `.CaptionBox` | verified against Firefox PiP main 2026-08; live TV uses `#inband-closed-caption` — not covered |
| HBO Max | `[data-testid='CueBoxContainer']` | `span` | verified against Firefox PiP main 2026-08; current player host is play.hbomax.com (covered); span drift covered by container-text fallback |
| Peacock | `[data-t='subtitles'], [data-t-subtitles='true']` | `.video-player__subtitles__line` | container verified vs Firefox PiP main; the line class is NOT in Mozilla's source — container-text fallback is the likely read path |
| Dailymotion | `.subtitles` | `div` | verified against Firefox PiP main 2026-08 (reads div children) |
| Viki | `.vjs-text-track-display` | `.vjs-text-track-cue` | video.js emulated tracks |
| LinkedIn Learning | `.vjs-text-track-display` | `.vjs-text-track-cue` | video.js; safe either mode (native mode leaves the display div empty) |
| Skillshare | `.vjs-text-track-display` | `.vjs-text-track-cue` | sources from 2022 — verify on current site |
| edX | `.closed-captions.is-visible` | `span` | plain-text swap: container-text fallback is the read path; `.is-visible` avoids stale hidden text (Firefox edx wrapper does the same) |

The harvester falls back to the container's own text when the segment
selector matches nothing (shipped with this sweep) — a retired segment
class degrades gracefully instead of going silent.

## Deliberately NOT shipped

- **Crunchyroll** — captions drawn on a canvas (libass); no DOM text
  exists. Would require intercepting the ASS file. Off the table for now.
- **Paramount+**, **Apple TV+** — no selector established at ≥medium
  confidence. Apple additionally nests the player in shadow DOM.
- **Plex** — `.libjass-subs` overlay, but sources stale (2021) and only
  direct-play SRT/VTT renders as DOM text.
- **Vimeo**, **Coursera** — expose usable textTracks: the native
  pipeline already handles them, a DOM config could double-feed.
- **Khan Academy** — videos are youtube.com embeds; the YouTube path
  (all_frames) already covers them.

## Transcript goldmine (future: static-track loaders like YouTube's)

Full timed cues are fetchable same-origin on several platforms — the
same pattern as the YouTube timedtext loader, giving whole-video
lookahead instead of live DOM harvesting:

- **Udemy**: `/api-2.0/...lectures/{id}?fields[lecture]=asset&fields[asset]=captions`
  → `asset.captions[].url` (VTT, per-locale, `source:"auto"` flags autogen).
  DOM transcript panel (owner-verified): `[data-purpose='transcript-panel']`,
  cues `p[data-purpose='transcript-cue']` (the active one becomes
  `transcript-cue-active`) — no timing attributes, and the panel is only
  in the DOM while open, so the VTT API is the right lookahead source.
- **Pluralsight**: `app.pluralsight.com/transcript/api/v1/caption/json/{clipId}/{lang}`.
- **LinkedIn Learning**: `/learning-api/detailedCourses?...&courseSlug={slug}`
  → `transcript` lines `{transcriptStartAt, caption}` (csrf-token header
  = JSESSIONID cookie value).
- **edX**: video-block handler `/handler/transcript/translation/{lang}`
  (sjson); the DOM transcript sidebar even carries `data-start` (ms).
- **Skillshare**: `{classUrl}/transcripts?format=json` (2022 — verify).
- **MasterClass**: `edge.masterclass.com/api/v1/media/metadata/{uuid}`
  → `text_tracks[].src` VTTs (public API key, CORS-limited to their origin).

Implementation sketch: per-site `harvestStaticTrack()` like
`harvestYouTubeStatic()` — fetch same-origin, parse VTT/JSON to cues,
`adoptStaticCues()`. Candidates in priority order: Udemy (validated,
popular), LinkedIn Learning, Pluralsight.
