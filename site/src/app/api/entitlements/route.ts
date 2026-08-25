import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

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

  const [ent] = await db
    .select()
    .from(schema.entitlement)
    .where(eq(schema.entitlement.userId, userId))
    .limit(1);

  // The popup shows which account is linked. Users are managed by Neon
  // Auth (synced into neon_auth.users_sync); never fail the request over
  // a missing sync table.
  let email: string | null = null;
  try {
    const r = await db.execute(
      sql`select email from neon_auth.users_sync where id = ${userId} limit 1`,
    );
    email = (r.rows?.[0] as { email?: string } | undefined)?.email ?? null;
  } catch {
    /* email stays null */
  }

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

  return Response.json(
    { ...out, email, checkedAt: new Date().toISOString() },
    { headers: CORS },
  );
}
