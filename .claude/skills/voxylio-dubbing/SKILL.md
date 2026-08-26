---
name: voxylio-dubbing
description: Working on Voxylio's real-time speech/dubbing engine — utterance scheduling, the speech queue, ducking, pacing, cloud (Aura-2) vs local voices, or the stall-recovery nets. Read this before touching the speak/tick/duck paths so the timing invariants and the no-overlap guarantees survive the change.
---

# Voxylio dubbing engine

Architecture and decisions: `docs/DUBBING.md` (French). Translation side:
`voxylio-translation` skill + `docs/TRANSLATION.md`.

## Code map

| Concern | Where |
| --- | --- |
| Scheduling: trigger, queue, gates | `apps/chrome/src/content.js` — `tick`, `onGroupEnter`, `enqueue`, `drainQueue` |
| Speech engines | `speak` / `speakCloud` (Aura-2 MP3 + Audio element) / `speakLocal` (speechSynthesis) |
| Ducking (speech-gated, dB ramps) | `duckNow`, `maybeReleaseDuck`, `releaseDuckNow`, `rampVolumeTo`, `restoreVolume`, `onVolumeChange`, `ctl.onAudioSettings` |
| Stall nets, 14s pump, watchdog | the engine-specific block at the top of `tick` |
| Rate math (adaptive, smoothed) | `packages/core/src/pacing.js` (`computeUtteranceRate`, `estimateWords`) |
| Voice pick + calibration | `pickVoice`, `localWps` (content.js); `packages/core/src/voices.js` |
| Cloud audio cache/prefetch | `getCloudAudio`, `cloudAudioCache`, `cloudVoiceDownUntil`, pretranslate's pre-gen block |
| Rate/buffer events | `onRateChange`, `onBuffering`, `onPlayingAgain` |

## Invariants

1. **One speech slot.** `ctl.currentUtterance` is the lock for BOTH
   engines. The recovery nets are engine-specific: cloud checks
   `cloudAudio.ended`/fetch age; local requires `speaking && pending`
   false AND ≥1.5 s of age (remote voices show idle during startup —
   reclaiming early overlapped two voices). Never merge these nets.
2. **A line starts at its start time, never before.** `drainQueue` gates
   on `q.start > t + 0.25` (except during our own autoPause catch-up).
   Removing the gate makes the dub run ahead of the picture.
3. **Ducking is speech-gated with dB-domain ramps.** Attack ~250 ms,
   release ~700 ms, hold 4.5 s across a burst, no release when a line is
   imminent. `writeVolume` records `lastWrittenVolume`; a volumechange we
   did not write means the USER took the mix — hands off until they touch
   the duck slider (`ctl.onAudioSettings`) or stop/start. Web Audio API
   is NOT an option (cross-origin media tainting) — video.volume only.
4. **One voice per passage.** Cloud refusal/playback failure sets
   `cloudVoiceDownUntil` (+60 s): the passage stays local. Never fall
   back per-line.
5. **Caption + journal at voice time.** `speak()` shows the caption and
   journals via `extras` ({orig, start, end, rec}) exactly once (`rec`
   survives requeues). Dropped lines are never displayed or counted.
   Stats measure onstart→onend; cancelled utterances (`_vxCancelled`)
   count nothing.
6. **Chrome speechSynthesis quirks are load-bearing**: the ~14 s
   Google-voice cutoff needs the pause()+resume() pump (cycled 9 s, only
   when both functions exist — test stubs lack them); utterance rate is
   write-once (ratechange re-schedules local lines, adapts cloud
   `playbackRate` in place via `_vxBaseRate`); `getVoices()` is empty at
   startup (first line waits ≤1.5 s via `ctl.voicesGraceUntil` instead of
   opening with the wrong voice).
7. **Pacing:** local rate = `computeUtteranceRate` with calibrated
   `localWps` (EMA from real utterances, reset on voice change) and
   `prevRate` smoothing; never below the user's base. Cloud rate fits
   the MP3's real `duration` to the slot, clamped ≤1.35, only half the
   user's rate preference. QUEUED lines that start >0.8 s late compress
   against remaining time; direct lines keep their full window.
8. **autoPause debts are honoured**: `hardStopSpeech` resumes the video
   it auto-paused (guarded by active/!ended). No path may strand the
   user's video paused.

## Harness pins (tests/integration) — do not break

- `run-progressive.js` pins the DUCK TIMELINE: some sample < 0.5 during
  the dialog AND the last sample ≥ 0.85 after it, plus instant restore
  on teardown. It also pins exactly-once speech and no partial versions.
- `run-roll.js` pins `|u.rate − 1.5| < 0.35` at base 1.0 ×1.5 playback:
  direct lines must NOT compress against remaining time (that's what
  broke it once), and the `base×1.25` catch-up cap must stay.
- `run.js` pins strict order, zero duplicates, and that
  `speechSynthesis.cancel()` fires only when we were speaking.
- All stubs: no `pause`/`resume` on speechSynthesis (guard with typeof),
  no `onstart` events (stats fall back to call-time), non-empty
  `getVoices()` (the voices-grace path is real-world only).

## Gates

```bash
pnpm build:chrome
node --test packages/core/test/*.test.js
node tests/integration/run-all.js
pnpm lint:firefox
```
