import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    // With a daily cron, deleting rows older than one day guarantees a
    // pseudonymous bucket is retained for less than two days.
    const result = await db.execute(sql`
      delete from sdk_license_rate_limit
      where updated_at < now() - interval '1 day'
    `);
    return Response.json({ ok: true, deleted: result.rowCount ?? 0 });
  } catch (error) {
    console.error("SDK licence rate-limit cleanup failed", { error });
    return Response.json({ error: "cleanup_failed" }, { status: 500 });
  }
}
