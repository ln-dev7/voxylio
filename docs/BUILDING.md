# Building Voxylio from source (reviewer instructions)

This archive is the complete monorepo. The Firefox package uploaded to
AMO is the byte-for-byte output of the steps below — no remote code is
downloaded at build time or at runtime.

## Prerequisites

- Node.js ≥ 20 (built and tested with Node 22)
- pnpm 10 (`corepack enable` honors the pinned `packageManager`:
  pnpm@10.28.0)

## Build the Firefox add-on

```bash
pnpm install
pnpm build:firefox        # output: apps/firefox/dist/
```

`apps/firefox/dist/` matches the content of the uploaded add-on ZIP
(`node scripts/release.mjs firefox` is what zips it into
`dist-store/voxylio-firefox-<version>.zip`).

## What the build does

- `apps/firefox/build.mjs` bundles the shared engine
  (`packages/core`, `packages/webext`) and the extension sources
  (`apps/chrome/src`) with **esbuild** (the only transform — no
  obfuscation), copies the static pages, and rewrites the manifest for
  Firefox: `background.scripts`, `browser_specific_settings.gecko`
  (id `voxylio@lndev.me`, `strict_min_version` 140,
  `data_collection_permissions: { required: ["none"] }`).
- Third-party code: none is bundled besides the npm dependencies listed
  in the workspace `package.json` files (esbuild and Playwright are
  dev-only). The extension calls no analytics and loads no remote
  scripts.

## Verify

```bash
pnpm test:unit            # engine unit tests (node:test)
pnpm lint:firefox         # addons-linter on apps/firefox/dist
```

Other targets, for reference: `pnpm build:chrome` → `/extension`
(Chrome artifact, committed), `pnpm build:edge` → `apps/edge/dist`.
