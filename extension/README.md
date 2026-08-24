# Voxylio — Chrome extension

> ⚠️ The `.js` files in this folder are **generated** from `apps/chrome/src`
> and `packages/core` (`pnpm build:chrome`). Edit the sources, not these files.

Dubs subtitled videos in real time — into **French, Spanish, Italian, German
or Portuguese**. Built for online course platforms, works on any site whose
player exposes a subtitle track.

## How it works

1. The content script detects the page video (including inside shadow DOMs,
   e.g. the Mux player).
2. It reads the English subtitle track (native text track or VTT file) and
   rebuilds full sentences from caption fragments — like a real dubbing
   studio, so translations keep their context and the voice stays fluid.
3. Each sentence is translated into the chosen language — Chrome's **local**
   translation API (138+) first, online fallback otherwise.
4. A synthesized voice speaks over the video, in sync with playback; the
   original audio is ducked (adjustable, 0% = dubbing only).

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Open a lesson, play the video for a few seconds, then click the extension
   icon and flip the switch — or use the floating bar on the page

## Settings (popup)

- **Video language**: source language — auto-detected from the subtitle
  track (or Chrome's language detector), or forced explicitly. Any-to-any
  pairs work: en→fr, fr→en, es→de…
- **Dubbing language**: target language (fr, es, it, de, pt). More can be
  added easily in `popup.html` (and `LOCALES` in `content.js`).
- **Voice**: automatic, or any installed voice for that language, with a
  ▶ preview button. On macOS: System Settings → Accessibility → Spoken
  Content → download a "Premium" voice for a much more natural result.
- **Voice speed**: base speech rate. It follows the player's speed
  (×1.25/×1.5/×2) and self-adjusts slightly on long sentences.
- **Original audio**: video volume while dubbing.
- **Auto-pause when behind**: pauses the video for a moment instead of
  skipping lines when the voice falls too far behind.
- **Strict local mode**: never use the online translation fallback —
  nothing leaves the device.
- **On-screen subtitles**: original + translation overlaid on the video.
- **Floating menu**: the draggable on-page controller. Dismiss it with ✕,
  re-enable it from the popup.
- **Retry / Diagnostic / Reset**: re-detect everything, copy a technical
  diagnostic for bug reports, or restore default settings.

Only the currently playing, visible video is dubbed — thumbnails, previews
and background players are ignored.

## Notes

- First activation in a language: Chrome may download the corresponding
  translation pack (once per language; everything is local and free
  afterwards).
- Speech synthesis starts after an interaction with the page (clicking Play
  is enough).
- Personal use only: course content remains subject to its terms of service.
