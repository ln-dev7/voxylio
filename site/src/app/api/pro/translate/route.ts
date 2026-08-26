import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  batchContextualTranslate,
  contextualTranslate,
  currentPeriod,
  proMonthlyChars,
} from "@/lib/pro";

export const dynamic = "force-dynamic";

// Pro contextual translation — extension-only endpoint (Bearer vxt_…).
// Checks the plan, meters the monthly character quota, then calls the
// AI provider server-side. Two request shapes:
//   { text, before, after, source, target, secs? }         — one line
//   { lines: [{id, text, secs?}], before, source, target } — batch (≤8)
// The extension falls back to its local engine on ANY non-200, so
// failure modes here must be fast and clean:
//   401 invalid token · 403 not Pro · 429 quota exhausted ·
//   503 provider unconfigured/down · 422 unsupported pair ·
//   400 bad request / batch unsupported.
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

const LANG_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

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
    lines?: unknown;
    before?: unknown;
    after?: unknown;
    source?: unknown;
    target?: unknown;
    secs?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return err(400, "bad_json");
  }
  const target = typeof body.target === "string" ? body.target.slice(0, 8) : "";
  if (!LANG_RE.test(target)) return err(400, "bad_request");
  const clampList = (v: unknown, n: number) =>
    (Array.isArray(v) ? v : [])
      .filter((s): s is string => typeof s === "string")
      .slice(0, n)
      .map((s) => s.slice(0, 300));
  const before = clampList(body.before, 4);
  const after = clampList(body.after, 2);
  const source = typeof body.source === "string" ? body.source.slice(0, 8) : "auto";
  const clampSecs = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.min(60, n) : undefined;
  };

  // Batch shape?
  const isBatch = Array.isArray(body.lines);
  let lines: Array<{ id: string; text: string; secs?: number }> = [];
  let text = "";
  let metered = 0;
  if (isBatch) {
    lines = (body.lines as unknown[])
      .slice(0, 8)
      .map((l) => {
        const o = (l ?? {}) as { id?: unknown; text?: unknown; secs?: unknown };
        return {
          id: String(o.id ?? "").slice(0, 8),
          text: typeof o.text === "string" ? o.text.slice(0, 600) : "",
          secs: clampSecs(o.secs),
        };
      })
      .filter((l) => l.id && l.text.trim());
    metered = lines.reduce((n, l) => n + l.text.length, 0);
    if (!lines.length || metered > 3000) return err(400, "bad_request");
  } else {
    text = typeof body.text === "string" ? body.text.slice(0, 1200) : "";
    if (!text.trim()) return err(400, "bad_request");
    metered = text.length;
  }

  // Monthly quota — only the target lines are metered, never the context.
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

  let payload: Record<string, unknown>;
  try {
    if (isBatch) {
      const items = await batchContextualTranslate({ lines, before, source, target });
      payload = { items };
    } else {
      const translated = await contextualTranslate({
        text,
        before,
        after,
        source,
        target,
        secs: clampSecs(body.secs),
      });
      payload = { text: translated };
    }
  } catch (e) {
    const code = (e as { code?: number }).code ?? 502;
    return err(
      code,
      code === 503
        ? "provider_unavailable"
        : code === 400
          ? "batch_unsupported"
          : "translate_failed",
    );
  }

  // Atomic upsert-increment; metering failures never lose the response —
  // but they must be VISIBLE in the logs (silent under-metering is a
  // revenue bug, not a convenience).
  try {
    await db.execute(sql`
      insert into pro_usage (user_id, period, chars, updated_at)
      values (${userId}, ${period}, ${metered}, now())
      on conflict (user_id, period)
      do update set chars = pro_usage.chars + ${metered}, updated_at = now()
    `);
  } catch (e) {
    console.error("pro_usage metering failed", { userId, period, metered, e });
  }

  payload.remaining = Math.max(0, cap - used - metered);
  return Response.json(payload, { headers: CORS });
}
