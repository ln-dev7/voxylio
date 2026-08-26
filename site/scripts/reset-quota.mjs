// Reset a user's Pro cloud quotas (owner tool — never shipped anywhere).
//
//   cd site
//   node scripts/reset-quota.mjs leonelngoya@gmail.com            # current month
//   node scripts/reset-quota.mjs leonelngoya@gmail.com --all      # every period
//   node scripts/reset-quota.mjs leonelngoya@gmail.com --trial    # + restart the full trial
//   node scripts/reset-quota.mjs leonelngoya@gmail.com --dry      # show, change nothing
//
// Deletes the pro_usage row(s) — remaining = cap − used, so a deleted
// row means a full quota again (translation + neural voice + Premium
// Audio at once). --trial clears entitlement.trial_started_at: the
// next authenticated /api/entitlements call restamps it, giving the
// account a brand-new TRIAL_DAYS window. Reads DATABASE_URL from the
// environment, or from .env.local / .env beside this script's parent.
//
// The extension shows the refreshed meters at its next entitlements
// check (≤15 min for Pro) — or immediately after a sign-out/sign-in.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnvUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = readFileSync(resolve(here, "..", f), "utf8");
      const m = txt.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?\s*$/m);
      if (m) return m[1];
    } catch {
      /* try the next file */
    }
  }
  return null;
}

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const ALL = args.includes("--all");
const TRIAL = args.includes("--trial");
const DRY = args.includes("--dry");

if (!email || !email.includes("@")) {
  console.error("usage: node scripts/reset-quota.mjs <email> [--all] [--trial] [--dry]");
  process.exit(1);
}
const url = loadEnvUrl();
if (!url) {
  console.error("DATABASE_URL not found (env, .env.local or .env).");
  process.exit(1);
}

const period = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const u = await client.query(
    "select id, email from neon_auth.users_sync where email = $1 and deleted_at is null limit 1",
    [email],
  );
  if (!u.rows.length) {
    console.error(`No user found for ${email}.`);
    process.exit(1);
  }
  const userId = u.rows[0].id;
  console.log(`User: ${u.rows[0].email} (${userId})`);

  const before = await client.query(
    "select period, chars, tts_chars, audio_seconds from pro_usage where user_id = $1 order by period",
    [userId],
  );
  if (!before.rows.length) console.log("No usage rows — quotas already full.");
  for (const r of before.rows) {
    console.log(
      `  ${r.period}: translation ${r.chars} chars · voice ${r.tts_chars} chars · audio ${r.audio_seconds}s` +
        (r.period === period ? "  ← current" : ""),
    );
  }

  if (DRY) {
    console.log("\n--dry: nothing changed.");
  } else {
    const del = ALL
      ? await client.query("delete from pro_usage where user_id = $1", [userId])
      : await client.query(
          "delete from pro_usage where user_id = $1 and period = $2",
          [userId, period],
        );
    console.log(
      `\nReset: ${del.rowCount} usage row(s) deleted (${ALL ? "all periods" : period}) — all meters full again.`,
    );

    if (TRIAL) {
      const t = await client.query(
        "update entitlement set trial_started_at = null where user_id = $1",
        [userId],
      );
      console.log(
        t.rowCount
          ? "Trial reset: restamps at the next sign-in / entitlements call (fresh TRIAL_DAYS window)."
          : "Trial: no entitlement row to reset (it will be created on next sign-in anyway).",
      );
    }
  }
} finally {
  await client.end();
}
