import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import {
  audioProviderConfigured,
  currentPeriod,
  proMonthlyAudioSeconds,
  proMonthlyChars,
  proMonthlyTtsChars,
  proProviderConfigured,
  trialDays,
  voiceProviderConfigured,
} from "@/lib/pro";
import { lookupUserEmail, readEntitlementSafe } from "@/lib/entitlement";

export const dynamic = "force-dynamic";

// Read-only endpoint, callable two ways:
//  - by the extension, with `Authorization: Bearer vxt_…` (CORS open —
//    the token is the credential, no cookies involved);
//  - by the account page, with the session cookie (same-origin).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

const FREE = { plan: "free", status: "none", currentPeriodEnd: null };

export async function GET(req: Request) {
  const bearer = req.headers.get("authorization");
  let userId: string | null = null;

  if (bearer?.startsWith("Bearer vxt_")) {
    const tokenHash = createHash("sha256")
      .update(bearer.slice("Bearer ".length))
      .digest("hex");
    const [row] = await db
      .select()
      .from(schema.extensionToken)
      .where(eq(schema.extensionToken.tokenHash, tokenHash))
      .limit(1);
    if (!row || row.revokedAt) {
      return Response.json(
        { error: "invalid_token" },
        { status: 401, headers: CORS },
      );
    }
    userId = row.userId;
    // Best-effort usage stamp; never blocks the response.
    db.update(schema.extensionToken)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.extensionToken.id, row.id))
      .catch(() => {});
  } else {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return Response.json(
        { error: "unauthorized" },
        { status: 401, headers: CORS },
      );
    }
    userId = session.user.id;
  }

  // Drift-safe read: a schema column not yet migrated must never 500
  // the gate (a fresh install has no cache to save it — the paying
  // user would render as "free").
  const ent = await readEntitlementSafe(userId);

  // First authenticated sighting starts the 3-day full trial (every
  // site unlocked). Never touches plan/status of an existing row, and
  // never fails the request: before `pnpm db:push` adds the column,
  // trialEndsAt simply stays null and the extension fails open.
  let trialStartedAt = ent?.trialStartedAt ?? null;
  if (!trialStartedAt) {
    trialStartedAt = new Date();
    try {
      await db
        .insert(schema.entitlement)
        .values({ userId, trialStartedAt })
        .onConflictDoUpdate({
          target: schema.entitlement.userId,
          set: { trialStartedAt },
        });
    } catch {
      trialStartedAt = null; // column not migrated yet: report nothing
    }
  }
  const trialEndsAt = trialStartedAt
    ? new Date(
        trialStartedAt.getTime() + trialDays() * 24 * 3600 * 1000,
      ).toISOString()
    : null;

  // The popup shows which account is linked. The auth user table's
  // name depends on the Neon Auth generation — lookupUserEmail probes
  // the known layouts and remembers the right one; never fails.
  const email = await lookupUserEmail(userId);

  // A canceled subscription stays pro until its period actually ends.
  let out = ent
    ? {
        plan: ent.plan,
        status: ent.status,
        currentPeriodEnd: ent.currentPeriodEnd?.toISOString() ?? null,
      }
    : FREE;
  if (
    out.plan === "pro" &&
    out.currentPeriodEnd &&
    new Date(out.currentPeriodEnd) < new Date()
  ) {
    out = { ...FREE, status: "revoked" };
  }

  // Capability flags + remaining cloud quota (docs/PRICING.md): the
  // extension renders these, it never decides on its own.
  const isPro = out.plan === "pro";
  let cloudCharsRemaining = 0;
  let ttsCharsRemaining = 0;
  let audioSecondsRemaining = 0;
  if (isPro) {
    try {
      const [usage] = await db
        .select({
          chars: schema.proUsage.chars,
          ttsChars: schema.proUsage.ttsChars,
        })
        .from(schema.proUsage)
        .where(
          and(
            eq(schema.proUsage.userId, userId),
            eq(schema.proUsage.period, currentPeriod()),
          ),
        )
        .limit(1);
      cloudCharsRemaining = Math.max(0, proMonthlyChars() - (usage?.chars ?? 0));
      ttsCharsRemaining = Math.max(
        0,
        proMonthlyTtsChars() - (usage?.ttsChars ?? 0),
      );
      // audio_seconds may not be migrated yet: guarded separately so
      // the two long-shipped meters never depend on the newest column.
      try {
        const [au] = await db
          .select({ audioSeconds: schema.proUsage.audioSeconds })
          .from(schema.proUsage)
          .where(
            and(
              eq(schema.proUsage.userId, userId),
              eq(schema.proUsage.period, currentPeriod()),
            ),
          )
          .limit(1);
        audioSecondsRemaining = Math.max(
          0,
          proMonthlyAudioSeconds() - (au?.audioSeconds ?? 0),
        );
      } catch {
        audioSecondsRemaining = 0;
      }
    } catch {
      /* table may not exist yet: report 0, never fail */
    }
  }
  const caps = {
    contextual_translation: isPro && proProviderConfigured(),
    cloud_voices: isPro && voiceProviderConfigured(),
    audio_transcription: isPro && audioProviderConfigured(),
    ai_summary: false,
    cloud_sync: false,
  };

  // First day of the next period (UTC): the popup, hub and account page
  // all render "resets on <date>" from this rather than guessing.
  const now = new Date();
  const quotaResetsAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  ).toISOString();

  return Response.json(
    {
      ...out,
      email,
      caps,
      cloudCharsRemaining,
      ttsCharsRemaining,
      cloudCharsTotal: isPro ? proMonthlyChars() : 0,
      ttsCharsTotal: isPro ? proMonthlyTtsChars() : 0,
      audioSecondsRemaining,
      audioSecondsTotal: isPro && audioProviderConfigured() ? proMonthlyAudioSeconds() : 0,
      quotaResetsAt,
      trialEndsAt,
      checkedAt: new Date().toISOString(),
    },
    { headers: CORS },
  );
}
