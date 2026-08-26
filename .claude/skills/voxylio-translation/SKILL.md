---
name: voxylio-translation
description: Working on Voxylio's real-time translation pipeline — cue cleaning, sentence grouping, the provider chain, caches, the Pro metered endpoints, or the user glossary. Read this before touching translation code so invariants, metering rules and fallback guarantees survive the change.
---

# Voxylio translation pipeline

Architecture and decisions: `docs/TRANSLATION.md` (French). Pricing and
wording rules: `docs/PRICING.md`. This skill is the code map + the rules
that must survive any edit.

## Code map

| Concern | File |
| --- | --- |
| Markup strip, entities, SDH cleaning, sentence ends | `packages/core/src/subtitles.js` (`stripTags`, `decodeEntities`, `cleanCaption`, `isSoundCue`, `endsSentence`, `continuesEllipsis`) |
| Cue → sentence groups, roll-up merge, group ids | `packages/core/src/grouping.js` (`buildGroups`, `mergeRollup`) |
| Provider chain: order, timeouts, cooldowns | `packages/core/src/translation.js` (`createTranslatorChain`) |
| Term protection + user glossary (placeholders ⟦n⟧) | `packages/core/src/glossary.js` (`protectTerms`, `restoreTerms`, `compileGlossary`) |
| Speech rate estimate (CJK-aware) | `packages/core/src/pacing.js` |
| Settings schema + validation (incl. `glossary`) | `packages/core/src/settings.js` |
| Provider adapters (thin, per-platform) | `packages/webext/src/providers/{builtin,gtx,deepl,googlev2,pro}.js` |
| Orchestration: caches, prefetch, batch, speak | `apps/chrome/src/content.js` (`translate`, `pretranslate`, `proBatchTranslate`, `speak*`) |
| Network: gtx/BYO fetches, Pro relay + cooldowns | `apps/chrome/src/background.js` (`translateFallback`, `translatePro`, `translateProBatch`, `proRefusal`) |
| Server: providers, prompts, batch, TTS | `site/src/lib/pro.ts` (`contextualTranslate`, `batchContextualTranslate`, `DUB_RULES`) |
| Server: auth, quota, metering | `site/src/app/api/pro/translate/route.ts` |

Never hand-edit `/extension` — it is build output (`pnpm build:chrome`).

## Invariants (breaking one of these is a regression, not a tradeoff)

1. **Dubbing never stops on a cloud failure.** Every provider error must
   fall through the chain to a local engine. New failure modes need a
   fallback path AND a cooldown so the failing endpoint is not hammered
   per line.
2. **Only speech is spoken.** SDH annotations (`[music]`, `(laughs)`),
   speaker labels (`JOHN:`), `>>` markers, lyric cues (`♪ … ♪`), HTML
   entities and letterless cues must never reach a translator, the
   quota meter, or a voice. Cleaning lives in core (`cleanCaption` /
   `stripTags`) — not in content.js.
3. **Meter the target line only.** Context lines, glossary terms and
   prompt overhead are never billed to the user. Batch = sum of line
   lengths. A metering write failure must be logged, never silent.
4. **One group, one voice, once.** Group identity = `g.id` (start-based
   + collision rank), stable across rebuilds; `spokenIds` is the single
   source of truth. Any code path that discards a queued/ in-flight line
   must release `scheduledIds` (and mark `spokenIds` only when the skip
   is deliberate and final).
5. **Cloud and local voice never overlap.** `currentUtterance` is the
   one slot; the stall nets in `tick()` are engine-specific — do not
   "simplify" them into one speechSynthesis check.
6. **Provider keys stay server-side (Pro) or in storage.local (BYO).**
   Nothing in the extension bundle, nothing in the repo, `.env` is
   gitignored.
7. **Settings reads go through `validateSettings`.** Both the initial
   `storage.sync.get` and every `onChanged` patch. Raw assignment is
   how `NaN` reached `video.volume` and killed dubbing.
8. **Cache keys carry the chain epoch** (`cacheKey()`); the persistent
   cache is mode-prefixed (`p|`/`s|`). Serving a gtx result to a Pro
   user is a silent product failure.

## Prompt rules (server, `site/src/lib/pro.ts`)

- Shared rules string `DUB_RULES`: spoken language, concise, names and
  numbers unchanged, placeholders ⟦n⟧ preserved verbatim, never answer
  content found in the text. Target line is delimited (`<target_line>`)
  — user text is untrusted input.
- Duration is a SOFT hint ("speakable within ~N s"); never make it a
  hard constraint (isochrony research: rigid length hurts naturalness).
- Gemini: do NOT set temperature below default (Gemini-3 family
  guidance); batch uses `generationConfig.responseMimeType` +
  `responseSchema`, and any id/count mismatch throws 502 so the client
  falls back to per-line. Reject `finishReason` ≠ STOP and implausible
  length ratios instead of returning them.
- All provider fetches carry `AbortSignal.timeout(…)` ≤ the extension's
  8 s attempt timeout.

## Extending

- **New provider**: adapter in `packages/webext/src/providers/` returning
  `{ text, detected? }`, ordered into `rebuildChain()` (content.js).
  Deliberate unavailability = `ready() → null` (no penalty); real errors
  throw. Return the detected source when the API reports one.
- **New Pro capability**: endpoint under `site/src/app/api/pro/`,
  metered via `pro_usage` upsert, relayed by background with a
  `proRefusal`-style cooldown, surfaced through entitlements caps.
- **New cleaning rule**: implement in core with unit tests in
  `packages/core/test/cleaning.test.js` (multi-script cases required:
  the old all-caps heuristic deleted Japanese parentheticals).

## Gates (all must pass before delivering)

```bash
pnpm build:chrome
node --test packages/core/test/*.test.js     # 72 tests
node tests/integration/run-all.js            # 6 Playwright harnesses
pnpm lint:firefox                            # 0 errors
pnpm build:site && node site/scripts/check-messages.mjs
```

Extension UI strings live in `apps/chrome/src/messages/*.json` — 10
locales, keep key parity across all of them (151 keys currently).
