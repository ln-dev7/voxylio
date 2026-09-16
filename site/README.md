# Voxylio — website

Presentation website for the Voxylio Chrome extension.

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

## SDK licence service

`POST /api/sdk/license/verify` is the control-plane endpoint used by the
browser SDK. It receives only a publishable licence key, the browser `Origin`
header, an SDK version and a redundant body-domain assertion. `Origin` remains
authoritative. It never accepts captions, media URLs, audio, page URLs or
learner data. Allowed domains may be exact (`learn.example.com`) or a
subdomain wildcard (`*.example.com`). Production origins must use HTTPS;
`http://localhost` and the two loopback addresses are accepted for development.

Request:

```http
POST /api/sdk/license/verify HTTP/1.1
Origin: https://learn.example.com
Authorization: Bearer vx_pk_<id>_<secret>
Content-Type: application/json

{"sdkVersion":"1.0.0","domain":"learn.example.com"}
```

A valid request returns `200` with `valid: true`, the accepted version range,
local-only capability flags, `checkedAt`, and a suggested `refreshAfter` time.
Stable errors are:

- `400 invalid_origin | bad_json | bad_request | invalid_sdk_version | origin_mismatch`
- `401 invalid_license`
- `403 license_inactive | license_expired | sdk_version_not_allowed | domain_not_allowed`
- `413 payload_too_large`
- `429 rate_limited` with `Retry-After`
- `503 service_unavailable`

### Deploying

1. Generate a stable server secret with `openssl rand -base64 48` and set
   `SDK_LICENSE_PEPPER` in local and Vercel Production/Preview environments.
   Never expose it with a `NEXT_PUBLIC_` prefix. Changing it invalidates every
   issued key.
2. Optionally set `SDK_LICENSE_PREAUTH_RATE_LIMIT_PER_MINUTE` (default `300`)
   and `SDK_LICENSE_RATE_LIMIT_PER_MINUTE` (default `600` per licence/client).
   For abuse prevention, the service stores a daily rotating HMAC derived from
   the client network address for at most two days. It is pseudonymous
   operational data: no raw IP address is stored and it is never used for
   analytics or profiling.
3. Generate a separate `CRON_SECRET`; Vercel uses it to authenticate the daily
   cleanup declared in `vercel.json`, which enforces the two-day maximum
   retention for pseudonymous buckets.
4. Apply the committed migration with `pnpm --filter site db:migrate` using
   `DATABASE_URL_UNPOOLED`.
5. Deploy the site, confirm the cron appears in Vercel, then issue the first
   domain-bound key.

### Provisioning keys

The CLI uses parameterized SQL and only stores an HMAC digest. `create` prints
the full publishable key once; it cannot be recovered from the database.

```bash
cd site
pnpm sdk:license -- create \
  --name "AI Hero" \
  --domain aihero.dev \
  --domain '*.aihero.dev' \
  --expires 2027-12-31 \
  --min-version 1.0.0 \
  --max-version 1.999.999

pnpm sdk:license -- list
pnpm sdk:license -- add-domain --id <id> --domain academy.example.com
pnpm sdk:license -- set-status --id <id> --status suspended
```

The package command loads `site/.env`. In CI, invoke the script directly with
the same `DATABASE_URL_UNPOOLED` and `SDK_LICENSE_PEPPER` environment variables.

### Post-deploy smoke test

Use the real key once from an allowed origin, then repeat with a deliberately
unlicensed origin. Never paste the key into an issue or build log.

```bash
curl -i https://voxylio.lndev.me/api/sdk/license/verify \
  -X POST \
  -H 'Origin: https://aihero.dev' \
  -H 'Authorization: Bearer vx_pk_REPLACE_ONCE' \
  -H 'Content-Type: application/json' \
  --data '{"sdkVersion":"1.0.0","domain":"aihero.dev"}'
```

The allowed origin must return `200` with `{"valid":true,...}`. An unlicensed
origin using its own hostname in both the `Origin` header and JSON body must
return `403` with `domain_not_allowed`; a mismatched body domain must return
`400` with `origin_mismatch`.

Run the security-focused validation tests with:

```bash
pnpm --filter site test:sdk-license
```
