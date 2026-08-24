# Video Dub — website

Presentation website for the Video Dub Chrome extension.

Built with [Next.js](https://nextjs.org) (App Router),
[next-intl](https://next-intl.dev) for the bilingual routing (`/en`, `/fr`),
[Tailwind CSS](https://tailwindcss.com) and
[shadcn/ui](https://ui.shadcn.com) components.

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 — you are redirected to your locale
(`/en` or `/fr`).

## Structure

- `src/app/[locale]/` — localized layout and landing page
- `src/components/` — landing sections (hero, features, install, FAQ…)
- `src/components/ui/` — shadcn/ui components (added via the shadcn CLI)
- `src/i18n/` — next-intl routing, navigation and request config
- `messages/` — translation catalogs (`en.json`, `fr.json`)

## Build

```bash
pnpm build
pnpm start
```

Both locales are statically prerendered.
