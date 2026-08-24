# Voxylio — Multi-platform implementation plan

Executable blueprint for taking the shared engine to Chrome (publishable),
Edge, Firefox, Safari, a native macOS app, and the release infrastructure.
Written to be coded from directly: every step names its files, commands and
exit criteria. Follow the working conventions in
`.claude/skills/voxylio-dev/SKILL.md`.

Legend: ☐ todo · ⚙ partially done · ✅ done · 🔶 OWNER DECISION required
before implementing (per the porting plan §19).

---

## 0. Current state (baseline)

✅ Phase 0-1 of the porting plan are complete:

- pnpm workspace; engine extracted to `packages/core` (19 unit tests);
  `packages/webext` adapter; `apps/chrome` builds into `/extension`;
  3 Playwright integration harnesses pass against the built bundle.
- `apps/edge` and `apps/firefox` build from the same sources with injected
  manifests; `addons-linter` on the Firefox dist: 0 errors.
- `apps/safari/convert.sh` generates the Xcode project on macOS.
- Site (Next.js, `/en` `/fr`), privacy page, Chrome Web Store kit
  (`extension/STORE.md`), store screenshots, OG/robots/sitemap.

Known limits: `docs/LIMITATIONS.md`. Nothing is published anywhere yet.

✅ **Repetition bug fixed** (progressive/sliding captions spoke partial
sentences repeatedly): groups now carry a stable text-independent `id` +
`version`, the trailing group is a `draft` finalized by text stability
(350 ms when punctuated / 650 ms otherwise), speech is gated by
`spokenIds`/`scheduledIds`/`inFlight` registries and a `generation`
counter voids stale translations after seek/language/track changes;
`mergeRollup` stitches sliding-window overlaps. Regression suite:
`tests/integration/run-progressive.js` (fails on the pre-fix engine with
the exact symptoms heard on real videos). Contextual translation
(previous/next sentences, domain) remains workstream A2/§8-9 of the
diagnostic — planned, not started.

---

## 1. Workstream A — Chrome publishable (porting plan phase 2)

### A1. Options page + settings plumbing  ☐

The popup is full; provider keys and per-site controls need a real options
page.

| Item | Detail |
| --- | --- |
| Files | `apps/chrome/static/options.html`, `apps/chrome/src/options.js`, manifest `options_ui: { page: "options.html", open_in_tab: true }` |
| Content | translation provider picker (A2), API key field (stored in `storage.local`, NEVER `sync`), per-site allow/deny list (A3), export/import settings JSON, link to privacy page |
| Build | add `options.js` to the entry list in `packages/build-tools` callers |
| Tests | unit-test settings schema migration in core (`packages/core/src/settings.js` — new module: defaults, validate, migrate) |
| Exit | options page functional in Chrome; `pnpm test` green |

### A2. Translation provider abstraction  ⚙ (engine hook exists) 🔶

Replace the hardcoded chain (builtin → gtx) with providers.

1. `packages/core/src/translation.js`: `createTranslatorChain(providers)` —
   pure orchestration (timeout, fallback order, per-pair isolation, the
   existing glossary protection wraps every provider). Move
   `translateOnce`'s logic here; content.js keeps only wiring.
2. Providers (each ~40 lines, in `packages/webext/src/providers/`):
   - `builtin.js` — Chrome Translator API (exists);
   - `gtx.js` — current unofficial endpoint, labeled *best-effort, may
     break, no SLA* in the options UI;
   - `deepl.js` — official API, user-supplied key, `api-free.deepl.com`
     `/v2/translate`, quota surfaced in options;
   - `googlev2.js` — official Cloud Translation, user key.
3. Per-platform default order lives in each app's build (manifest-injected
   `platform.json` or a build-time define): Chrome = builtin→fallback;
   Firefox/Safari = provider→fallback (no builtin).
4. 🔶 OWNER: which paid provider(s) to support first, and whether a hosted
   proxy (your key, your billing) is ever offered. Default until decided:
   builtin + gtx + BYO-key DeepL, strict-local mode unchanged.

Exit: unit tests for chain ordering/timeouts with mock providers; the three
integration harnesses still pass with the chain in place.

### A3. Permission minimization  ☐ 🔶

Today: `<all_urls>` content script (simple, but slows review and scares
users).

Target model (keeps UX acceptable):

1. Keep `<all_urls>` in `host_permissions` but make it **optional**:
   manifest `optional_host_permissions: ["<all_urls>"]`, content script
   registered dynamically via `chrome.scripting.registerContentScripts`
   once granted (new `background.js` responsibility; adapter gains
   `scripting`).
2. First-run onboarding page (`onboarding.html`) explains and requests
   either all-sites or per-site access; popup shows a "enable on this
   site" button when not granted (uses `activeTab` + `permissions.request`
   with origin pattern).
3. 🔶 OWNER: all-sites-by-default (one review friction, zero user friction)
   vs per-site-by-default (privacy story, extra click per site). Plan
   implements the mechanism either way; the default is a flag.

Exit: extension works with zero host permissions until granted; regression
harnesses adapted (grant simulated); store listing justification updated.

### A4. Extension UI i18n  ☐

`_locales/{fr,en}/messages.json` + `__MSG_*__` in manifest name/description
+ a tiny `t()` helper in popup/options (`chrome.i18n.getMessage`). French
stays the source of truth; English translation of all popup/overlay/caption
strings. Exit: `chrome://extensions` shows localized name; popup renders in
the browser language.

### A5. Beta release  ☐ (manual, never automated)

`pnpm release:chrome` script → builds, bumps version from
`apps/chrome/static/manifest.json`, zips `/extension` (excluding *.md) to
`dist-store/voxylio-chrome-<version>.zip`. Owner uploads, review notes from
`extension/STORE.md`. Exit: listed as beta/unlisted, install/uninstall
documented in README.

---

## 2. Workstream B — Edge (phase 3)

Code: ✅ `apps/edge` builds (Chromium parity, injected manifest).

1. ☐ Validate Chrome's built-in Translator availability in Edge (it ships
   Chromium but Edge gates some on-device AI). Test manually on Edge ≥ 130:
   if absent, Edge's provider order = same as Firefox. One-line change in
   the platform defaults (A2.3).
2. ☐ Store: Microsoft Partner Center account (free), listing reuses
   `STORE.md` texts, package = zip of `apps/edge/dist`.
3. ☐ Add `pnpm release:edge` (same script, different dir/name).

Exit: Edge beta listed; capability check documented in LIMITATIONS.md.

---

## 3. Workstream C — Firefox (phase 4)

Code: ⚙ builds + lints clean (0 errors, 2 advisory warnings).

1. ☐ Runtime validation on real Firefox (the container cannot run Gecko —
   do this on the Mac): `pnpm build:firefox && pnpm dlx web-ext run
   --source-dir apps/firefox/dist`. Walk the manual matrix: detection,
   dubbing via fallback provider, pause/seek/speed, overlay, captions,
   popup states.
2. ☐ Fix the `innerHTML` linter warning properly: rewrite
   `statusHTML()` to DOM building (`popup.js` — createElement/textContent),
   which also hardens against any future interpolation mistake.
3. ☐ Background event-page audit: our background only serves fetch
   translation calls — stateless, safe to suspend. Verify `runtime.onMessage`
   wakes it (it does per MDN; confirm on-device).
4. ☐ AMO submission: bundled code requires **source upload** — add
   `pnpm release:firefox` producing both `voxylio-firefox-<v>.zip` (dist)
   and `voxylio-source-<v>.zip` (repo snapshot minus node_modules) plus
   `docs/BUILDING.md` with exact reproduction commands (AMO reviewers
   rebuild).
5. Speech caveat to verify: Firefox desktop `speechSynthesis` voice list
   differs per OS; the no-voice popup state must trigger correctly.

Exit: side-loaded beta passes the matrix; AMO unlisted beta signed.

---

## 4. Workstream D — Safari (phase 5)

Code: ⚙ converter script ready; project generated on the Mac via
`./apps/safari/convert.sh` (Xcode ≥ 15).

1. ☐ Generate + run once; fix converter warnings (it reports unsupported
   manifest keys; expected: none blocking for MV3 basic set).
2. ☐ Platform capabilities in the adapter: `storage.sync` → behaves local;
   no builtin Translator → provider order (A2.3); verify
   `speechSynthesis` voices exposure inside Safari content scripts (known
   good on macOS 14+, verify rate behavior).
3. ☐ Per-site permission onboarding (Safari always per-site): reuse the A3
   onboarding page; add Safari-specific copy ("enable in Safari Settings ▸
   Extensions").
4. ☐ Distribution 🔶 OWNER: needs Apple Developer Program (99 $/yr) —
   TestFlight beta (Mac App Store channel) vs notarized direct download.
   Recommendation: Mac App Store channel; the wrapper app is trivial and
   sandbox-compatible (the extension does no native work).
5. ☐ Commit policy for the generated Xcode project: keep gitignored,
   regenerate on demand; commit only if we start customizing the wrapper
   (onboarding screen inside the app → then commit and stop regenerating).

Exit: extension runs in Safari on the owner's Mac through the full manual
matrix; beta distributed via chosen channel.

---

## 5. Workstream E — macOS native app (phase 6)

Purpose: dub videos **without accessible subtitles** — the premium track —
by capturing app audio, transcribing, translating, speaking. All prior
workstreams stay subtitle-based and free.

Existing reference: `~/Desktop/LN/Perso/Roster` (owner's shipped macOS app)
— reuse its project conventions (SwiftUI structure, signing setup, CI
lanes) where they fit.

### E0. Proofs before product (hard gates, in order)

| Proof | Spec | Acceptance |
| --- | --- | --- |
| P1 capture | ScreenCaptureKit `SCStream` with audio-only filter on one chosen app (macOS 13+); fallback/alternative: Core Audio process tap (`AudioHardwareCreateProcessTap`, macOS 14.2+) | 10 min of Chrome audio captured to PCM buffers, < 5 % CPU, no drops |
| P2 transcription | Bench harness comparing **Speech.framework `SFSpeechRecognizer`** (on-device, free) vs **WhisperKit** (small/base models) on 3 fixture videos (clear EN course, fast EN, FR) | table: WER, median latency per finalized segment, CPU/RAM; pick default |
| P3 translation | **Apple Translation framework** `TranslationSession` (macOS 15+, on-device, free) EN↔FR/ES/DE/IT/PT; fallback: provider chain from A2 via URLSession | correct sentence-level output, availability matrix per language pair |
| P4 voice + duck | `AVSpeechSynthesizer` (incl. Personal Voice where authorized) + output device routing; duck the source app via the process tap gain (P1 alt path) or system volume compromise | dubbed voice over ducked original, A/B recording |

Each proof is a small Xcode target in `apps/macos/Proofs/` with a README
of measured numbers. No orchestrator work before P1-P4 are green.
🔶 OWNER before P3/P4 productization: minimum macOS version (15 for
on-device translation vs 13 + cloud provider), and WhisperKit model
download UX (bundled vs first-run download).

### E1. Engine parity in Swift

Port ONLY the pure pipeline pieces the native app needs — grouping, pacing,
glossary — as `VoxylioKit` (Swift package in `apps/macos/VoxylioKit`).
Parity is enforced by **shared test vectors**: add
`packages/core/scripts/export-vectors.mjs` dumping JSON fixtures
(input cues → expected groups; pacing inputs → expected rate; glossary
in/out) consumed by both `node:test` and `swift test`. A behavior change
must update the vectors once, both sides follow.

### E2. Orchestrator

State machine mirroring the content script's controller (idle → capturing →
transcribing (partial/final segments) → translating → speaking; bounded
queue, stale-segment skip, auto-pause impossible → instead adaptive delay
target ~2 s). AsyncStream-based pipeline; every stage cancellable.

### E3. App shell

Menu-bar SwiftUI app: app picker (running apps with audio), language pair,
voice picker + preview, original volume slider, live status (state machine
surfaced verbatim, like the popup), diagnostics copy. Permissions flow:
Screen Recording TCC prompt with explainer; Speech recognition
authorization if SFSpeechRecognizer chosen.

### E4. Distribution

Developer ID signing + `notarytool` notarization + DMG; Sparkle for
updates. Mac App Store later only if the capture entitlements allow it
(screen/audio capture is generally NOT sandboxable → assume direct
distribution). 🔶 OWNER: pricing/licensing for this premium app.

Exit (per porting plan §18): full manual matrix incl. multi-app audio,
volume restore on crash (audit the tap teardown path), bounded everything,
no secret in the binary.

---

## 6. Workstream F — Release infrastructure & site

1. ☐ CI (GitHub Actions, `.github/workflows/ci.yml`): on PR/push —
   `pnpm install`, `build:extensions`, `test:unit`, `test:integration`
   (ubuntu + Playwright chromium), `lint:firefox`, site build. Cache pnpm.
2. ☐ Manifest validation step: JSON schema check for every dist manifest
   (`packages/build-tools/src/validate.js`, run in CI).
3. ☐ Release scripts (`scripts/release.mjs`): version bump across
   manifests (single source: `apps/chrome/static/manifest.json`), tag,
   build all dists, produce `dist-store/*.zip` artifacts. **No workflow
   ever uploads to a store** — owner uploads manually (porting plan §16).
4. ☐ Site: download section with per-browser store badges (hidden until
   each listing is live; flag file `site/src/lib/stores.ts` with URLs),
   compatibility matrix page fed by `docs/compat.json` (filled by the
   manual matrix runs), swap the install-from-GitHub steps for store CTAs
   as they publish.
5. ☐ Typecheck: the engine is plain JS — add JSDoc types + `tsc --noEmit
   --checkJs` over `packages/` as the "typecheck" CI lane (no TS rewrite).

---

## 7. Test strategy (all platforms)

- **Unit (fast, everywhere):** `packages/core` node:test — grows with every
  engine change; Swift mirrors via shared vectors (E1).
- **Integration (headless Chromium):** the three harnesses + planned
  additions: translation-chain failure/timeout, permission-gated injection
  (A3), options round-trip.
- **Manual matrix (per platform, before each beta):** Udemy, Coursera,
  Teachable, Thinkific, Kajabi, Vimeo, Mux player, YouTube, two standalone
  HTML5 players; scenarios: enable, dub 2 min, pause/resume, seek ±, ×1.5,
  language switch mid-video, volume touch, multi-video page, SPA
  navigation. Record results in `docs/compat.json` (renders on the site).
- **Never claim** an API works on a platform without a run on that
  platform (porting plan §19) — the checklists above are the proof trail.

## 8. Sequencing & effort

```
A1 options (M) ─┐
A2 providers (M)─┼─→ A3 permissions (M) → A4 i18n (S) → A5 Chrome beta (S)
                │
B Edge (S) ─────┘         (B publishable as soon as A2 defaults land)
C Firefox runtime+AMO (M) — after A2 (needs provider order)
D Safari (M, Mac-local)   — after A2; independent of A3/A4
E macOS proofs P1-P4 (L)  — parallel track, gated by owner decisions
F CI + release scripts (S)— immediately, protects everything else
```

S ≈ half-day, M ≈ 1-2 days, L ≈ 1-2 weeks of focused work.
Recommended order: **F → A2 → A1 → A3 → A5 → B → C → D → E**.

## 9. Owner decision log (blockers marked 🔶 above)

| # | Decision | Options | Default until decided |
| --- | --- | --- | --- |
| 1 | Paid translation provider | DeepL BYO-key / Google BYO-key / hosted proxy | BYO-key DeepL |
| 2 | Host permissions default | all-sites / per-site | mechanism built, flag |
| 3 | Apple Developer Program | join now (Safari+macOS) / postpone | postpone blocks D4/E |
| 4 | Safari channel | App Store / TestFlight-only | App Store |
| 5 | macOS minimum | 15 (on-device translation) / 13 + cloud | 15 |
| 6 | macOS app pricing | free beta → paid / paid from day 1 | free beta |
| 7 | Telemetry | none / opt-in error counter | none |
