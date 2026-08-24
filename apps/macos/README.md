# Voxylio for macOS

Dubs the audio of **any running app** in your language — even without
subtitles (the premium track of the plan): per-app audio capture →
on-device transcription → on-device translation → synthesized voice over
the ducked original.

```
ProcessTap (Core Audio, muted at source)
   ├─→ PassthroughPlayer  (original replayed at the chosen volume = duck)
   └─→ Transcriber        (SFSpeechRecognizer, partial/final)
          └─→ Orchestrator (VoxylioKit grouping + stability heuristics)
                 └─→ TranslationBridge (Apple Translation → gtx fallback)
                        └─→ DubSpeaker (AVSpeechSynthesizer + pacing)
```

## Requirements

- macOS **15+** (on-device Translation framework; the tap itself needs 14.2+)
- Xcode 16+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`

## Build & run

```bash
cd apps/macos
xcodegen                 # generates Voxylio.xcodeproj from project.yml
open Voxylio.xcodeproj   # set your signing team once (Signing & Capabilities)
```

Run: a waveform icon appears in the menu bar. Pick the app to dub
(Chrome, VLC…), the language pair, press **Start dubbing**.

First-run permissions:

1. **System Audio Recording** — the process tap triggers the TCC prompt;
   if capture fails, check System Settings → Privacy & Security → Screen
   & System Audio Recording.
2. **Speech Recognition** — standard authorization prompt.
3. Translation models download on first use per language pair (Settings →
   General → Language & Region → Translation Languages).

## Engine parity (VoxylioKit)

The pure engine pieces (grouping, pacing, glossary) are a Swift package
in `VoxylioKit/`, ported from `packages/core` and locked to it by shared
test vectors:

```bash
# regenerate the vectors after ANY engine change in packages/core:
node packages/core/scripts/export-vectors.mjs

# JS side guard (runs in pnpm test:unit):   packages/core/test/vectors.test.js
# Swift side guard:
cd apps/macos/VoxylioKit && swift test
```

A behavior change updates the vectors once; both implementations must
pass against the same JSON.

## Proofs P1–P4

`docs/IMPLEMENTATION_PLAN.md` §E0 gates any further product work on four
measured proofs. The harness is embedded in the app (stethoscope icon);
record the numbers in `Proofs/README.md`.

## Honest status

This code was written off-device (no macOS toolchain in the authoring
environment): expect a handful of small compile fixes on first `xcodegen`
+ build — the architecture, API choices and engine parity are the
deliverable here. The generated `Voxylio.xcodeproj` stays out of git
(regenerate on demand); commit it only when the wrapper starts being
customized by hand.

## Distribution (later)

Developer ID signing + notarytool + DMG; Sparkle for updates. The Mac
App Store is out: audio capture entitlements are not sandbox-compatible.
Owner decision #6 (pricing) applies before any public beta.
