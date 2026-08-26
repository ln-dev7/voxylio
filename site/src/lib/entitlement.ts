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

// Where the auth user's email lives depends on the Neon Auth
// generation: legacy exposed `neon_auth.users_sync`, managed Neon Auth
// (@neondatabase/auth) uses better-auth tables. Try the known layouts
// in order and REMEMBER the first that answers — one probe per boot,
// then a single indexed query per request. All failures degrade to
// null (the popup simply shows no email), never to an error.
const EMAIL_TABLES = [
  'neon_auth."user"',
  "neon_auth.users_sync",
  "neon_auth.users",
  'public."user"',
] as const;
let emailTable: string | null | undefined;

export async function lookupUserEmail(userId: string): Promise<string | null> {
  const tryOne = async (table: string) => {
    const r = await db.execute(
      sql.raw(`select email from ${table} where id = `).append(sql`${userId} limit 1`),
    );
    return (r.rows?.[0] as { email?: string } | undefined)?.email ?? null;
  };
  if (emailTable === null) return null; // probed before: nothing exists
  if (emailTable) {
    try {
      return await tryOne(emailTable);
    } catch {
      emailTable = undefined; // layout changed under us: re-probe
    }
  }
  for (const table of EMAIL_TABLES) {
    try {
      const email = await tryOne(table);
      emailTable = table;
      return email;
    } catch {
      /* table absent: next candidate */
    }
  }
  emailTable = null;
  return null;
}

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
