#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import pg from "pg";
import {
  compareSemver,
  hashSdkLicenseSecret,
  normalizeSdkDomainPattern,
  parseSemver,
  SDK_KEY_PREFIX,
} from "../src/lib/sdk-license.mjs";

const { Client } = pg;

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage:
  pnpm sdk:license -- create --name "AI Hero" --domain aihero.dev [--domain '*.aihero.dev']
      [--expires 2027-12-31] [--min-version 1.0.0] [--max-version 1.999.999]
  pnpm sdk:license -- list
  pnpm sdk:license -- set-status --id <id> --status active|suspended|revoked
  pnpm sdk:license -- add-domain --id <id> --domain learn.example.com

Secrets are generated locally and printed exactly once by create. They are
never stored in plaintext and cannot be recovered later.`);
  process.exit(message ? 1 : 0);
}

function parseArgs(values) {
  const out = { _: [], domain: [] };
  for (let i = 0; i < values.length; i += 1) {
    const item = values[i];
    if (!item.startsWith("--")) {
      out._.push(item);
      continue;
    }
    const key = item.slice(2);
    const value = values[i + 1];
    if (!value || value.startsWith("--")) usage(`--${key} requires a value`);
    i += 1;
    if (key === "domain") out.domain.push(value);
    else out[key] = value;
  }
  return out;
}

function databaseUrl() {
  const value = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!value) usage("DATABASE_URL_UNPOOLED (preferred) or DATABASE_URL is required");
  return value;
}

function pepper() {
  const value = process.env.SDK_LICENSE_PEPPER;
  if (!value || value.length < 32) {
    usage("SDK_LICENSE_PEPPER must contain at least 32 characters");
  }
  return value;
}

function normalizedDomains(values, { requireWildcardBase = true } = {}) {
  const domains = [...new Set(values.map(normalizeSdkDomainPattern))];
  if (!domains.length || domains.some((value) => !value)) {
    usage("provide at least one valid exact domain or *.example.com wildcard");
  }
  if (requireWildcardBase) {
    for (const domain of domains) {
      if (domain.startsWith("*.") && !domains.includes(domain.slice(2))) {
        usage(`wildcard ${domain} also requires its exact base domain`);
      }
    }
  }
  return domains;
}

function parsedExpiry(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    usage("--expires must be a valid future ISO date");
  }
  return date;
}

async function createLicense(client, args) {
  const name = String(args.name || "").trim();
  if (!name || name.length > 120) usage("--name is required (maximum 120 characters)");
  const domains = normalizedDomains(args.domain);
  const minVersion = args["min-version"] || "1.0.0";
  const maxVersion = args["max-version"] || "1.999.999";
  if (!parseSemver(minVersion) || !parseSemver(maxVersion)) {
    usage("--min-version and --max-version must be complete semantic versions");
  }
  if (compareSemver(minVersion, maxVersion) > 0) {
    usage("--min-version cannot be greater than --max-version");
  }
  const expiresAt = parsedExpiry(args.expires);
  const id = randomBytes(9).toString("base64url");
  const secret = randomBytes(32).toString("base64url");
  const key = `${SDK_KEY_PREFIX}_${id}_${secret}`;
  const secretHash = hashSdkLicenseSecret(id, secret, pepper());

  await client.query("begin");
  try {
    await client.query(
      `insert into sdk_license
        (id, name, secret_hash, status, expires_at, min_sdk_version, max_sdk_version)
       values ($1, $2, $3, 'active', $4, $5, $6)`,
      [id, name, secretHash, expiresAt, minVersion, maxVersion],
    );
    for (const domain of domains) {
      await client.query(
        `insert into sdk_license_domain (license_id, domain)
         values ($1, $2)`,
        [id, domain],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }

  console.log(`Created SDK licence ${id} (${name})`);
  console.log(`Domains: ${domains.join(", ")}`);
  console.log(`Versions: ${minVersion} … ${maxVersion}`);
  console.log(`Expires: ${expiresAt?.toISOString() ?? "never"}`);
  console.log("\nPublishable key — copy it now; it cannot be recovered:");
  console.log(key);
}

async function listLicenses(client) {
  const result = await client.query(`
    select l.id, l.name, l.status, l.expires_at, l.min_sdk_version,
           l.max_sdk_version, l.last_verified_at,
           coalesce(array_agg(d.domain order by d.domain)
             filter (where d.domain is not null), '{}') as domains
    from sdk_license l
    left join sdk_license_domain d on d.license_id = l.id
    group by l.id
    order by l.created_at desc
  `);
  console.table(
    result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      domains: row.domains.join(", "),
      versions: `${row.min_sdk_version}…${row.max_sdk_version || "∞"}`,
      expires: row.expires_at?.toISOString?.() ?? row.expires_at ?? "never",
      lastVerified:
        row.last_verified_at?.toISOString?.() ?? row.last_verified_at ?? "never",
    })),
  );
}

async function setStatus(client, args) {
  const id = String(args.id || "");
  const status = String(args.status || "");
  if (!id || !["active", "suspended", "revoked"].includes(status)) {
    usage("set-status requires --id and --status active|suspended|revoked");
  }
  const result = await client.query(
    `update sdk_license set status = $2, updated_at = now()
     where id = $1 returning id, name, status`,
    [id, status],
  );
  if (!result.rowCount) usage(`licence ${id} does not exist`);
  console.log(`${result.rows[0].name} (${id}) is now ${status}`);
}

async function addDomain(client, args) {
  const id = String(args.id || "");
  if (!id) usage("add-domain requires --id");
  const [domain] = normalizedDomains(args.domain, { requireWildcardBase: false });
  const exists = await client.query("select 1 from sdk_license where id = $1", [id]);
  if (!exists.rowCount) usage(`licence ${id} does not exist`);
  if (domain.startsWith("*.")) {
    const base = await client.query(
      `select 1 from sdk_license_domain
       where license_id = $1 and domain = $2`,
      [id, domain.slice(2)],
    );
    if (!base.rowCount) {
      usage(`add the exact base domain ${domain.slice(2)} before ${domain}`);
    }
  }
  await client.query(
    `insert into sdk_license_domain (license_id, domain)
     values ($1, $2) on conflict (license_id, domain) do nothing`,
    [id, domain],
  );
  console.log(`Added ${domain} to ${id}`);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
if (!command || ["help", "-h"].includes(command)) usage();

const client = new Client({ connectionString: databaseUrl() });
try {
  await client.connect();
  if (command === "create") await createLicense(client, args);
  else if (command === "list") await listLicenses(client);
  else if (command === "set-status") await setStatus(client, args);
  else if (command === "add-domain") await addDomain(client, args);
  else usage(`unknown command: ${command}`);
} finally {
  await client.end();
}
