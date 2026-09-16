import { eq, sql } from "drizzle-orm";
import { ipAddress } from "@vercel/functions";
import { db, schema } from "@/db";
import {
  sdkLicenseOptions,
  verifySdkLicenseRequest,
} from "@/lib/sdk-license-handler.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_RATE_LIMIT = 600;
const DEFAULT_PREAUTH_RATE_LIMIT = 300;

function configuredRateLimit(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 10 && value <= 10_000
    ? Math.round(value)
    : fallback;
}

async function consumeBucket(subjectHash: string, limit: number) {
  const result = await db.execute(sql`
    insert into sdk_license_rate_limit
      (subject_hash, window_started_at, requests, updated_at)
    values (${subjectHash}, now(), 1, now())
    on conflict (subject_hash) do update set
      requests = case
        when sdk_license_rate_limit.window_started_at <= now() - interval '1 minute'
          then 1
        else sdk_license_rate_limit.requests + 1
      end,
      window_started_at = case
        when sdk_license_rate_limit.window_started_at <= now() - interval '1 minute'
          then now()
        else sdk_license_rate_limit.window_started_at
      end,
      updated_at = now()
    returning
      requests,
      greatest(
        1,
        ceil(extract(epoch from (window_started_at + interval '1 minute' - now())))
      )::int as retry_after
  `);
  const row = result.rows?.[0] as
    | { requests?: number | string; retry_after?: number | string }
    | undefined;
  const requests = Number(row?.requests ?? limit + 1);
  return {
    allowed: requests <= limit,
    limit,
    remaining: Math.max(0, limit - requests),
    retryAfter: Math.max(1, Number(row?.retry_after ?? 60)),
  };
}

export function OPTIONS(req: Request) {
  return sdkLicenseOptions(req);
}

export async function POST(req: Request) {
  return verifySdkLicenseRequest(req, {
    pepper: process.env.SDK_LICENSE_PEPPER,
    clientNetworkAddress(req: Request) {
      return ipAddress(req) || "unknown";
    },
    async findLicense(id: string) {
      const [license] = await db
        .select()
        .from(schema.sdkLicense)
        .where(eq(schema.sdkLicense.id, id))
        .limit(1);
      return license ?? null;
    },
    async listDomains(id: string) {
      const rows = await db
        .select({ domain: schema.sdkLicenseDomain.domain })
        .from(schema.sdkLicenseDomain)
        .where(eq(schema.sdkLicenseDomain.licenseId, id));
      return rows.map((row) => row.domain);
    },
    consumePreAuthRateLimit(subjectHash: string) {
      return consumeBucket(
        subjectHash,
        configuredRateLimit(
          "SDK_LICENSE_PREAUTH_RATE_LIMIT_PER_MINUTE",
          DEFAULT_PREAUTH_RATE_LIMIT,
        ),
      );
    },
    consumeRateLimit(subjectHash: string) {
      return consumeBucket(
        subjectHash,
        configuredRateLimit(
          "SDK_LICENSE_RATE_LIMIT_PER_MINUTE",
          DEFAULT_RATE_LIMIT,
        ),
      );
    },
    // At most one telemetry write per licence/hour, even if every page load
    // verifies. No origin, raw network address, media or learner value is written.
    async touchLicense(id: string) {
      const updated = await db.execute(sql`
        update sdk_license
        set last_verified_at = now(), updated_at = now()
        where id = ${id}
          and (
            last_verified_at is null
            or last_verified_at < now() - interval '1 hour'
          )
        returning id
      `);
      // The same hourly winner prunes daily rotating pseudonymous buckets.
      // The updated_at index makes the common "nothing stale" case cheap.
      if (updated.rows?.length) {
        await db.execute(sql`
          delete from sdk_license_rate_limit
          where updated_at < now() - interval '2 days'
        `);
      }
    },
    logError(message: string, details?: unknown) {
      console.error(message, details ?? "");
    },
  });
}
