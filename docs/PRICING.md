# Voxylio — Free/Pro positioning (decision record)

Owner decisions locked on 2026-08-25. This is the reference for every
pricing, paywall or entitlement change — copy on the site, gating in the
extension, and the backend capability design all follow this document.

## The rule

**Free = understand a video on the big platforms. Pro = every site, a
clearly better translation, and the video turned into exploitable
content.**

Never charge for basic controls, never degrade the free experience ON
ITS OWN GROUND (the big platforms) to push upgrades. Local dubbing is
the adoption engine — its marginal cost is ~zero and it is what makes
users experience the product's value. SUPERSEDED IN PART (2026-08-26):
"never restrict what costs us nothing" no longer holds — free is scoped
to YouTube, Netflix, Prime Video, Disney+ and Twitch after a 3-day full
trial; the convenience of the packaged product is the paid surface, the
MIT code remains the escape hatch. See « Owner update » below.

## Owner overrides (differ from the advisory notes this is based on)

1. **No free AI trial.** The free plan includes no cloud minutes at all.
   The free tier is already a strong product; Pro quality is demonstrated
   with a **pre-rendered comparison demo on the website** (same clip:
   local translation/voice vs Pro translation/voice) — costs nothing per
   user, still lets people hear the difference before paying.
2. **The account stays mandatory for everything**, free plan included.
   (Google sign-in gates dubbing; this is already shipped.)
3. **Two plans only** — Free and Pro. No third tier before real usage
   data. Add-on packs (extra cloud hours) may come later, after the cost
   per cloud hour is known. Never promise "unlimited cloud".

## The split

| Feature | Free | Pro |
|---|---|---|
| Subtitle-based dubbing (incl. DOM captions: YouTube, Netflix…) | Unlimited | Unlimited |
| Chrome local translation | Yes | Yes |
| System voices, per-language voice choice | Yes | Yes |
| All sites, all 71 languages | Yes | Yes |
| Volume / speed / subtitles / mixer controls | Yes | Yes |
| Local history + transcripts | Last ~40 sessions (current cap) | Unlimited + synced (later) |
| SRT/TXT export | Yes | Yes (adds Markdown/PDF later) |
| Google account required | Yes | Yes |
| Context-aware cloud translation | No | Yes, monthly quota |
| Natural neural cloud voices | No | Yes, monthly quota |
| Dubbing without subtitle track (audio transcription) | No | Later, hard quota |
| Summaries, chapters, Q&A on the transcript | No | Yes |
| Custom glossaries | One simple local glossary | Several, synced |
| Cross-device history sync | No | Yes |
| Priority support | No | Yes |

Prices: **$7.99/mo, $69.99/yr (−27%)** — both configured in Polar.
Add-on packs come later and their prices are NOT published until the
real cost per cloud hour is measured (see "Two meters" below); the cloud
budget per subscriber should average ≈ $2/mo to protect margin.

## Two meters, never one bare "cloud" number

"Cloud" is not one thing and must never be sold as one:

- **Contextual AI translation** (text only) — cheap per call. Metered
  **in characters** with a generous monthly allowance (shipped:
  `pro_usage.chars`, default 1.5M). Never expressed in "hours".
- **Premium Audio** (future) — transcription of no-subtitle videos +
  neural voices. The EXPENSIVE meter, **in minutes**, with warnings at
  80% and 100% of the allowance. Add-on packs (non-renewing, 12-month
  validity) apply to this meter only. Do NOT advertise "X hours
  included" anywhere until this pipeline exists and its real cost is
  measured — pack prices follow `price ≥ cost/h ÷ cloud-budget-share`.

Accounts, entitlements checks and payments are cloud too but are never
metered against the user.

## How the offer is worded (site copy rules)

Never "$7.99 for N hours" — that reads as "the extension stops after N
hours". Always: **unlimited local dubbing** + what Pro adds, with the
fallback promise spelled out ("when an allowance runs out, dubbing
continues free with the local engine"). Marketing vocabulary: "doublage
local", "traduction IA contextuelle", "Audio Premium", "synchronisation
du compte" — never bare "cloud" as a selling word; users buy a result,
not infrastructure.

Yearly plan: when Premium Audio ships, prefer the **flexible pool**
(e.g. N hours credited for the whole year, spend freely) over
monthly-expiring hours; decide with real data.

## Measure during beta before fixing any quota publicly

Cost per transcription minute, per voice minute, per translated
character; average consumption; % of users hitting the cap; cost of the
top-10% heaviest users. Launch quotas as "beta, may evolve", then fix.

## The chosen stack (owner decision, 2026-08-25)

- **Deepgram Nova-3** hears: streaming STT for no-subtitle videos only
  (≈ $0.0048–0.0058/min streaming ⇒ ≈ $0.35/h).
- **Gemini Flash-Lite** translates: contextual text-to-text (cheap;
  `VOXYLIO_GEMINI_API_KEY`, default model `gemini-3.5-flash-lite`) — SHIPPED as
  the primary provider of `/api/pro/translate`.
- **Google Cloud TTS Neural2** speaks: ≈ $16/1M chars ⇒ ≈ $0.80–0.95/h
  of spoken video. Cartesia/ElevenLabs stay optional upsells for later.
- **Voxylio** groups, caches, meters and syncs.

Estimated full-chain cost: ≈ $1–1.25/h with subtitles, ≈ $1.30–1.60/h
without. Cloud budget target stays ≈ $2/subscriber/month on average.

### Premium Audio quotas at launch (publish ONLY when the pipeline ships)

- Monthly $7.99 → **60 min/month** of Premium Audio (transcription +
  neural voice; contextual TEXT translation stays on its own generous
  character meter and does not consume these minutes).
- Yearly $69.99 → **12 h pool for the whole year**, spend freely, no
  monthly expiry.
- Keys are NEVER in the extension; the backend can mint short-lived
  Deepgram tokens if direct streaming is ever needed.

## Owner update (2026-08-26) — repositioning in progress

Three decisions taken in conversation, recorded here so the copy and
the code never drift from them:

1. **Contextual translation is labeled « (bêta) » EVERYWHERE** until
   its quality is judged stable by the owner: popup toggle + tooltip +
   banner + status line + quota meter labels (extension, 10 locales),
   pricing card + pricing modal + FAQ + changelog + account meters
   (site, 10 locales), store descriptions (docs/STORE-LISTING.md,
   10 languages). Done on 2026-08-26. Removing the label is an owner
   decision, and requires sweeping the exact same list.
2. **The free plan is tightened — mechanism CHOSEN (2026-08-26,
   shipped in v1.8.0).** Rationale: the packaged product (store build,
   account, updates) is the convenience; the code is MIT — whoever
   refuses to pay can clone and run it locally. The split:
   - **3-day full trial** for every account, every site unlocked.
     Starts at the FIRST authenticated `/api/entitlements` call after
     the feature deployed (`entitlement.trialStartedAt`), so existing
     accounts get their full window too. No card, nothing auto-charged.
   - **Free after the trial** = unlimited on-device dubbing on the big
     platforms ONLY: YouTube, Netflix, Prime Video, Disney+, Twitch
     (`packages/core/src/plan.js` — the single source of truth).
   - **Pro** = every site the engine supports (course platforms
     included) + the cloud features.
   - Enforcement is client-side (`planGate` in the content script) and
     FAILS OPEN when the server sent no `trialEndsAt` — a rollout
     ordering issue must never lock users out. Cloners bypass it; per
     the rationale above, that is accepted.
   - Copy swept on 2026-08-26 (same discipline as the beta labels):
     hero tick, pricing subtitle + both cards + modal, compare table,
     FAQ (cost/sites/pro + new trial item), store listing summaries +
     descriptions ×10, changelog 1.8.0 ×10.
3. **The neural voice is NOT the Pro seller** (owner's own judgment:
   « pas si convaincante »). Consequence: the conversion story must not
   lean on it. Pillar #3 (no-subtitle dubbing / Premium Audio) is the
   real differentiator to build next; meanwhile the pitch leans on
   convenience + quotas + early access.

Refund doctrine (usage-based partial refunds, always net-positive) is
recorded in docs/BOOSTS.md §4.

## The three Pro pillars (build in this order)

1. **Context-aware translation** — translate a sliding window of
   neighbouring subtitles instead of isolated sentences: pronouns, tone,
   register, proper nouns, terminology, idioms. Audibly better on the
   first video. This is the flagship.
2. **Neural cloud voices** — several styles, better prosody; speaker
   timbre preservation much later.
3. **No-subtitle dubbing** — audio → transcription → contextual
   translation → voice, hard-metered (real cloud cost).

Summaries, glossaries and sync reinforce the subscription; they never
replace the three pillars.

## Entitlements architecture (implement with pillar #1, not before)

The extension must never decide locally that a user is Pro — it renders
what the backend returns. `/api/entitlements` grows from `{plan, status}`
to independent capabilities + remaining quota:

```json
{
  "plan": "pro",
  "status": "active",
  "email": "…",
  "caps": {
    "contextual_translation": true,
    "cloud_voices": true,
    "audio_transcription": false,
    "ai_summary": true,
    "cloud_sync": true
  },
  "cloudSecondsRemaining": 36000
}
```

Metering — cloud calls only, local costs nothing:

1. extension asks the Voxylio backend for a session;
2. backend checks plan + remaining quota;
3. backend calls the AI provider (**provider keys live server-side only,
   never in the extension**);
4. backend records the seconds/characters actually consumed;
5. result returns to the extension.

## Quota-exhaustion UX (non-negotiable)

Never interrupt a video. Warn before the quota runs out; fall back
automatically to the local engine; say plainly "dubbing continues free in
local mode"; offer a pack without blocking anything.

## Minimal telemetry (with pillar #1, transparent, opt-in where required)

Only what pricing decisions need: dubbing activations, cloud usage,
quota exhaustion, most-used Pro feature, trial-free conversion (site
demo → checkout), cancellations. Nothing about watched content beyond
what the user already stores locally.
