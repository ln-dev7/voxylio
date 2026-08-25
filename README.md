# Voxylio

Real-time video dubbing in your browser. Voxylio is a Chrome extension that
dubs any subtitled video into **French, Spanish, Italian, German or
Portuguese** — live, while you watch.

It was born from a simple need: following English video courses in your own
language, the way YouTube auto-dubbing does — but on any site.

## How it works

1. The content script finds the video player on the page — including players
   hidden inside shadow DOMs, such as Mux.
2. It reads the player's English subtitle track (native text track or VTT
   file) and rebuilds **full sentences** from the caption fragments.
3. Each sentence is translated into the chosen language — Chrome's built-in
   **on-device translation API** (Chrome 138+) first, with an online fallback.
4. A synthesized voice speaks each sentence in sync with playback while the
   original audio is automatically ducked.

Free plan, unlimited — sign in with Google to unlock dubbing. No API key,
no card, no quota.

## Repository layout

pnpm workspace — the dubbing engine is shared, platforms are adapters.

| Folder              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `packages/core/`    | Platform-agnostic engine: parsing, sentence grouping, glossary, cache, pacing, voices — with unit tests |
| `packages/webext/`  | WebExtension adapter (`chrome.*` / `browser.*`)        |
| `apps/chrome/`      | Chrome build: sources + static assets + esbuild bundler |
| `extension/`        | **Generated** Chrome build output — the load-unpacked / store-zip folder. Do not edit its `.js` files by hand |
| `site/`             | Presentation website (Next.js, next-intl, shadcn/ui)   |
| `tests/integration/`| Playwright harnesses run against the built bundle      |

```bash
pnpm install
pnpm build:chrome       # bundle the engine into /extension
pnpm build:extensions   # chrome + edge + firefox
pnpm test:unit          # core unit tests (node:test)
pnpm test               # unit + content-script integration tests
```

## Platforms

| Platform | Status | Where |
| --- | --- | --- |
| Chrome | ✅ builds, tested | `/extension` (generated) |
| Edge | ✅ builds (Chromium parity) | `apps/edge/dist` |
| Firefox | ✅ builds, addons-linter clean | `apps/firefox/dist` |
| Safari | ⚙ converter ready (run on macOS) | `apps/safari/convert.sh` |

## Install the extension

1. Clone this repository (or download it as a ZIP)
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. Open a subtitled video, let it play a few seconds, then flip the switch in
   the popup or in the floating on-page bar

See [`extension/README.md`](extension/README.md) for settings and details.

## Run the website

```bash
cd site
pnpm install
pnpm dev
```

The site is bilingual (`/en`, `/fr`) via [next-intl](https://next-intl.dev),
styled with Tailwind CSS and [shadcn/ui](https://ui.shadcn.com).

See [ROADMAP.md](ROADMAP.md) for what's next.

## Auto-push (owner's Mac)

Claude cloud sessions write files and commits straight into this repo;
the only step needing GitHub credentials is `git push`. The LaunchAgent
in `scripts/` automates it (fast-forward only, never force). One-time
install:

```bash
chmod +x scripts/autopush.sh
cp scripts/me.lndev.voxylio.autopush.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/me.lndev.voxylio.autopush.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/me.lndev.voxylio.autopush.plist
```

It checks every 3 minutes and logs to
`~/Library/Logs/voxylio-autopush.log`. Uninstall with `launchctl unload`
+ delete the plist. If pushes fail there, the SSH key likely needs
`UseKeychain yes` in `~/.ssh/config` (passphrase-protected keys).

## License

[MIT](LICENSE) © Leonel Ngoya
