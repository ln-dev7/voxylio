import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Pooled Neon connection (-pooler hostname) for application traffic.
// Migrations use DATABASE_URL_UNPOOLED via drizzle-kit, never this pool.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (!globalForDb.pgPool) {
  globalForDb.pgPool = pool;
  // Lets Vercel's Fluid compute drain the pool cleanly between invocations.
  try {
    attachDatabasePool(pool);
  } catch {
    /* running outside Vercel */
  }
}

export const db = drizzle(pool, { schema });
export { schema };
