# Known limitations (current Chrome build)

Documented per the porting plan (phase 0). Each item is a candidate for the
roadmap, not a bug.

## Subtitles

- Voxylio dubs videos **whose player exposes a subtitle track** (native
  text tracks or a fetchable WebVTT/SRT file). Videos without accessible
  subtitles are not dubbed — audio-capture transcription is the planned
  premium track.
- TTML and platform-proprietary caption formats are not parsed yet.
- Players inside **closed** shadow DOM are invisible to detection (open
  shadow roots and same-origin iframes work).
- Players that draw captions as plain DOM without a text track are not
  supported yet.
- Subtitles served cross-origin without CORS can fail to load; the fetch is
  retried but may never succeed on some CDNs.

## Translation

- Local translation requires Chrome 138+ and downloads a language pack per
  pair on first use; until it is ready the online fallback (if enabled)
  handles the first sentences.
- The online fallback uses an unofficial endpoint with no contractual
  guarantee (an official, configurable provider is planned). Strict local
  mode avoids it entirely.
- Sentences are translated without cross-sentence context; pronoun
  resolution across sentences can be imperfect.

## Speech

- Voice quality depends on the voices installed on the system; the popup
  warns when no voice exists for the target language.
- Speech starts only after a user interaction with the page (browser
  autoplay policy) — clicking Play is enough.
- The floating controller and on-screen captions are not visible in native
  fullscreen (the browser layers them under the fullscreen element).

## Scope

- One video is dubbed at a time (the playing, visible, largest one) — by
  design.
- Extension UI is currently French-only; listing/store texts exist in FR
  and EN.
