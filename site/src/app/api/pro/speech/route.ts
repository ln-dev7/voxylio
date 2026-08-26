import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { readEntitlementSafe } from "@/lib/entitlement";
import {
  currentPeriod,
  proMonthlyTtsChars,
  synthesizeSpeech,
} from "@/lib/pro";

export const dynamic = "force-dynamic";

// Pro neural voice — extension-only endpoint (Bearer vxt_…). One
// sentence in, one MP3 out. The TTS character quota is metered
// separately from contextual translation (see docs/PRICING.md); the
// extension falls back to the local system voice on ANY non-200:
//   401 invalid token · 403 not Pro · 422 unsupported language ·
//   429 quota exhausted · 503 provider unconfigured/down.
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

  const ent = await readEntitlementSafe(userId);
  const proUntil = ent?.currentPeriodEnd ? ent.currentPeriodEnd.getTime() : null;
  const isPro =
    ent?.plan === "pro" && (proUntil === null || proUntil > Date.now());
  if (!isPro) return err(403, "not_pro");

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return err(400, "bad_json");
  }
  const text = typeof body.text === "string" ? body.text.slice(0, 1200) : "";
  const lang = typeof body.lang === "string" ? body.lang.slice(0, 8) : "";
  if (!text.trim() || !lang) return err(400, "bad_request");

  // Separate TTS meter — never mixed with translation characters.
  const period = currentPeriod();
  const cap = proMonthlyTtsChars();
  const [usage] = await db
    .select({ ttsChars: schema.proUsage.ttsChars })
    .from(schema.proUsage)
    .where(
      and(
        eq(schema.proUsage.userId, userId),
        eq(schema.proUsage.period, period),
      ),
    )
    .limit(1);
  const used = usage?.ttsChars ?? 0;
  if (used >= cap) return err(429, "quota_exhausted");

  let out: { audio: ArrayBuffer; mime: string };
  try {
    out = await synthesizeSpeech(text, lang);
  } catch (e) {
    const code = (e as { code?: number }).code ?? 502;
    return err(
      code,
      code === 503
        ? "provider_unavailable"
        : code === 422
          ? "unsupported_language"
          : "speech_failed",
    );
  }

  try {
    await db.execute(sql`
      insert into pro_usage (user_id, period, chars, tts_chars, updated_at)
      values (${userId}, ${period}, 0, ${text.length}, now())
      on conflict (user_id, period)
      do update set tts_chars = pro_usage.tts_chars + ${text.length}, updated_at = now()
    `);
  } catch {
    /* metered best-effort */
  }

  return new Response(out.audio, {
    headers: {
      ...CORS,
      "Content-Type": out.mime,
      "X-Tts-Remaining": String(Math.max(0, cap - used - text.length)),
    },
  });
}
