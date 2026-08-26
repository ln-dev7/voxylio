import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  audioProviderConfigured,
  currentPeriod,
  grantDeepgramToken,
  proMonthlyAudioSeconds,
} from "@/lib/pro";

export const dynamic = "force-dynamic";

// Premium Audio (Pro, beta) — extension-only endpoint (Bearer vxt_…).
// Two operations in one route:
//   { op: "grant" }              → short-lived Deepgram token for ONE
//                                  live-transcription WebSocket session
//   { op: "usage", seconds: n }  → meter n seconds of streamed audio
// The minutes quota is its own meter (docs/PRICING.md): never mixed
// with translation or TTS characters. Statuses the extension maps:
//   401 invalid token · 403 not Pro · 429 quota exhausted ·
//   503 provider unconfigured · 502 provider error.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

const err = (status: number, error: string) =>
  Response.json({ error }, { status, headers: CORS });

export async function POST(req: Request) {
  const bearer = req.headers.get("authorization");
  if (!bearer?.startsWith("Bearer vxt_")) return err(401, "invalid_token");
  const tokenHash = createHash("sha256")
    .update(bearer.slice("Bearer ".length))
    .digest("hex");
  const [tok] = await db
    .select()
    .from(schema.extensionToken)
    .where(eq(schema.extensionToken.tokenHash, tokenHash))
    .limit(1);
  if (!tok || tok.revokedAt) return err(401, "invalid_token");
  const userId = tok.userId;

  const [ent] = await db
    .select()
    .from(schema.entitlement)
    .where(eq(schema.entitlement.userId, userId))
    .limit(1);
  const proUntil = ent?.currentPeriodEnd ? ent.currentPeriodEnd.getTime() : null;
  const isPro =
    ent?.plan === "pro" && (proUntil === null || proUntil > Date.now());
  if (!isPro) return err(403, "not_pro");
  if (!audioProviderConfigured()) return err(503, "provider_unavailable");

  let body: { op?: unknown; seconds?: unknown };
  try {
    body = await req.json();
  } catch {
    return err(400, "bad_json");
  }

  const period = currentPeriod();
  const cap = proMonthlyAudioSeconds();
  const [usage] = await db
    .select()
    .from(schema.proUsage)
    .where(
      and(
        eq(schema.proUsage.userId, userId),
        eq(schema.proUsage.period, period),
      ),
    )
    .limit(1);
  const used = usage?.audioSeconds ?? 0;

  if (body.op === "grant") {
    if (used >= cap) return err(429, "quota_exhausted");
    try {
      const grant = await grantDeepgramToken();
      return Response.json(
        {
          token: grant.token,
          expiresIn: grant.expiresIn,
          remainingSeconds: Math.max(0, cap - used),
        },
        { headers: CORS },
      );
    } catch (e) {
      const code = (e as { code?: number }).code ?? 502;
      return err(code, code === 503 ? "provider_unavailable" : "grant_failed");
    }
  }

  if (body.op === "usage") {
    // Heartbeats are small by construction: a huge report is a bug or
    // abuse, never billed blindly.
    const n = Math.round(Number(body.seconds));
    const seconds = Number.isFinite(n) ? Math.max(1, Math.min(120, n)) : 0;
    if (!seconds) return err(400, "bad_request");
    try {
      await db.execute(sql`
        insert into pro_usage (user_id, period, chars, tts_chars, audio_seconds, updated_at)
        values (${userId}, ${period}, 0, 0, ${seconds}, now())
        on conflict (user_id, period)
        do update set audio_seconds = pro_usage.audio_seconds + ${seconds}, updated_at = now()
      `);
    } catch {
      /* metered best-effort */
    }
    const remaining = Math.max(0, cap - used - seconds);
    if (used + seconds >= cap)
      return Response.json(
        { remainingSeconds: 0, exhausted: true },
        { status: 402, headers: CORS },
      );
    return Response.json({ remainingSeconds: remaining }, { headers: CORS });
  }

  return err(400, "bad_request");
}
