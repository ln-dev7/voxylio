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

## Premium Audio (no-subtitle dubbing, Pro beta)

- Audio capture uses `HTMLMediaElement.captureStream()`: DRM-protected
  players (Widevine — Netflix, Disney+, Prime) and CORS-tainted media
  (many course CDNs without CORS headers) refuse or throw — the popup
  says so honestly ("can't capture this player's audio") and nothing
  else breaks. Those platforms have subtitles anyway.
- NO local fallback exists for this feature: minutes exhausted, it
  pauses until the next monthly period (every text feature falls back
  to the local engine instead — this is the one exception, stated in
  the FAQ and the popup).
- Transcription quality degrades above ~1.25× playback speed (the
  captured audio is the sped-up signal); a rate change restarts the
  streaming session so cue timing stays correct.
- Metering is heartbeat-based (~20 s granularity, hard client stop at
  the granted allowance): a session can overrun the meter by a few
  seconds at most.
