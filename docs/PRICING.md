# Voxylio — Free/Pro positioning (decision record)

Owner decisions locked on 2026-08-25. This is the reference for every
pricing, paywall or entitlement change — copy on the site, gating in the
extension, and the backend capability design all follow this document.

## The rule

**Free = understand a video. Pro = a clearly better translation, and the
video turned into exploitable content.**

Never charge for basic controls, never degrade the free experience to
push upgrades, never restrict what costs us nothing. Local dubbing is the
adoption engine — its marginal cost is ~zero and it is what makes users
experience the product's value.

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

Prices stay as shipped: **$7.99/mo, $59.99/yr (−37%)**, Polar billing.
Later add-on packs (indicative): +5 h ≈ $4.99, +15 h ≈ $9.99,
+40 h ≈ $19.99.

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
