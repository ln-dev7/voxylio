---
name: voxylio-dev
description: Working conventions for the Voxylio monorepo — build/test commands, shared-engine architecture rules, platform adapters, commit style, and the sync workflow. Load before ANY code change in this repository.
---

# Voxylio development conventions

## What this product is

Voxylio dubs subtitled videos in real time inside the browser: it reads the
player's subtitle track, rebuilds full sentences, translates them (Chrome
built-in local API first, online fallback second), and speaks over the video
in sync. One video at a time, bounded queues, never a stale sentence.

## Architecture rules (non-negotiable)

- **The engine is shared.** All pure logic (subtitle parsing, sentence
  grouping/rollup, glossary protection, bounded cache, pacing, voice
  scoring) lives in `packages/core` with unit tests. NEVER duplicate engine
  logic inside a platform app.
- **Platforms are adapters.** Browser API access goes through
  `packages/webext` only. A new platform = a new adapter + a manifest
  transform in its `apps/<platform>/build.mjs` — zero engine edits.
- `/extension` is **generated** by `pnpm build:chrome` (it is the
  load-unpacked folder and the Chrome Web Store zip source). Never edit its
  `.js` files; edit `apps/chrome/src` + `packages/core` and rebuild.
- Behavior changes require updating the characterization tests, not
  weakening them. If a test contradicts the POC's actual behavior, fix the
  test and document why (see the pickVoice tie-break example).

## Commands

```bash
pnpm install                 # workspace root
pnpm build:chrome            # bundle engine -> /extension
pnpm build:extensions        # chrome + edge + firefox (dists in apps/*/dist)
pnpm test:unit               # node:test on packages/core
pnpm test:integration        # Playwright harnesses vs the BUILT bundle
pnpm lint:firefox            # addons-linter on apps/firefox/dist
pnpm --filter site build     # Next.js site (en/fr prerendered)
```

Integration tests need Chromium; set `CHROMIUM_PATH` if Playwright's own
browser is not installed. ALWAYS run build:chrome before test:integration.

## Non-regression gates (before any commit touching the engine)

1. `pnpm build:chrome` succeeds;
2. `pnpm test:unit` all green;
3. `pnpm test:integration` all green (language switch, fr→en source,
   roll-up + playbackRate);
4. the site still builds if `site/` or shared config changed.

## Conventions

- Code comments, READMEs and docs: **English**. Extension UI strings:
  French (i18n via `_locales` is a planned workstream). Site copy: both,
  via `site/messages/{en,fr}.json` (next-intl).
- Commits: small, conventional (`feat(core):`, `build(chrome):`,
  `fix(extension):`…), **author LN <leonelngoya@gmail.com>, never a
  co-author line**.
- Never publish to any store automatically — artifacts are prepared,
  publication is a manual owner action.
- Owner decisions required before implementing: cloud translation
  provider/billing, Apple distribution, any data collection.

## Key references in-repo

- `docs/IMPLEMENTATION_PLAN.md` — the executable multi-platform plan.
- `docs/LIMITATIONS.md` — honest current limits (keep it updated).
- `extension/STORE.md` — Chrome Web Store listing kit.
- `tests/integration/` — page+VTT fixtures and the three harnesses.

## Remote-session sync workflow (Claude cloud sessions only)

When working from a cloud sandbox with the user's Mac folder mounted at
`$HOME/mnt/Perso/voxylio`: the mounted FS forbids `unlink`, so git runs
against the external git dir `$HOME/vd.git` with
`GIT_DIR="$HOME/vd.git" GIT_WORK_TREE="$PWD"`, then `cp -R "$HOME/vd.git/."
.git/` syncs history into the folder (permission-denied on existing
immutable objects is normal). Ship changes as a tarball extracted with
`tar --overwrite`; move deletions into `../_to_delete/` (rename works,
deletion does not). Never let `core.worktree` leak into `.git/config`.

The user's working copy is ALWAYS current after a delivery: files and
commits land directly in the Mac repo. NEVER tell the user to `git
pull` — there is nothing to pull. The only manual step is `git push`
(needs the user's GitHub credentials).
