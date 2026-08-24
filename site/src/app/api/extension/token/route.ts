import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Mints the long-lived opaque token the extension authenticates with.
 * Requires a signed-in session (the account page calls this, then
 * relays the token to the extension via externally_connectable).
 * One active token per user: minting revokes the previous ones.
 */
export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = "vxt_" + randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await db
    .update(schema.extensionToken)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.extensionToken.userId, session.user.id),
        isNull(schema.extensionToken.revokedAt),
      ),
    );
  await db.insert(schema.extensionToken).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    tokenHash,
  });

  // The raw token is returned exactly once and never stored.
  return Response.json({ token });
}
