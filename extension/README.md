# Video Dub — Chrome extension

Dubs subtitled videos in real time — into **French, Spanish, Italian, German
or Portuguese**. Built for course platforms like
[AI Hero](https://www.aihero.dev), works on any site whose player exposes a
subtitle track.

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

- **Language**: dubbing language (fr, es, it, de, pt). More languages can be
  added easily in `popup.html` (and `LOCALES` in `content.js` for the voice
  locale).
- **Voice**: automatic, or any installed voice for that language. On macOS:
  System Settings → Accessibility → Spoken Content → download a "Premium"
  voice for a much more natural result.
- **Voice speed**: base speech rate (it self-adjusts slightly when the
  translated sentence is longer than the original).
- **Original audio**: video volume while dubbing.
- **Floating menu**: the draggable on-page controller (power, language,
  speed, original audio). Dismiss it with ✕, re-enable it from the popup.

## Notes

- First activation in a language: Chrome may download the corresponding
  translation pack (once per language; everything is local and free
  afterwards).
- Speech synthesis starts after an interaction with the page (clicking Play
  is enough).
- Personal use only: course content remains subject to its terms of service.
