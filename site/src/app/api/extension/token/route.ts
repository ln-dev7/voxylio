import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

// A user may run the extension on several browsers/machines: keep the
// newest tokens alive instead of revoking everything on each sign-in
// (single-token minting silently killed dubbing on the OTHER browser up
// to a day later, mid-video). 3 active tokens = laptop + desktop + one.
const MAX_ACTIVE_TOKENS = 3;

/**
 * Mints the long-lived opaque token the extension authenticates with.
 * Requires a signed-in session (the account page calls this, then
 * relays the token to the extension via externally_connectable).
 */
export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = "vxt_" + randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  // Revoke only the oldest active tokens beyond the allowance (the new
  // one takes a slot).
  const active = await db
    .select({ id: schema.extensionToken.id })
    .from(schema.extensionToken)
    .where(
      and(
        eq(schema.extensionToken.userId, session.user.id),
        isNull(schema.extensionToken.revokedAt),
      ),
    )
    .orderBy(desc(schema.extensionToken.createdAt));
  const stale = active.slice(MAX_ACTIVE_TOKENS - 1).map((t) => t.id);
  if (stale.length > 0) {
    await db
      .update(schema.extensionToken)
      .set({ revokedAt: new Date() })
      .where(inArray(schema.extensionToken.id, stale));
  }
  await db.insert(schema.extensionToken).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    tokenHash,
  });

  // The raw token is returned exactly once and never stored.
  return Response.json({ token });
}
