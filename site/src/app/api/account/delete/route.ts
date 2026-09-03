import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { polar } from "@/lib/polar";

export const dynamic = "force-dynamic";

// Auth rows live in the managed neon_auth schema; its exact table names
// depend on the Neon Auth generation (same reality lib/entitlement.ts
// probes for emails). Every delete below is best-effort per candidate:
// absent tables/columns are skipped, and the business-data purge never
// depends on the auth-schema layout.
const AUTH_DELETES: Array<[string, string]> = [
  ['neon_auth."session"', '"userId"'],
  ['neon_auth."session"', "user_id"],
  ['neon_auth."account"', '"userId"'],
  ['neon_auth."account"', "user_id"],
  ['neon_auth."user"', "id"],
  ["neon_auth.users_sync", "id"],
  ["neon_auth.users", "id"],
];

/**
 * POST /api/account/delete — permanent account deletion (App Store
 * guideline 5.1.1(v), and plain GDPR hygiene). Order matters:
 *  1. revoke the Polar subscription so billing stops immediately
 *     (invoices stay in Polar for accounting — only the sub ends);
 *  2. purge business data (usage meters, extension tokens, entitlement);
 *  3. delete the auth identity (sessions, oauth links, user row).
 * Any Polar hiccup never blocks the deletion the user asked for.
 */
export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // 1. Stop billing.
  try {
    const [ent] = await db
      .select()
      .from(schema.entitlement)
      .where(eq(schema.entitlement.userId, userId))
      .limit(1);
    if (ent?.polarSubscriptionId && ent.plan === "pro") {
      await polar.subscriptions.revoke({ id: ent.polarSubscriptionId });
    }
  } catch {
    /* no subscription, or Polar unreachable: deletion proceeds */
  }

  // 2. Purge business data.
  try {
    await db.delete(schema.proUsage).where(eq(schema.proUsage.userId, userId));
  } catch {}
  try {
    await db
      .delete(schema.extensionToken)
      .where(eq(schema.extensionToken.userId, userId));
  } catch {}
  try {
    await db
      .delete(schema.entitlement)
      .where(eq(schema.entitlement.userId, userId));
  } catch {}

  // 3. Delete the auth identity.
  for (const [table, col] of AUTH_DELETES) {
    try {
      await db.execute(
        sql.raw(`delete from ${table} where ${col} = `).append(sql`${userId}`),
      );
    } catch {
      /* table or column absent in this auth generation */
    }
  }

  return Response.json({ ok: true });
}
