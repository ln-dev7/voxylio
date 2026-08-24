# macOS proofs P1–P4 — measurement log

The proof harness is embedded in the app (stethoscope icon in the
menu-bar popover) so every measurement runs the exact production code
path. Acceptance criteria: `docs/IMPLEMENTATION_PLAN.md` §E0.

Record the numbers here after each run on real hardware.

## P1 — per-app capture (Core Audio process tap)

Steps: play 10 minutes of a Chrome video, Start dubbing, watch
`P1 buffers` grow; monitor CPU in Activity Monitor.

| Date | Machine | Duration | Buffers | Drops (audio gaps) | CPU avg |
| ---- | ------- | -------- | ------- | ------------------ | ------- |
|      | M3      |          |         |                    |         |

Acceptance: 10 min captured, < 5 % CPU, no drops.

## P2 — transcription (SFSpeechRecognizer, on-device)

Steps: dub the three fixture videos (clear EN course, fast EN, FR);
compare `partials`/`finalized` flow and note WER on a 2-minute sample.

| Fixture | WER (sampled) | Median final latency | On-device? |
| ------- | ------------- | -------------------- | ---------- |
| clear EN |              |                      |            |
| fast EN  |              |                      |            |
| FR       |              |                      |            |

WhisperKit comparison is OPTIONAL (only if SFSpeech quality disappoints):
add the package, implement `Transcriber` behind the same interface, and
extend this table.

## P3 — translation availability (Apple Translation)

Run "P3: translation availability" in the proofs panel and paste the
matrix here. Pairs marked "supported" download their model on first use
(Settings → General → Language & Region → Translation Languages).

```
(paste matrix)
```

## P4 — voice + duck

Steps: dub with Original at 12 %, record the Mac's output (QuickTime),
A/B against Original at 100 %.

Notes:

- The tap MUTES the source app; Voxylio replays the original itself at
  the chosen level — teardown restores sound because the mute dies with
  the tap (verified by force-quitting the app mid-dub: check this!).

| Check | Result |
| ----- | ------ |
| Dub audible over ducked original |  |
| Original restored after Stop |  |
| Original restored after force-quit |  |
