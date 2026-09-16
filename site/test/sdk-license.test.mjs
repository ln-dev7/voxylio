import assert from "node:assert/strict";
import test from "node:test";
import {
  bearerSdkLicenseKey,
  compareSemver,
  hashSdkLicenseSecret,
  normalizeSdkDomainPattern,
  parseSdkLicenseKey,
  parseSdkOrigin,
  parseSemver,
  sdkDomainAllowed,
  sdkRequestDomainMatches,
  sdkRateLimitSubject,
  sdkVersionAllowed,
  verifySdkLicenseSecret,
} from "../src/lib/sdk-license.mjs";
import {
  sdkLicenseOptions,
  verifySdkLicenseRequest,
} from "../src/lib/sdk-license-handler.mjs";

const ID = "AbCdEf0123-_";
const SECRET = "a".repeat(43);
const KEY = `vx_pk_${ID}_${SECRET}`;
const PEPPER = "test-pepper-that-is-longer-than-32-bytes";

test("publishable keys use the strict id + 256-bit secret format", () => {
  assert.deepEqual(parseSdkLicenseKey(KEY), { id: ID, secret: SECRET });
  assert.deepEqual(bearerSdkLicenseKey(`Bearer ${KEY}`), {
    id: ID,
    secret: SECRET,
  });
  assert.equal(parseSdkLicenseKey(`vx_pk_${ID}_short`), null);
  assert.equal(bearerSdkLicenseKey(`Basic ${KEY}`), null);
  assert.equal(bearerSdkLicenseKey(`Bearer ${KEY}suffix`), null);
});

test("stored licence digests are peppered and compared safely", () => {
  const digest = hashSdkLicenseSecret(ID, SECRET, PEPPER);
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.equal(verifySdkLicenseSecret(ID, SECRET, digest, PEPPER), true);
  assert.equal(verifySdkLicenseSecret(ID, `${SECRET.slice(0, -1)}b`, digest, PEPPER), false);
  assert.equal(verifySdkLicenseSecret("another-id-1", SECRET, digest, PEPPER), false);
  assert.equal(verifySdkLicenseSecret(ID, SECRET, "not-a-digest", PEPPER), false);
  assert.throws(() => hashSdkLicenseSecret(ID, SECRET, "short"));
});

test("production origins require HTTPS while loopback HTTP stays usable", () => {
  assert.deepEqual(parseSdkOrigin("https://learn.example.com:8443"), {
    origin: "https://learn.example.com:8443",
    hostname: "learn.example.com",
  });
  assert.equal(parseSdkOrigin("http://learn.example.com"), null);
  assert.equal(parseSdkOrigin("null"), null);
  assert.equal(parseSdkOrigin("https://learn.example.com/path"), null);
  assert.equal(parseSdkOrigin("https://user:pass@learn.example.com"), null);
  assert.equal(parseSdkOrigin("http://localhost:3000")?.hostname, "localhost");
  assert.equal(parseSdkOrigin("http://127.0.0.1:5173")?.hostname, "127.0.0.1");
});

test("domain patterns are normalized and unsafe wildcards rejected", () => {
  assert.equal(normalizeSdkDomainPattern(" Learn.Example.com. "), "learn.example.com");
  assert.equal(normalizeSdkDomainPattern("*.Example.com"), "*.example.com");
  assert.equal(normalizeSdkDomainPattern("*.com"), null);
  assert.equal(normalizeSdkDomainPattern("*"), null);
  assert.equal(normalizeSdkDomainPattern("https://example.com"), null);
  assert.equal(normalizeSdkDomainPattern("example.com:443"), null);
  assert.equal(normalizeSdkDomainPattern("[::1]"), "[::1]");
});

test("rate-limit subjects do not retain client addresses and rotate daily", () => {
  const one = sdkRateLimitSubject(ID, "203.0.113.4", PEPPER, new Date("2026-09-16"));
  const same = sdkRateLimitSubject(ID, "203.0.113.4", PEPPER, new Date("2026-09-16T23:00:00Z"));
  const otherIp = sdkRateLimitSubject(ID, "203.0.113.5", PEPPER, new Date("2026-09-16"));
  const nextDay = sdkRateLimitSubject(ID, "203.0.113.4", PEPPER, new Date("2026-09-17"));
  assert.match(one, /^[0-9a-f]{64}$/);
  assert.equal(one, same);
  assert.notEqual(one, otherIp);
  assert.notEqual(one, nextDay);
  assert.equal(one.includes("203.0.113.4"), false);
});

test("wildcards match subdomains only and preserve DNS boundaries", () => {
  const domains = ["example.com", "*.school.example.com"];
  assert.equal(sdkDomainAllowed("example.com", domains), true);
  assert.equal(sdkDomainAllowed("app.school.example.com", domains), true);
  assert.equal(sdkDomainAllowed("a.b.school.example.com", domains), true);
  assert.equal(sdkDomainAllowed("school.example.com", ["*.school.example.com"]), false);
  assert.equal(sdkDomainAllowed("evil-school.example.com", domains), false);
  assert.equal(sdkDomainAllowed("example.com.evil.test", domains), false);
});

test("body domain is only accepted when it equals the authoritative Origin host", () => {
  assert.equal(sdkRequestDomainMatches("learn.example.com", "Learn.Example.com"), true);
  assert.equal(sdkRequestDomainMatches("learn.example.com", "other.example.com"), false);
  assert.equal(sdkRequestDomainMatches("learn.example.com", "*.example.com"), false);
  assert.equal(sdkRequestDomainMatches("learn.example.com", undefined), false);
});

test("strict SemVer ranges include prerelease ordering", () => {
  assert.ok(parseSemver("1.0.0"));
  assert.ok(parseSemver("1.2.3-beta.2+build.7"));
  assert.equal(parseSemver("1.2"), null);
  assert.equal(parseSemver("01.2.3"), null);
  assert.equal(parseSemver("1.2.3-beta.01"), null);
  assert.equal(parseSemver("99999999999999999999.0.0"), null);
  assert.equal(compareSemver("1.0.0-beta.2", "1.0.0-beta.11"), -1);
  assert.equal(compareSemver("1.0.0", "1.0.0-rc.1"), 1);
  assert.equal(sdkVersionAllowed("1.4.2", "1.0.0", "1.999.999"), true);
  assert.equal(sdkVersionAllowed("2.0.0", "1.0.0", "1.999.999"), false);
  assert.equal(sdkVersionAllowed("0.9.9", "1.0.0", null), false);
});

function verificationRequest({
  origin = "https://learn.example.com",
  key = KEY,
  body = { sdkVersion: "1.0.0", domain: "learn.example.com" },
  method = "POST",
} = {}) {
  const headers = new Headers({
    "content-type": "application/json",
    authorization: `Bearer ${key}`,
    "x-forwarded-for": "203.0.113.9",
  });
  if (origin !== null) headers.set("origin", origin);
  return new Request("https://voxylio.lndev.me/api/sdk/license/verify", {
    method,
    headers,
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
}

function fakeDependencies(overrides = {}) {
  const calls = { preAuth: 0, find: 0, rate: 0, touch: 0, subject: null };
  const license = {
    id: ID,
    secretHash: hashSdkLicenseSecret(ID, SECRET, PEPPER),
    status: "active",
    expiresAt: new Date("2099-01-01T00:00:00Z"),
    minSdkVersion: "1.0.0",
    maxSdkVersion: "1.999.999",
  };
  return {
    calls,
    deps: {
      pepper: PEPPER,
      findLicense: async () => {
        calls.find += 1;
        return license;
      },
      listDomains: async () => ["learn.example.com"],
      clientNetworkAddress: () => "203.0.113.9",
      consumePreAuthRateLimit: async () => {
        calls.preAuth += 1;
        return { allowed: true, limit: 300, remaining: 299, retryAfter: 60 };
      },
      consumeRateLimit: async (subject) => {
        calls.rate += 1;
        calls.subject = subject;
        return { allowed: true, limit: 600, remaining: 599, retryAfter: 60 };
      },
      touchLicense: async () => {
        calls.touch += 1;
      },
      logError: () => {},
      ...overrides,
    },
  };
}

test("CORS preflight reflects a valid origin and rejects a missing one", async () => {
  const valid = sdkLicenseOptions(
    new Request("https://voxylio.lndev.me/api/sdk/license/verify", {
      method: "OPTIONS",
      headers: {
        origin: "https://learn.example.com",
        "access-control-request-method": "POST",
      },
    }),
  );
  assert.equal(valid.status, 204);
  assert.equal(valid.headers.get("access-control-allow-origin"), "https://learn.example.com");
  assert.match(valid.headers.get("access-control-allow-headers"), /authorization/);
  const missing = sdkLicenseOptions(
    new Request("https://voxylio.lndev.me/api/sdk/license/verify", { method: "OPTIONS" }),
  );
  assert.equal(missing.status, 403);
});

test("route rejects absent/insecure origins and null JSON safely", async () => {
  const fake = fakeDependencies();
  const absent = await verifySdkLicenseRequest(
    verificationRequest({ origin: null }),
    fake.deps,
  );
  assert.equal(absent.status, 400);
  assert.deepEqual(await absent.json(), { valid: false, reason: "invalid_origin" });

  const insecure = await verifySdkLicenseRequest(
    verificationRequest({ origin: "http://learn.example.com" }),
    fake.deps,
  );
  assert.equal(insecure.status, 400);

  const nullBody = await verifySdkLicenseRequest(
    verificationRequest({ body: "null" }),
    fake.deps,
  );
  assert.equal(nullBody.status, 400);
  assert.deepEqual(await nullBody.json(), { valid: false, reason: "bad_request" });
  assert.equal(nullBody.headers.get("access-control-allow-origin"), "https://learn.example.com");
});

test("invalid keys, versions and domains never consume a grant bucket", async () => {
  const badKeyFake = fakeDependencies({ findLicense: async () => null });
  const badKey = await verifySdkLicenseRequest(verificationRequest(), badKeyFake.deps);
  assert.equal(badKey.status, 401);
  assert.equal(badKeyFake.calls.preAuth, 1);
  assert.equal(badKeyFake.calls.rate, 0);

  const versionFake = fakeDependencies();
  const badVersion = await verifySdkLicenseRequest(
    verificationRequest({ body: { sdkVersion: "2.0.0", domain: "learn.example.com" } }),
    versionFake.deps,
  );
  assert.equal(badVersion.status, 403);
  assert.equal((await badVersion.json()).reason, "sdk_version_not_allowed");
  assert.equal(versionFake.calls.rate, 0);

  const domainFake = fakeDependencies({ listDomains: async () => ["other.example.com"] });
  const badDomain = await verifySdkLicenseRequest(verificationRequest(), domainFake.deps);
  assert.equal(badDomain.status, 403);
  assert.equal((await badDomain.json()).reason, "domain_not_allowed");
  assert.equal(domainFake.calls.rate, 0);
});

test("valid grants have CORS, use a pseudonymous bucket and throttle cleanly", async () => {
  const fake = fakeDependencies();
  const response = await verifySdkLicenseRequest(verificationRequest(), fake.deps);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://learn.example.com");
  assert.equal(response.headers.get("x-ratelimit-remaining"), "599");
  const payload = await response.json();
  assert.equal(payload.valid, true);
  assert.equal(payload.sdk.version, "1.0.0");
  assert.equal(fake.calls.rate, 1);
  assert.equal(fake.calls.preAuth, 1);
  assert.equal(fake.calls.touch, 1);
  assert.match(fake.calls.subject, /^[0-9a-f]{64}$/);

  const limited = fakeDependencies({
    consumeRateLimit: async () => ({
      allowed: false,
      limit: 600,
      remaining: 0,
      retryAfter: 42,
    }),
  });
  const throttled = await verifySdkLicenseRequest(verificationRequest(), limited.deps);
  assert.equal(throttled.status, 429);
  assert.equal(throttled.headers.get("retry-after"), "42");
  assert.equal((await throttled.json()).reason, "rate_limited");
});

test("coarse pre-auth limiting blocks random-key DB amplification", async () => {
  const fake = fakeDependencies({
    consumePreAuthRateLimit: async () => ({
      allowed: false,
      limit: 300,
      remaining: 0,
      retryAfter: 17,
    }),
  });
  const response = await verifySdkLicenseRequest(verificationRequest(), fake.deps);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "17");
  assert.equal(fake.calls.find, 0);
  assert.equal(fake.calls.rate, 0);
  assert.equal(fake.calls.touch, 0);
});
