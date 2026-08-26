import test from "node:test";
import assert from "node:assert/strict";
import { isFreeSite, planGate, trialDaysLeft } from "../src/plan.js";

test("isFreeSite: the five platforms and their subdomains, nothing else", () => {
  for (const h of [
    "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com",
    "www.netflix.com", "www.primevideo.com", "www.amazon.com", "www.amazon.co.uk",
    "www.disneyplus.com", "www.twitch.tv",
  ]) assert.ok(isFreeSite(h), h);
  for (const h of [
    "www.udemy.com", "coursera.org", "vimeo.com", "example.com",
    "notyoutube.com", "youtube.com.evil.io", "x.com", "",
  ]) assert.ok(!isFreeSite(h), h || "(empty)");
});

const NOW = Date.parse("2026-08-26T12:00:00Z");
const FUTURE = "2026-08-28T12:00:00Z";
const PAST = "2026-08-20T12:00:00Z";

test("planGate: pro dubs everywhere", () => {
  assert.deepEqual(
    planGate({ plan: "pro", trialEndsAt: PAST, now: NOW, hostname: "udemy.com" }),
    { allowed: true, reason: "pro" },
  );
});

test("planGate: active trial unlocks every site for free accounts", () => {
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: FUTURE, now: NOW, hostname: "udemy.com" }),
    { allowed: true, reason: "trial" },
  );
});

test("planGate: expired trial keeps the big platforms, locks the rest", () => {
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: PAST, now: NOW, hostname: "www.netflix.com" }),
    { allowed: true, reason: "freeSite" },
  );
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: PAST, now: NOW, hostname: "udemy.com" }),
    { allowed: false, reason: "locked" },
  );
});

test("planGate: missing trial info fails open (old server, stubs)", () => {
  assert.deepEqual(
    planGate({ plan: "free", trialEndsAt: null, now: NOW, hostname: "udemy.com" }),
    { allowed: true, reason: "legacy" },
  );
  assert.deepEqual(
    planGate({ plan: "free", now: NOW, hostname: "udemy.com" }).allowed,
    true,
  );
});

test("trialDaysLeft: ceil of remaining days, null when over or absent", () => {
  assert.equal(trialDaysLeft(FUTURE, NOW), 2);
  assert.equal(trialDaysLeft("2026-08-26T18:00:00Z", NOW), 1);
  assert.equal(trialDaysLeft(PAST, NOW), null);
  assert.equal(trialDaysLeft(null, NOW), null);
});
