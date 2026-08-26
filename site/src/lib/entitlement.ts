import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

// The one safe way to read a user's entitlement. The naive
// `select().from(entitlement)` selects EVERY column the TypeScript
// schema declares — so the moment the code ships a new column before
// `pnpm db:push` ran, the query throws and every caller 500s. That
// exact drift once made a paying user look "free" right after a
// reinstall (fresh install = no cached entitlements to fall back on).
// This reader degrades to the columns that have existed since v1.7
// instead: a pending migration must NEVER take the plan gate down.

export type SafeEntitlement = {
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  trialStartedAt: Date | null;
};

export async function readEntitlementSafe(
  userId: string,
): Promise<SafeEntitlement | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.entitlement)
      .where(eq(schema.entitlement.userId, userId))
      .limit(1);
    if (!row) return null;
    return {
      plan: row.plan,
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd ?? null,
      trialStartedAt: row.trialStartedAt ?? null,
    };
  } catch {
    try {
      const r = await db.execute(
        sql`select plan, status, current_period_end from entitlement where user_id = ${userId} limit 1`,
      );
      const row = r.rows?.[0] as
        | {
            plan?: string;
            status?: string;
            current_period_end?: string | Date | null;
          }
        | undefined;
      if (!row) return null;
      return {
        plan: String(row.plan || "free"),
        status: String(row.status || "none"),
        currentPeriodEnd: row.current_period_end
          ? new Date(row.current_period_end)
          : null,
        trialStartedAt: null, // column not migrated yet: no trial info
      };
    } catch {
      return null; // table missing entirely: the caller treats as free
    }
  }
}
