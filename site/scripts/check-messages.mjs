// i18n parity guard: every locale must expose EXACTLY the key tree of
// the reference locale (en). Run with `pnpm --filter site i18n:check`
// (part of the site build gate — see .claude/skills/site-i18n).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../messages");
const REFERENCE = "en";

function keysOf(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object"
      ? keysOf(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const ref = new Set(
  keysOf(JSON.parse(readFileSync(join(DIR, `${REFERENCE}.json`), "utf8"))),
);

let failed = false;
for (const file of files) {
  const locale = file.replace(".json", "");
  if (locale === REFERENCE) continue;
  const keys = new Set(keysOf(JSON.parse(readFileSync(join(DIR, file), "utf8"))));
  const missing = [...ref].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !ref.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${locale}:`);
    for (const k of missing) console.error(`   missing  ${k}`);
    for (const k of extra) console.error(`   extra    ${k}`);
  } else {
    console.log(`✓ ${locale} (${keys.size} keys)`);
  }
}
if (failed) process.exit(1);
console.log(`All locales match ${REFERENCE} (${ref.size} keys).`);
