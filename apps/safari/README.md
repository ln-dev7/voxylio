# Voxylio — Safari build

Safari web extensions are packaged inside a macOS/iOS app via Xcode, which
only runs on macOS — the conversion therefore happens on the developer's
Mac, not in CI. The extension code itself is the shared Chrome build: the
converter consumes `/extension` as-is.

## One-time conversion (on macOS, Xcode ≥ 15 installed)

```bash
pnpm build:chrome   # make sure /extension is fresh
./apps/safari/convert.sh
```

This generates the Xcode project under `apps/safari/Voxylio/` (gitignored
until we decide to commit it). Open it, select your team for signing, then
Run — Safari ▸ Settings ▸ Extensions shows Voxylio.

Safari specifics to verify during the first manual pass (see
`docs/IMPLEMENTATION_PLAN.md`, workstream D):

- Chrome's built-in Translator API does not exist → the engine's fallback
  path handles translation (or a configured provider).
- Safari grants host access **per-site by default**: the onboarding must
  tell users to allow the extension on their course site.
- `storage.sync` behaves like `storage.local` (no cross-device sync).

## Updating after engine changes

Re-run `pnpm build:chrome`; the Xcode project references the extension
resources — rebuild in Xcode picks up the new files (re-run `convert.sh`
with `--rebuild-project` only if the file list changed).
