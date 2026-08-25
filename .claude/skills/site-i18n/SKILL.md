---
name: site-i18n
description: >-
  Translation workflow for the Voxylio site (next-intl). Use whenever
  site copy changes, a new locale is added, or messages files are
  touched — covers the key-parity guard, tone rules per language, and
  the exact files a locale lives in.
---

# Voxylio site translations

The site (Next.js + next-intl v4) ships in ten locales: `en` (the
reference), `zh-CN`, `zh-TW`, `ja`, `ko`, `fr`, `de`, `es`, `it`,
`pt-BR`. All copy lives in
`site/messages/<locale>.json` — components NEVER hardcode user-facing
strings.

## Invariants

1. **`en.json` is the schema.** Every locale must expose exactly its
   key tree — no missing keys, no extras. Enforced by
   `node site/scripts/check-messages.mjs` (script `i18n:check` in
   `site/package.json`). Run it after ANY messages change.
2. **Copy changes touch every locale in the same commit.** Never leave
   a locale behind with stale meaning; translate at the same time.
3. Keys are stable identifiers — renaming a key means updating every
   locale AND the components using it.

## Adding a locale

1. `site/src/i18n/routing.ts` — add the code to `locales` and its
   native name to `LOCALE_LABELS` (the shadcn Select shows endonyms).
2. Create `site/messages/<code>.json` by translating `en.json`
   (full file, same key order).
3. `pnpm --filter site i18n:check` then `pnpm --filter site build`
   (prerenders every locale; a missing key fails the build).
4. Do NOT touch `site/src/i18n/request.ts` — it resolves messages
   dynamically per locale.

## Translation rules

- Tone per language: FR vouvoie on the site (the extension UI tutoie);
  ES/IT use tú/tu, PT-BR uses você, DE uses "du"; JA/KO/ZH use the
  standard polite register; EN stays neutral-direct. Marketing stays
  concrete, never hype.
- The account requirement is part of the copy since v1.7: dubbing needs
  a Google sign-in (free plan included). Never reintroduce "no account"
  claims; the honest angle is "no card, no quota". Owner decision: never
  write "the free plan is enough" — it undersells Pro.
- Product terms NOT translated: Voxylio, Chrome, Chrome Web Store,
  GitHub, Pro, DeepL, Polar, shadow DOM, popup, MIT.
- Prices are in USD — the Polar product is USD-based, never advertise
  EUR. Local formatting: $7.99 (en/ja/ko/zh), 7,99 $ (fr/es/de/it),
  US$ 7,99 (pt-BR). Card figures live in `Pricing.price*` keys.
- "65+ languages" claims: keep in sync with
  `packages/core/src/languages.js` (currently 71 entries — the copy
  says "more than 65" on purpose; update everywhere at once if the
  claim changes).
- `<accent>…</accent>` in `Hero.title` is a rich-text tag — keep it
  wrapping the equivalent words, never translate the tag itself.
- `{date}` and other ICU placeholders must survive verbatim.

## Where language ALSO appears (outside messages)

- Extension UI strings: `apps/chrome/static/_locales/{fr,en}` (chrome
  i18n — separate system, French is the source of truth there).
- Store listing: `extension/STORE.md`.
- OG/meta: `Meta.*` keys per locale (title ≤ 60 chars, description
  ≤ 160 chars for clean SERP display).
