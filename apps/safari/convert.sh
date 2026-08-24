#!/usr/bin/env bash
# Generates the Safari (macOS + iOS) Xcode project from the built Chrome
# extension. macOS-only: requires Xcode command line tools.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EXT="$ROOT/extension"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Safari conversion requires macOS (Xcode). Run this on your Mac." >&2
  exit 1
fi
if [[ ! -f "$EXT/manifest.json" ]]; then
  echo "Missing /extension build — run: pnpm build:chrome" >&2
  exit 1
fi

xcrun safari-web-extension-converter "$EXT" \
  --project-location "$ROOT/apps/safari" \
  --app-name "Voxylio" \
  --bundle-identifier "me.lndev.voxylio" \
  --swift \
  --macos-only \
  --no-open \
  --force

echo "Xcode project generated in apps/safari/Voxylio — open it and set your signing team."
