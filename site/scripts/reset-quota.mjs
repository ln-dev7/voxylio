// Reset a user's Pro cloud quotas (owner tool — never shipped anywhere).
//
//   cd site
//   node scripts/reset-quota.mjs leonelngoya@gmail.com            # current month
//   node scripts/reset-quota.mjs leonelngoya@gmail.com --all      # every period
//   node scripts/reset-quota.mjs leonelngoya@gmail.com --trial    # + restart the full trial
//   node scripts/reset-quota.mjs leonelngoya@gmail.com --dry      # show, change nothing
//   node scripts/reset-quota.mjs --list                           # who exists in our tables
//   node scripts/reset-quota.mjs <raw user id> [...]              # skip email resolution
//
// Email → user id resolution DISCOVERS the auth table instead of
// assuming one: managed Neon Auth (@neondatabase/auth) does not expose
// the legacy `neon_auth.users_sync` — the user table's name depends on
// the auth generation. We scan information_schema for any table in the
// neon_auth (then public) schema that has both `id` and `email`
// columns and query the first that matches. `--list` sidesteps email
// entirely: it prints every user id seen in entitlement/pro_usage with
// its plan and usage, so you can reset by raw id.
//
// Deleting the pro_usage row(s) refills every meter at once
// (remaining = cap − used). --trial clears entitlement.trial_started_at:
// the next authenticated /api/entitlements call restamps it (fresh
// TRIAL_DAYS window). Reads DATABASE_URL from the environment or from
// .env.local / .env. The extension shows refreshed meters at its next
// check (≤15 min for Pro) or right after a sign-out/sign-in.

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
const target = args.find((a) => !a.startsWith("--"));
const ALL = args.includes("--all");
const TRIAL = args.includes("--trial");
const DRY = args.includes("--dry");
const LIST = args.includes("--list");

if (!target && !LIST) {
  console.error(
    "usage: node scripts/reset-quota.mjs <email|user-id> [--all] [--trial] [--dry] | --list",
  );
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

/** Find auth tables that carry both `id` and `email` (neon_auth first). */
async function findUserTables() {
  const q = await client.query(`
    select table_schema, table_name
    from information_schema.columns
    where column_name in ('id', 'email')
      and table_schema in ('neon_auth', 'public')
    group by table_schema, table_name
    having count(distinct column_name) = 2
    order by (table_schema = 'neon_auth') desc, table_name
  `);
  return q.rows.map((r) => `"${r.table_schema}"."${r.table_name}"`);
}

async function resolveUser(t) {
  if (!t.includes("@")) return { id: t, email: "(raw id)" }; // raw user id
  const tables = await findUserTables();
  if (!tables.length) {
    console.error(
      "No auth table with (id, email) found in neon_auth/public.\n" +
        "Run with --list to see the user ids present in our own tables,\n" +
        "then pass the id directly instead of the email.",
    );
    process.exit(1);
  }
  for (const table of tables) {
    try {
      const r = await client.query(
        `select id, email from ${table} where email = $1 limit 1`,
        [t],
      );
      if (r.rows.length) {
        console.log(`(resolved via ${table})`);
        return { id: r.rows[0].id, email: r.rows[0].email };
      }
    } catch {
      /* next candidate */
    }
  }
  console.error(
    `No user found for ${t} (looked in: ${tables.join(", ")}).\n` +
      "Try --list and pass the user id directly.",
  );
  process.exit(1);
}

try {
  if (LIST) {
    const r = await client.query(`
      select e.user_id,
             coalesce(e.plan, 'free') as plan,
             coalesce(u.chars, 0) as chars,
             coalesce(u.tts_chars, 0) as tts_chars,
             coalesce(u.audio_seconds, 0) as audio_seconds,
             u.period
      from entitlement e
      full outer join pro_usage u on u.user_id = e.user_id and u.period = $1
      order by plan desc
    `, [period]);
    if (!r.rows.length) console.log("No entitlement/pro_usage rows at all.");
    for (const row of r.rows) {
      console.log(
        `${row.user_id}  plan=${row.plan}  [${row.period ?? period}] ` +
          `trad=${row.chars} voix=${row.tts_chars} audio=${row.audio_seconds}s`,
      );
    }
    process.exit(0);
  }

  const user = await resolveUser(target);
  console.log(`User: ${user.email} (${user.id})`);

  const before = await client.query(
    "select period, chars, tts_chars, audio_seconds from pro_usage where user_id = $1 order by period",
    [user.id],
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
      ? await client.query("delete from pro_usage where user_id = $1", [user.id])
      : await client.query(
          "delete from pro_usage where user_id = $1 and period = $2",
          [user.id, period],
        );
    console.log(
      `\nReset: ${del.rowCount} usage row(s) deleted (${ALL ? "all periods" : period}) — all meters full again.`,
    );

    if (TRIAL) {
      const t = await client.query(
        "update entitlement set trial_started_at = null where user_id = $1",
        [user.id],
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
