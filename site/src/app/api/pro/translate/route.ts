import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  contextualTranslate,
  currentPeriod,
  proMonthlyChars,
} from "@/lib/pro";

export const dynamic = "force-dynamic";

// Pro contextual translation — extension-only endpoint (Bearer vxt_…).
// Checks the plan, meters the monthly character quota, then calls the
// AI provider server-side. The extension falls back to its local engine
// on ANY non-200, so failure modes here must be fast and clean:
//   401 invalid token · 403 not Pro · 429 quota exhausted ·
//   503 provider unconfigured/down · 422 unsupported pair.
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

  // Pro plan required (a canceled subscription counts until period end).
  const [ent] = await db
    .select()
    .from(schema.entitlement)
    .where(eq(schema.entitlement.userId, userId))
    .limit(1);
  const proUntil = ent?.currentPeriodEnd ? ent.currentPeriodEnd.getTime() : null;
  const isPro =
    ent?.plan === "pro" && (proUntil === null || proUntil > Date.now());
  if (!isPro) return err(403, "not_pro");

  // Body validation — small, bounded payloads only.
  let body: {
    text?: unknown;
    before?: unknown;
    after?: unknown;
    source?: unknown;
    target?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return err(400, "bad_json");
  }
  const text = typeof body.text === "string" ? body.text.slice(0, 1200) : "";
  const target = typeof body.target === "string" ? body.target.slice(0, 8) : "";
  if (!text.trim() || !target) return err(400, "bad_request");
  const clampList = (v: unknown, n: number) =>
    (Array.isArray(v) ? v : [])
      .filter((s): s is string => typeof s === "string")
      .slice(0, n)
      .map((s) => s.slice(0, 300));
  const before = clampList(body.before, 4);
  const after = clampList(body.after, 2);
  const source = typeof body.source === "string" ? body.source.slice(0, 8) : "auto";

  // Monthly quota — only the target line is metered, never the context.
  const period = currentPeriod();
  const cap = proMonthlyChars();
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
  const used = usage?.chars ?? 0;
  if (used >= cap) return err(429, "quota_exhausted");

  let translated: string;
  try {
    translated = await contextualTranslate({ text, before, after, source, target });
  } catch (e) {
    const code = (e as { code?: number }).code ?? 502;
    return err(code, code === 503 ? "provider_unavailable" : "translate_failed");
  }

  // Atomic upsert-increment; metering failures never lose the response.
  try {
    await db.execute(sql`
      insert into pro_usage (user_id, period, chars, updated_at)
      values (${userId}, ${period}, ${text.length}, now())
      on conflict (user_id, period)
      do update set chars = pro_usage.chars + ${text.length}, updated_at = now()
    `);
  } catch {
    /* metered best-effort */
  }

  return Response.json(
    { text: translated, remaining: Math.max(0, cap - used - text.length) },
    { headers: CORS },
  );
}
